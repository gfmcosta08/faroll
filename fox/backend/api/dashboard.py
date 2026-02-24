from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from collections import Counter

from backend.database import get_db
from backend.api.auth import verify_token

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

# ── Fuso horário e horário comercial ──────────────────────────────
BRT = timezone(timedelta(hours=-3))

HORARIO_COMERCIAL = {
    0: (8, 18),  # Segunda
    1: (8, 18),  # Terça
    2: (8, 18),  # Quarta
    3: (8, 18),  # Quinta
    4: (8, 18),  # Sexta
    5: (8, 12),  # Sábado
    6: None,     # Domingo
}

DIAS_NOME = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]


def dt_brt(data_str: str):
    """Converte string ISO para datetime no fuso BRT."""
    if not data_str:
        return None
    try:
        dt = datetime.fromisoformat(data_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(BRT)
    except Exception:
        return None


def fora_do_horario_comercial(data_str: str) -> bool:
    dt = dt_brt(data_str)
    if not dt:
        return False
    dia_semana = dt.weekday()
    hora = dt.hour
    horario = HORARIO_COMERCIAL.get(dia_semana)
    if horario is None:
        return True
    inicio, fim = horario
    return hora < inicio or hora >= fim


def inicio_mes_brt():
    now = datetime.now(BRT)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def comissao_imovel(im: dict) -> float:
    vv  = im.get("valor_venda") or 0
    pct = im.get("comissao_pct") or 6.0
    return float(vv) * float(pct) / 100


# ═══════════════════════════════════════════════════════════════════
#  ENDPOINT: DONO / GERENTE
# ═══════════════════════════════════════════════════════════════════
@router.get("/empresa")
def dashboard_empresa(me: dict = Depends(verify_token)):
    if me["perfil"] not in ("gerente", "admin"):
        raise HTTPException(status_code=403, detail="Acesso restrito a gerentes")

    db         = get_db()
    empresa_id = me["empresa_id"]
    now_brt    = datetime.now(BRT)
    mes_inicio = inicio_mes_brt()

    # ── Fetch base ─────────────────────────────────────────────
    imoveis    = db.table("imoveis").select("*").eq("empresa_id", empresa_id).execute().data
    leads      = db.table("leads").select("*").eq("empresa_id", empresa_id).execute().data
    corretores = db.table("corretores").select("id, nome, perfil") \
        .eq("empresa_id", empresa_id).eq("ativo", True).execute().data

    # ── Separações de imóveis ───────────────────────────────────
    disponiveis       = [i for i in imoveis if i["status"] == "disponivel"]
    vendidos_corretor = [i for i in imoveis if i["status"] == "vendido_corretor"]
    vendidos_outros   = [i for i in imoveis if i["status"] == "vendido_outro"]
    todos_vendidos    = vendidos_corretor + vendidos_outros

    # ── Financeiro ─────────────────────────────────────────────
    fat_total = round(sum(comissao_imovel(i) for i in vendidos_corretor), 2)

    fat_mes = round(sum(
        comissao_imovel(i) for i in vendidos_corretor
        if dt_brt(i.get("data_venda")) and dt_brt(i["data_venda"]) >= mes_inicio
    ), 2)

    vals_venda    = [float(i["valor_venda"]) for i in todos_vendidos if i.get("valor_venda")]
    ticket_medio  = round(sum(vals_venda) / len(vals_venda), 2) if vals_venda else 0
    valor_captado = round(sum(float(i["valor"]) for i in disponiveis if i.get("valor")), 2)
    valor_vendido = round(sum(vals_venda), 2)

    leads_proposta = [l for l in leads if l["status_lead"] == "proposta"]
    pipeline_valor = round(sum(float(l.get("orcamento_max") or 0) for l in leads_proposta), 2)

    # Por corretor (faturamento)
    fat_por_corretor = []
    for c in corretores:
        vendas_c = [i for i in vendidos_corretor if i.get("corretor_id") == c["id"]]
        fat_por_corretor.append({
            "id":          c["id"],
            "nome":        c["nome"],
            "vendas":      len(vendas_c),
            "faturamento": round(sum(comissao_imovel(i) for i in vendas_c), 2),
        })
    fat_por_corretor.sort(key=lambda x: x["faturamento"], reverse=True)

    # ── Comercial ──────────────────────────────────────────────
    total_leads    = len(leads)
    leads_fechados = [l for l in leads if l["status_lead"] == "fechado"]
    leads_perdidos = [l for l in leads if l["status_lead"] == "perdido"]
    conversao_geral = round(len(leads_fechados) / total_leads * 100, 1) if total_leads else 0

    perdidos_com_motivo = [
        {"nome": l.get("nome") or l["telefone"], "motivo": l.get("motivo_perda") or "Não informado"}
        for l in leads_perdidos if l.get("motivo_perda")
    ][:10]

    # Tempo médio até venda (dias)
    tempos = []
    for i in todos_vendidos:
        dv = dt_brt(i.get("data_venda"))
        dc = dt_brt(i.get("data_cadastro"))
        if dv and dc:
            tempos.append((dv - dc).days)
    tempo_medio_venda = round(sum(tempos) / len(tempos)) if tempos else 0

    # Conversão por corretor
    conv_por_corretor = []
    for c in corretores:
        leads_c   = [l for l in leads if l.get("corretor_id") == c["id"]]
        fechados_c = sum(1 for l in leads_c if l["status_lead"] == "fechado")
        conv_por_corretor.append({
            "id":            c["id"],
            "nome":          c["nome"],
            "total_leads":   len(leads_c),
            "fechados":      fechados_c,
            "conversao_pct": round(fechados_c / len(leads_c) * 100, 1) if leads_c else 0,
        })

    # ── Mercado ────────────────────────────────────────────────
    bairros = [l["bairro_interesse"] for l in leads if l.get("bairro_interesse")]
    bairros_top = [{"bairro": b, "count": c} for b, c in Counter(bairros).most_common(5)]

    tipos_int = [l["tipo_imovel_interesse"] for l in leads if l.get("tipo_imovel_interesse")]
    tipos_top = [{"tipo": t, "count": c} for t, c in Counter(tipos_int).most_common(5)]

    parados_30 = sum(
        1 for i in disponiveis
        if dt_brt(i.get("data_cadastro")) and
        (now_brt - dt_brt(i["data_cadastro"])).days > 30
    )
    parados_60 = sum(
        1 for i in disponiveis
        if dt_brt(i.get("data_cadastro")) and
        (now_brt - dt_brt(i["data_cadastro"])).days > 60
    )

    # ── Ranking corretores (unificado) ─────────────────────────
    ranking = []
    for c in corretores:
        leads_c    = [l for l in leads if l.get("corretor_id") == c["id"]]
        fechados_c = sum(1 for l in leads_c if l["status_lead"] == "fechado")
        vendas_c   = [i for i in vendidos_corretor if i.get("corretor_id") == c["id"]]
        fat_c      = round(sum(comissao_imovel(i) for i in vendas_c), 2)
        ranking.append({
            "id":            c["id"],
            "nome":          c["nome"],
            "vendas":        len(vendas_c),
            "faturamento":   fat_c,
            "total_leads":   len(leads_c),
            "fechados":      fechados_c,
            "conversao_pct": round(fechados_c / len(leads_c) * 100, 1) if leads_c else 0,
        })
    ranking.sort(key=lambda x: x["faturamento"], reverse=True)

    # ── Automação Bot ──────────────────────────────────────────
    leads_fora          = [l for l in leads if fora_do_horario_comercial(l.get("data_primeiro_contato", ""))]
    leads_fora_venda    = [l for l in leads_fora if l["status_lead"] == "fechado"]
    leads_fora_aguard   = [l for l in leads_fora if not l.get("corretor_id") and l["status_lead"] not in ("fechado", "perdido")]

    valor_gerado_fora = round(len(leads_fora_venda) * ticket_medio, 2)
    pct_fora = round(len(leads_fora) / total_leads * 100, 1) if total_leads else 0

    total_interacoes_fora = 0
    interacoes_por_dia    = {d: 0 for d in DIAS_NOME}
    lead_ids = [l["id"] for l in leads]
    # Limita para não sobrecarregar (busca em lotes de 30)
    for lid in lead_ids[:30]:
        ints = db.table("interacoes").select("data, tipo") \
            .eq("lead_id", lid).execute().data
        for i in ints:
            if i["tipo"] == "cliente" and fora_do_horario_comercial(i["data"]):
                total_interacoes_fora += 1
                d = dt_brt(i["data"])
                if d:
                    interacoes_por_dia[DIAS_NOME[d.weekday()]] += 1

    return {
        "financeiro": {
            "faturamento_total":   fat_total,
            "faturamento_mes":     fat_mes,
            "ticket_medio":        ticket_medio,
            "valor_captado":       valor_captado,
            "valor_total_vendido": valor_vendido,
            "pipeline_valor":      pipeline_valor,
            "por_corretor":        fat_por_corretor,
        },
        "comercial": {
            "total_leads":           total_leads,
            "conversao_geral":       conversao_geral,
            "leads_fechados":        len(leads_fechados),
            "leads_perdidos":        len(leads_perdidos),
            "leads_abertos":         total_leads - len(leads_fechados) - len(leads_perdidos),
            "perdidos_com_motivo":   perdidos_com_motivo,
            "tempo_medio_venda_dias": tempo_medio_venda,
            "por_corretor":          conv_por_corretor,
        },
        "imoveis": {
            "total":             len(imoveis),
            "ativos":            len(disponiveis),
            "vendidos_corretor": len(vendidos_corretor),
            "vendidos_outros":   len(vendidos_outros),
            "parados_30_dias":   parados_30,
            "parados_60_dias":   parados_60,
        },
        "mercado": {
            "bairros_mais_buscados": bairros_top,
            "tipos_mais_buscados":   tipos_top,
        },
        "ranking_corretores": ranking,
        "atendimento_bot": {
            "total_interacoes_fora_horario": total_interacoes_fora,
            "leads_captados_fora_horario":   len(leads_fora),
            "pct_leads_fora_horario":        pct_fora,
            "leads_fora_viraram_venda":      len(leads_fora_venda),
            "valor_gerado_fora":             valor_gerado_fora,
            "leads_aguardando_retorno":      len(leads_fora_aguard),
            "distribuicao_por_dia":          interacoes_por_dia,
            "horario_comercial": {
                "seg_sex": "08:00 - 18:00",
                "sabado":  "08:00 - 12:00",
                "domingo": "fechado",
            },
        },
    }


# ═══════════════════════════════════════════════════════════════════
#  ENDPOINT: CORRETOR
# ═══════════════════════════════════════════════════════════════════
@router.get("/corretor")
def dashboard_corretor(me: dict = Depends(verify_token)):
    db          = get_db()
    empresa_id  = me["empresa_id"]
    corretor_id = me["sub"]
    now_brt     = datetime.now(BRT)
    mes_inicio  = inicio_mes_brt()

    imoveis = db.table("imoveis").select("*") \
        .eq("empresa_id", empresa_id).eq("corretor_id", corretor_id).execute().data
    leads = db.table("leads").select("*") \
        .eq("empresa_id", empresa_id).eq("corretor_id", corretor_id).execute().data

    # ── Leads por status ───────────────────────────────────────
    def cnt(st): return sum(1 for l in leads if l["status_lead"] == st)
    leads_por_status = {
        "novo":           cnt("novo"),
        "em_atendimento": cnt("em_atendimento"),
        "visita":         cnt("visita"),
        "proposta":       cnt("proposta"),
        "fechado":        cnt("fechado"),
        "perdido":        cnt("perdido"),
    }

    leads_fora = [l for l in leads if fora_do_horario_comercial(l.get("data_primeiro_contato", ""))]

    # ── Performance pessoal ────────────────────────────────────
    vendidos     = [i for i in imoveis if i["status"] == "vendido_corretor"]
    fat_total    = round(sum(comissao_imovel(i) for i in vendidos), 2)
    fat_mes      = round(sum(
        comissao_imovel(i) for i in vendidos
        if dt_brt(i.get("data_venda")) and dt_brt(i["data_venda"]) >= mes_inicio
    ), 2)
    vendas_mes   = sum(1 for i in vendidos if dt_brt(i.get("data_venda")) and dt_brt(i["data_venda"]) >= mes_inicio)
    vals_venda   = [float(i["valor_venda"]) for i in vendidos if i.get("valor_venda")]
    ticket_medio = round(sum(vals_venda) / len(vals_venda), 2) if vals_venda else 0

    total_leads = len(leads)
    fechados    = cnt("fechado")
    conversao   = round(fechados / total_leads * 100, 1) if total_leads else 0

    # ── Alertas: leads parados há mais de 24h ─────────────────
    alertas = []
    leads_ativos = [l for l in leads if l["status_lead"] in ("em_atendimento", "proposta", "visita", "novo")]
    for l in leads_ativos[:20]:  # limita para performance
        ints = db.table("interacoes").select("data, tipo") \
            .eq("lead_id", l["id"]).order("data", desc=True).execute().data
        ultima = ints[0]["data"] if ints else l.get("data_primeiro_contato")
        if ultima:
            dt_ul = dt_brt(ultima)
            if dt_ul:
                horas = round((now_brt - dt_ul).total_seconds() / 3600)
                if horas >= 24:
                    alertas.append({
                        "lead_id":     l["id"],
                        "nome":        l.get("nome") or l["telefone"],
                        "status":      l["status_lead"],
                        "horas_parado": horas,
                    })
    alertas.sort(key=lambda x: x["horas_parado"], reverse=True)

    return {
        "meus_imoveis": {
            "total":    len(imoveis),
            "ativos":   sum(1 for i in imoveis if i["status"] == "disponivel"),
            "vendidos": len(vendidos),
        },
        "leads_por_status":  leads_por_status,
        "leads_fora_horario": len(leads_fora),
        "performance": {
            "vendas_mes":     vendas_mes,
            "comissao_total": fat_total,
            "comissao_mes":   fat_mes,
            "ticket_medio":   ticket_medio,
            "conversao_pct":  conversao,
            "total_leads":    total_leads,
            "leads_fechados": fechados,
        },
        "alertas": alertas[:5],
    }


# ═══════════════════════════════════════════════════════════════════
#  ENDPOINT: SECRETÁRIA
# ═══════════════════════════════════════════════════════════════════
@router.get("/secretaria")
def dashboard_secretaria(me: dict = Depends(verify_token)):
    if me["perfil"] not in ("secretaria", "gerente", "admin"):
        raise HTTPException(status_code=403, detail="Acesso não autorizado")

    db         = get_db()
    empresa_id = me["empresa_id"]
    now_brt    = datetime.now(BRT)
    hoje       = now_brt.date()

    leads      = db.table("leads").select("*").eq("empresa_id", empresa_id).execute().data
    corretores = db.table("corretores").select("id, nome") \
        .eq("empresa_id", empresa_id).eq("ativo", True).execute().data

    # ── Hoje ───────────────────────────────────────────────────
    leads_hoje = [
        l for l in leads
        if dt_brt(l.get("data_primeiro_contato")) and
        dt_brt(l["data_primeiro_contato"]).date() == hoje
    ]

    # ── Fora do horário sem responsável ────────────────────────
    leads_fora_sem_resp = [
        l for l in leads
        if fora_do_horario_comercial(l.get("data_primeiro_contato", ""))
        and not l.get("corretor_id")
        and l["status_lead"] not in ("fechado", "perdido")
    ]

    # ── Leads em aberto ────────────────────────────────────────
    leads_abertos = [l for l in leads if l["status_lead"] not in ("fechado", "perdido")]
    leads_sem_resp = [l for l in leads_abertos if not l.get("corretor_id")]

    # ── Resumo por status ──────────────────────────────────────
    def cnt(st): return sum(1 for l in leads if l["status_lead"] == st)
    resumo_status = {
        "novo":           cnt("novo"),
        "em_atendimento": cnt("em_atendimento"),
        "visita":         cnt("visita"),
        "proposta":       cnt("proposta"),
        "fechado":        cnt("fechado"),
        "perdido":        cnt("perdido"),
    }

    # ── Distribuição por corretor ──────────────────────────────
    distribuicao = []
    for c in corretores:
        leads_c = [l for l in leads_abertos if l.get("corretor_id") == c["id"]]
        distribuicao.append({
            "id":              c["id"],
            "nome":            c["nome"],
            "total":           len(leads_c),
            "novo":            sum(1 for l in leads_c if l["status_lead"] == "novo"),
            "em_atendimento":  sum(1 for l in leads_c if l["status_lead"] == "em_atendimento"),
            "visita":          sum(1 for l in leads_c if l["status_lead"] == "visita"),
            "proposta":        sum(1 for l in leads_c if l["status_lead"] == "proposta"),
        })
    distribuicao.sort(key=lambda x: x["total"], reverse=True)

    return {
        "hoje": {
            "leads_novos":                len(leads_hoje),
            "leads_fora_horario_sem_resp": len(leads_fora_sem_resp),
            "propostas_ativas":           cnt("proposta"),
            "visitas_agendadas":          cnt("visita"),
        },
        "leads_abertos":    len(leads_abertos),
        "leads_sem_responsavel": [
            {
                "id":     l["id"],
                "nome":   l.get("nome") or l["telefone"],
                "status": l["status_lead"],
                "data":   l.get("data_primeiro_contato"),
                "fora_horario": fora_do_horario_comercial(l.get("data_primeiro_contato", "")),
            }
            for l in leads_sem_resp[:20]
        ],
        "distribuicao_por_corretor": distribuicao,
        "fila_cheia": [d for d in distribuicao if d["total"] > 10],
        "resumo_status": resumo_status,
    }
