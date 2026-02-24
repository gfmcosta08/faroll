"""
Webhook — recebe mensagens da UAZAPI e orquestra o bot.
"""
from fastapi import APIRouter, Request
from datetime import datetime, timezone, timedelta

from backend.database import get_db
from backend.services.bot_service import processar_mensagem
from execution.whatsapp_handler import parse_incoming_webhook, send_message

router = APIRouter(tags=["Webhook"])

# Minutos sem resposta humana → bot reativa automaticamente
BOT_REATIVACAO_MINUTOS = 10


def _identificar_empresa(numero_whatsapp: str):
    db = get_db()
    result = db.table("empresas").select("id, nome, grupo_whatsapp_id, ativo") \
        .eq("numero_whatsapp", numero_whatsapp).eq("ativo", True).execute()
    return result.data[0] if result.data else None


def _obter_ou_criar_lead(empresa_id: str, phone: str):
    db = get_db()
    result = db.table("leads").select(
        "id, nome, status_lead, corretor_id, bot_ativo, bot_desativado_em"
    ).eq("empresa_id", empresa_id).eq("telefone", phone).execute()

    if result.data:
        return result.data[0]

    novo = db.table("leads").insert({
        "empresa_id":            empresa_id,
        "telefone":              phone,
        "origem":                "whatsapp",
        "status_lead":           "novo",
        "bot_ativo":             True,
        "data_primeiro_contato": datetime.now(timezone.utc).isoformat(),
        "ultima_interacao":      datetime.now(timezone.utc).isoformat(),
    }).execute()

    return novo.data[0]


def _verificar_e_reativar_bot(lead: dict) -> bool:
    """
    Verifica se o bot deve ser reativado automaticamente.

    Regras:
    - Se bot_ativo = True  → retorna True (bot responde normalmente)
    - Se bot_ativo = False → checa última resposta humana nas interações
        - Se < 10 min desde desativação  → retorna False (humano está ativo)
        - Se >= 10 min sem resposta humana → reativa bot e retorna True
    """
    bot_ativo = lead.get("bot_ativo")
    if bot_ativo is None:
        bot_ativo = True

    if bot_ativo:
        return True  # Bot já está ativo

    # Bot está desativado — verifica há quanto tempo
    desativado_em_str = lead.get("bot_desativado_em")
    if not desativado_em_str:
        # Sem timestamp → assume desativado agora → não responde
        return False

    try:
        dt_des = datetime.fromisoformat(desativado_em_str)
        if dt_des.tzinfo is None:
            dt_des = dt_des.replace(tzinfo=timezone.utc)
        minutos_off = (datetime.now(timezone.utc) - dt_des).total_seconds() / 60
    except Exception:
        return False

    if minutos_off < BOT_REATIVACAO_MINUTOS:
        # Ainda dentro dos 10 min — humano pode estar respondendo
        return False

    # Passou dos 10 min → reativa bot automaticamente
    db = get_db()
    db.table("leads").update({
        "bot_ativo":             True,
        "bot_desativado_em":     None,
        "bot_desativado_por":    None,
    }).eq("id", lead["id"]).execute()

    print(f"[BOT] Lead {lead['id']} — bot reativado automaticamente após {int(minutos_off)} min")
    return True


@router.post("/webhook")
async def webhook(request: Request):
    try:
        data = await request.json()
    except Exception:
        return {"status": "invalid_payload"}

    # 1. Normaliza payload UAZAPI
    parsed = parse_incoming_webhook(data)
    if not parsed:
        return {"status": "ignored"}

    phone      = parsed["phone"]
    text       = parsed["text"]
    is_audio   = parsed["is_audio"]
    is_group   = parsed["is_group"]
    numero_bot = parsed.get("to") or _extrair_numero_destino(data)

    # 2. Ignora grupos
    if is_group:
        return {"status": "ignored_group"}

    # 3. Identifica empresa
    empresa = _identificar_empresa(numero_bot) if numero_bot else None
    if not empresa:
        print(f"[WEBHOOK] Empresa nao encontrada para numero: {numero_bot}")
        return {"status": "empresa_nao_encontrada"}

    empresa_id = empresa["id"]

    # 4. Áudio → avisa e para
    if is_audio:
        send_message(phone, "Oi! Por enquanto so consigo responder mensagens de texto. Pode me escrever?")
        return {"status": "audio_not_supported"}

    if not text:
        return {"status": "ignored_no_text"}

    # 5. Busca ou cria lead
    lead    = _obter_ou_criar_lead(empresa_id, phone)
    lead_id = lead["id"]

    # 6. Verifica se bot está ativo (ou deve reativar automaticamente)
    bot_deve_responder = _verificar_e_reativar_bot(lead)

    if not bot_deve_responder:
        # Salva a mensagem na tabela interacoes (para histórico) mas não responde
        db = get_db()
        db.table("interacoes").insert({
            "lead_id":  lead_id,
            "mensagem": text,
            "tipo":     "cliente",
            "data":     datetime.now(timezone.utc).isoformat(),
        }).execute()
        db.table("leads").update({
            "ultima_interacao": datetime.now(timezone.utc).isoformat()
        }).eq("id", lead_id).execute()
        print(f"[BOT] Lead {lead_id} — bot OFF, mensagem salva sem resposta")
        return {"status": "bot_desativado_humano_ativo"}

    # 7. Processa com o bot
    resposta = processar_mensagem(empresa_id, lead_id, phone, text)

    # 8. Envia resposta
    if resposta:
        send_message(phone, resposta)

    return {"status": "ok"}


def _extrair_numero_destino(data: dict) -> str:
    msg_data = data.get("data", data)
    return (
        msg_data.get("to")
        or msg_data.get("instance")
        or data.get("instance")
        or data.get("phone_number")
        or ""
    ).split("@")[0]
