import requests
import os
from dotenv import load_dotenv

load_dotenv()

# uazapiGO v2 — configure estas variáveis no .env
BASE_URL = os.getenv("UAZAPI_BASE_URL")   # ex: https://app.uazapi.dev
TOKEN    = os.getenv("UAZAPI_TOKEN")       # Token da instância no painel uazapiGO
INSTANCE = os.getenv("UAZAPI_INSTANCE")   # Nome da instância (session)

HEADERS = {
    "Content-Type": "application/json",
    "TOKEN": TOKEN,
}


def send_message(phone: str, text: str) -> dict | None:
    """
    Envia mensagem de texto para um número individual via uazapiGO v2.

    Args:
        phone: Número no formato internacional sem '+' (ex: '5511999999999')
        text:  Texto da mensagem
    """
    url = f"{BASE_URL}/send/text"
    payload = {
        "phone": phone,
        "message": text,
    }
    try:
        response = requests.post(url, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[UAZAPI] Erro ao enviar mensagem para {phone}: {e}")
        return None


def send_group_message(group_id: str, text: str) -> dict | None:
    """
    Envia mensagem de texto para um grupo do WhatsApp via uazapiGO v2.

    Args:
        group_id: ID do grupo no formato '120363XXXXXXXXXX@g.us'
                  (disponível no painel UAZAPI ou via webhook do grupo)
        text:     Texto da mensagem
    """
    url = f"{BASE_URL}/send/text"
    payload = {
        "phone": group_id,
        "message": text,
    }
    try:
        response = requests.post(url, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[UAZAPI] Erro ao enviar mensagem para grupo {group_id}: {e}")
        return None


def send_audio_url(phone: str, audio_url: str) -> dict | None:
    """
    Envia um arquivo de áudio via URL para um número individual.

    Args:
        phone:     Número no formato internacional sem '+'
        audio_url: URL pública do arquivo de áudio (.ogg, .mp3)
    """
    url = f"{BASE_URL}/send/audio"
    payload = {
        "phone": phone,
        "audio": audio_url,
    }
    try:
        response = requests.post(url, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[UAZAPI] Erro ao enviar áudio para {phone}: {e}")
        return None


def parse_incoming_webhook(data: dict) -> dict | None:
    """
    Normaliza o payload do webhook recebido da uazapiGO v2.

    Retorna um dicionário padronizado com:
        phone     - número do remetente (sem '@s.whatsapp.net')
        text      - texto da mensagem (None se for áudio)
        is_audio  - True se a mensagem for de áudio
        audio_url - URL do áudio (se is_audio=True)
        is_group  - True se veio de um grupo
        group_id  - ID do grupo (se is_group=True)
        raw       - payload original completo

    Retorna None se não for um evento de mensagem recebida.

    NOTA: ajuste os campos abaixo conforme o payload real que você
    receber no webhook.site ao testar sua instância UAZAPI.
    """
    # uazapiGO v2 envia eventos com o campo 'type' indicando o tipo
    event_type = data.get("type", "")

    # Aceita apenas eventos de mensagem recebida
    if event_type not in ("ReceivedCallback", "message", "messages.upsert"):
        return None

    # Extrai o bloco de dados principal (varia entre versões)
    msg_data = data.get("data", data)

    # Número do remetente — remove sufixo '@s.whatsapp.net' se presente
    raw_phone = (
        msg_data.get("phone")
        or msg_data.get("from")
        or msg_data.get("key", {}).get("remoteJid", "")
    )
    phone = raw_phone.split("@")[0]

    if not phone:
        return None

    # Verifica se é grupo
    is_group = "@g.us" in raw_phone
    group_id = raw_phone if is_group else None

    # Extrai texto da mensagem
    message_block = msg_data.get("message", {})
    text = (
        msg_data.get("text")
        or msg_data.get("body")
        or message_block.get("conversation")
        or message_block.get("extendedTextMessage", {}).get("text")
    )

    # Verifica se é áudio
    is_audio = (
        msg_data.get("type") == "audio"
        or "audioMessage" in message_block
        or msg_data.get("messageType") == "audioMessage"
    )
    audio_url = (
        msg_data.get("audio")
        or msg_data.get("mediaUrl")
        or message_block.get("audioMessage", {}).get("url")
    )

    if not text and not is_audio:
        return None  # ignora stickers, reações, etc.

    return {
        "phone": phone,
        "text": text,
        "is_audio": is_audio,
        "audio_url": audio_url,
        "is_group": is_group,
        "group_id": group_id,
        "raw": data,
    }
