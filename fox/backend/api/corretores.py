from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
import bcrypt

from backend.database import get_db
from backend.models.schemas import CorretorCreate, CorretorOut
from backend.api.auth import verify_token

BRT = timezone(timedelta(hours=-3))

def _dt_brt(s):
    if not s: return None
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(BRT)
    except: return None

def _inicio_mes():
    now = datetime.now(BRT)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

router = APIRouter(prefix="/api/corretores", tags=["Corretores"])


@router.get("")
def listar_corretores(me: dict = Depends(verify_token)):
    db = get_db()
    result = db.table("corretores").select("id,nome,email,telefone,perfil,ativo,created_at") \
        .eq("empresa_id", me["empresa_id"]).execute()
    return result.data


@router.post("")
def criar_corretor(body: CorretorCreate, me: dict = Depends(verify_token)):
    if me["perfil"] not in ("gerente", "admin"):
        raise HTTPException(status_code=403, detail="Apenas gerentes podem criar corretores")

    db = get_db()
    db.table("corretores").insert({
        "empresa_id": me["empresa_id"],
        "nome":       body.nome,
        "email":      body.email,
        "telefone":   body.telefone,
        "perfil":     body.perfil,
        "senha_hash": bcrypt.hashpw(body.senha.encode(), bcrypt.gensalt()).decode(),
    }).execute()

    return {"status": "criado"}


@router.put("/{corretor_id}/desativar")
def desativar_corretor(corretor_id: str, me: dict = Depends(verify_token)):
    if me["perfil"] not in ("gerente", "admin"):
        raise HTTPException(status_code=403, detail="Apenas gerentes podem desativar corretores")

    db = get_db()
    db.table("corretores").update({"ativo": False}) \
        .eq("id", corretor_id).eq("empresa_id", me["empresa_id"]).execute()

    return {"status": "desativado"}


@router.get("/{corretor_id}/metricas")
def metricas_corretor(corretor_id: str, me: dict = Depends(verify_token)):
    """Métricas completas de um corretor específico — para o gerente."""
    if me["perfil"] not in ("gerente", "admin"):
        raise HTTPException(status_code=403, detail="Acesso restrito a gerentes")

    db         = get_db()
    empresa_id = me["empresa_id"]
    mes_inicio = _inicio_mes()
    agora      = datetime.now(BRT)

    # Dados do corretor
    c_result = db.table("corretores").select("id, nome, email, telefone, perfil, created_at, ativo") \
        .eq("id", corretor_id).eq("empresa_id", empresa_id).execute()
    if not c_result.data:
        raise HTTPException(status_code=404, detail="Corretor não encontrado")
    corretor = c_result.data[0]

    # Imóveis
    imoveis = db.table("imoveis").select("*") \
        .eq("empresa_id", empresa_id).eq("corretor_id", corretor_id).execute().data

    # Leads
    leads = db.table("leads").select("*") \
        .eq("empresa_id", empresa_id).eq("corretor_id", corretor_id).execute().data

    # ── Imóveis ──────────────────────────────────────────────────
    disponiveis = [i for i in imoveis if i["status"] == "disponivel"]
    vendidos    = [i for i in imoveis if i["status"] == "vendido_corretor"]

    def comissao(im):
        vv  = float(im.get("valor_venda") or 0)
        pct = float(im.get("comissao_pct") or 6)
        return vv * pct / 100

    fat_total = round(sum(comissao(i) for i in vendidos), 2)
    fat_mes   = round(sum(
        comissao(i) for i in vendidos
        if _dt_brt(i.get("data_venda")) and _dt_brt(i["data_venda"]) >= mes_inicio
    ), 2)
    vendas_mes = sum(1 for i in vendidos if _dt_brt(i.get("data_venda")) and _dt_brt(i["data_venda"]) >= mes_inicio)

    vals_venda   = [float(i["valor_venda"]) for i in vendidos if i.get("valor_venda")]
    ticket_medio = round(sum(vals_venda) / len(vals_venda), 2) if vals_venda else 0

    # Tempo médio de venda
    tempos = []
    for i in vendidos:
        dv = _dt_brt(i.get("data_venda"))
        dc = _dt_brt(i.get("data_cadastro"))
        if dv and dc:
            tempos.append((dv - dc).days)
    tempo_medio_venda = round(sum(tempos) / len(tempos)) if tempos else 0

    # Imóveis parados > 30 dias
    parados_30 = sum(
        1 for i in disponiveis
        if _dt_brt(i.get("data_cadastro")) and
        (agora - _dt_brt(i["data_cadastro"])).days > 30
    )

    # ── Leads ────────────────────────────────────────────────────
    total_leads = len(leads)
    def cnt(st): return sum(1 for l in leads if l["status_lead"] == st)

    leads_por_status = {
        "novo": cnt("novo"), "em_atendimento": cnt("em_atendimento"),
        "visita": cnt("visita"), "proposta": cnt("proposta"),
        "fechado": cnt("fechado"), "perdido": cnt("perdido"),
    }
    fechados   = cnt("fechado")
    conversao  = round(fechados / total_leads * 100, 1) if total_leads else 0

    # Leads do mês
    leads_mes = sum(
        1 for l in leads
        if _dt_brt(l.get("data_primeiro_contato")) and
        _dt_brt(l["data_primeiro_contato"]) >= mes_inicio
    )

    # Leads perdidos com motivo
    perdidos = [
        {"nome": l.get("nome") or l["telefone"], "motivo": l.get("motivo_perda") or "Não informado"}
        for l in leads if l["status_lead"] == "perdido" and l.get("motivo_perda")
    ][:5]

    # Alertas: leads parados > 24h
    alertas = []
    leads_ativos = [l for l in leads if l["status_lead"] in ("em_atendimento", "proposta", "visita")]
    for l in leads_ativos[:15]:
        ultima_int = l.get("ultima_interacao") or l.get("data_primeiro_contato")
        if ultima_int:
            dt_ul = _dt_brt(ultima_int)
            if dt_ul:
                horas = round((agora - dt_ul).total_seconds() / 3600)
                if horas >= 24:
                    alertas.append({
                        "lead_id": l["id"],
                        "nome": l.get("nome") or l["telefone"],
                        "status": l["status_lead"],
                        "horas_parado": horas,
                    })

    return {
        "corretor": corretor,
        "imoveis": {
            "total":             len(imoveis),
            "disponiveis":       len(disponiveis),
            "vendidos":          len(vendidos),
            "parados_30_dias":   parados_30,
        },
        "financeiro": {
            "faturamento_total": fat_total,
            "faturamento_mes":   fat_mes,
            "vendas_mes":        vendas_mes,
            "ticket_medio":      ticket_medio,
            "tempo_medio_venda_dias": tempo_medio_venda,
        },
        "leads": {
            "total":         total_leads,
            "leads_mes":     leads_mes,
            "conversao_pct": conversao,
            "fechados":      fechados,
            "por_status":    leads_por_status,
        },
        "perdidos_com_motivo": perdidos,
        "alertas": sorted(alertas, key=lambda x: x["horas_parado"], reverse=True),
    }
