from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from backend.database import get_db
from backend.models.schemas import LeadUpdate
from backend.api.auth import verify_token

router = APIRouter(prefix="/api/leads", tags=["Leads"])

BOT_REATIVACAO_MINUTOS = 10


@router.get("")
def listar_leads(
    status_lead: str = None,
    me: dict = Depends(verify_token)
):
    db = get_db()
    query = db.table("leads").select("*, interacoes(id, tipo, data, mensagem)") \
        .eq("empresa_id", me["empresa_id"])

    # Corretor só vê seus leads; gerente vê todos
    if me["perfil"] == "corretor":
        query = query.eq("corretor_id", me["sub"])

    if status_lead:
        query = query.eq("status_lead", status_lead)

    return query.order("ultima_interacao", desc=True).execute().data


# ── Rota estática ANTES do parâmetro /{lead_id} ───────────────────────────────

@router.get("/bot-status")
def listar_bot_status(me: dict = Depends(verify_token)):
    """
    Retorna todos os leads ativos com status do bot.
    Usado pelo painel da secretária.
    """
    if me["perfil"] not in ("secretaria", "gerente", "admin"):
        raise HTTPException(status_code=403, detail="Acesso não autorizado")

    db = get_db()
    leads = db.table("leads").select(
        "id, nome, telefone, status_lead, bot_ativo, bot_desativado_em, bot_desativado_por, ultima_interacao, corretor_id"
    ).eq("empresa_id", me["empresa_id"]) \
     .order("ultima_interacao", desc=True).execute().data

    agora = datetime.now(timezone.utc)
    resultado = []
    for l in leads:
        if l["status_lead"] in ("fechado", "perdido"):
            continue

        # Calcula minutos desde desativação do bot
        minutos_off = None
        reativa_em  = None
        if not (l.get("bot_ativo") if l.get("bot_ativo") is not None else True):
            desativado_em_str = l.get("bot_desativado_em")
            if desativado_em_str:
                try:
                    dt_des = datetime.fromisoformat(desativado_em_str)
                    if dt_des.tzinfo is None:
                        dt_des = dt_des.replace(tzinfo=timezone.utc)
                    minutos_off = int((agora - dt_des).total_seconds() / 60)
                    reativa_em  = max(0, BOT_REATIVACAO_MINUTOS - minutos_off)
                except Exception:
                    pass

        resultado.append({
            **l,
            "bot_ativo":    l.get("bot_ativo") if l.get("bot_ativo") is not None else True,
            "minutos_off":  minutos_off,
            "reativa_em":   reativa_em,   # minutos restantes para reativação automática
        })

    return resultado


# ── Rotas parametrizadas ───────────────────────────────────────────────────────

@router.get("/{lead_id}")
def buscar_lead(lead_id: str, me: dict = Depends(verify_token)):
    db = get_db()
    result = db.table("leads").select("*, interacoes(*)") \
        .eq("id", lead_id).eq("empresa_id", me["empresa_id"]).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Lead não encontrado")

    return result.data[0]


@router.put("/{lead_id}")
def atualizar_lead(lead_id: str, body: LeadUpdate, me: dict = Depends(verify_token)):
    db = get_db()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")

    result = db.table("leads").update(updates) \
        .eq("id", lead_id).eq("empresa_id", me["empresa_id"]).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Lead não encontrado")

    return result.data[0]


@router.post("/{lead_id}/assumir")
def assumir_lead(lead_id: str, me: dict = Depends(verify_token)):
    db = get_db()

    # Verifica se lead pertence à empresa
    result = db.table("leads").select("id, corretor_id") \
        .eq("id", lead_id).eq("empresa_id", me["empresa_id"]).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Lead não encontrado")

    if result.data[0]["corretor_id"]:
        raise HTTPException(status_code=409, detail="Lead já foi assumido por outro corretor")

    db.table("leads").update({
        "corretor_id": me["sub"],
        "status_lead": "em_atendimento",
        "ultima_interacao": datetime.utcnow().isoformat(),
    }).eq("id", lead_id).execute()

    return {"status": "assumido"}


@router.post("/{lead_id}/bot/toggle")
def toggle_bot(lead_id: str, me: dict = Depends(verify_token)):
    """
    Liga ou desliga o bot para um lead específico.
    Quando desativado, o bot para de responder.
    Quando reativado (manual ou automático), volta a responder.
    """
    db = get_db()
    result = db.table("leads").select("id, bot_ativo, nome, telefone") \
        .eq("id", lead_id).eq("empresa_id", me["empresa_id"]).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Lead não encontrado")

    lead       = result.data[0]
    bot_atual  = lead.get("bot_ativo")
    # Se bot_ativo é None (coluna nova), assume True
    if bot_atual is None:
        bot_atual = True

    novo_estado = not bot_atual
    agora = datetime.now(timezone.utc).isoformat()

    updates = {"bot_ativo": novo_estado}
    if not novo_estado:
        # Desativando: registra quando e quem desativou
        updates["bot_desativado_em"]  = agora
        updates["bot_desativado_por"] = me.get("nome", me["sub"])
    else:
        # Reativando: limpa os campos
        updates["bot_desativado_em"]  = None
        updates["bot_desativado_por"] = None

    db.table("leads").update(updates).eq("id", lead_id).execute()

    return {
        "lead_id":   lead_id,
        "bot_ativo": novo_estado,
        "alterado_por": me.get("nome", me["sub"]),
        "em": agora,
    }
