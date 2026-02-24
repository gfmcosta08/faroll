"""
Bot Service — orquestra o fluxo de atendimento do WhatsApp.
Camada 2 (Orquestração) da arquitetura FOX.
"""
import os
import json
from datetime import datetime, timezone
from openai import OpenAI
from dotenv import load_dotenv

from backend.database import get_db

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Carrega diretiva do bot
_directive_path = os.path.join(os.path.dirname(__file__), "../../directives/bot_imobiliaria.md")
try:
    with open(_directive_path, "r", encoding="utf-8") as f:
        SYSTEM_PROMPT = f.read()
except Exception:
    SYSTEM_PROMPT = "Voce e uma secretaria virtual de uma imobiliaria."

# Definição das tools para o OpenAI
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "buscar_imoveis",
            "description": "Busca imoveis disponiveis no banco com base nos criterios do cliente",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo":      {"type": "string", "description": "casa, apartamento, terreno, chacara"},
                    "bairro":    {"type": "string", "description": "bairro de preferencia"},
                    "valor_max": {"type": "number", "description": "valor maximo em reais"},
                    "quartos":   {"type": "integer", "description": "numero minimo de quartos"},
                    "finalidade":{"type": "string", "description": "venda ou aluguel"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "qualificar_lead",
            "description": "Salva os dados de qualificacao do lead no banco",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome":         {"type": "string"},
                    "orcamento_min":{"type": "number"},
                    "orcamento_max":{"type": "number"},
                    "preferencias": {"type": "object", "description": "tipo, bairro, quartos, finalidade etc"},
                },
                "required": ["nome"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "escalar_para_humano",
            "description": "Notifica o grupo da imobiliaria para um corretor assumir o atendimento",
            "parameters": {
                "type": "object",
                "properties": {
                    "resumo": {"type": "string", "description": "Resumo da demanda do cliente"},
                },
                "required": ["resumo"],
            },
        },
    },
]


def _buscar_imoveis(empresa_id: str, args: dict) -> str:
    db = get_db()
    query = db.table("imoveis").select(
        "tipo, bairro, cidade, valor, quartos, metragem, finalidade, status, mobiliado, area_pet"
    ).eq("empresa_id", empresa_id).eq("status", "disponivel")

    if args.get("tipo"):
        query = query.eq("tipo", args["tipo"])
    if args.get("bairro"):
        query = query.eq("bairro", args["bairro"])
    if args.get("finalidade"):
        query = query.eq("finalidade", args["finalidade"])

    imoveis = query.execute().data

    # Filtra por valor e quartos em Python (REST API nao suporta lte/gte simples no nosso wrapper)
    if args.get("valor_max"):
        imoveis = [i for i in imoveis if i["valor"] <= args["valor_max"]]
    if args.get("quartos"):
        imoveis = [i for i in imoveis if i.get("quartos") and i["quartos"] >= args["quartos"]]

    if not imoveis:
        return "Nenhum imovel encontrado com esses criterios."

    linhas = []
    for i in imoveis[:3]:
        linhas.append(
            f"- {i['tipo'].capitalize()} em {i['bairro']}/{i['cidade']} | "
            f"R$ {i['valor']:,.0f} | {i.get('quartos', '?')} quartos | "
            f"{i.get('metragem', '?')}m2 | "
            f"{'Mobiliado' if i.get('mobiliado') else ''} "
            f"{'Pet' if i.get('area_pet') else ''}"
        )
    return "\n".join(linhas)


def _qualificar_lead(lead_id: str, args: dict) -> str:
    db = get_db()
    updates = {}
    if args.get("nome"):
        updates["nome"] = args["nome"]
    if args.get("orcamento_min"):
        updates["orcamento_min"] = args["orcamento_min"]
    if args.get("orcamento_max"):
        updates["orcamento_max"] = args["orcamento_max"]
    if args.get("preferencias"):
        updates["preferencias"] = args["preferencias"]
    if updates:
        db.table("leads").update(updates).eq("id", lead_id).execute()
    return "Lead qualificado com sucesso."


def _escalar_para_humano(empresa_id: str, lead_phone: str, resumo: str) -> str:
    """Envia mensagem para o grupo da empresa notificando um novo lead."""
    from execution.whatsapp_handler import send_group_message
    db = get_db()
    empresa = db.table("empresas").select("grupo_whatsapp_id, nome").eq("id", empresa_id).execute().data
    if not empresa or not empresa[0].get("grupo_whatsapp_id"):
        return "Escalado internamente (grupo nao configurado)."

    grupo_id = empresa[0]["grupo_whatsapp_id"]
    msg = (
        f"*Novo Lead para Atendimento*\n"
        f"Telefone: {lead_phone}\n"
        f"Resumo: {resumo}\n"
        f"O corretor que quiser assumir, entre em contato com o cliente."
    )
    send_group_message(grupo_id, msg)
    return "Notificacao enviada para o grupo da imobiliaria."


def _carregar_historico(lead_id: str) -> list:
    db = get_db()
    result = db.table("sessoes_bot").select("historico").eq("lead_id", lead_id).execute()
    if result.data:
        return result.data[0].get("historico", [])
    return []


def _salvar_historico(lead_id: str, historico: list):
    db = get_db()
    # Upsert manual: tenta update, se nao existir faz insert
    existing = db.table("sessoes_bot").select("id").eq("lead_id", lead_id).execute()
    payload = {"historico": historico, "ultima_atualizacao": datetime.now(timezone.utc).isoformat()}
    if existing.data:
        db.table("sessoes_bot").update(payload).eq("lead_id", lead_id).execute()
    else:
        db.table("sessoes_bot").insert({"lead_id": lead_id, **payload}).execute()


def _salvar_interacao(lead_id: str, mensagem: str, tipo: str, intencao: str = None):
    db = get_db()
    db.table("interacoes").insert({
        "lead_id":            lead_id,
        "mensagem":           mensagem,
        "tipo":               tipo,
        "intencao_detectada": intencao,
        "data":               datetime.now(timezone.utc).isoformat(),
    }).execute()

    # Atualiza ultima_interacao do lead
    db.table("leads").update({
        "ultima_interacao": datetime.now(timezone.utc).isoformat()
    }).eq("id", lead_id).execute()


def processar_mensagem(empresa_id: str, lead_id: str, lead_phone: str, texto: str) -> str:
    """
    Orquestra a resposta do bot para uma mensagem recebida.
    Retorna o texto que deve ser enviado de volta ao cliente.
    """
    # 1. Carrega histórico
    historico = _carregar_historico(lead_id)
    historico.append({"role": "user", "content": texto})

    # 2. Salva interação do cliente
    _salvar_interacao(lead_id, texto, "cliente")

    # 3. Processa com OpenAI (loop de tool calls)
    resposta_final = ""
    max_iteracoes = 5

    for _ in range(max_iteracoes):
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + historico,
            tools=TOOLS,
            tool_choice="auto",
        )

        msg = response.choices[0].message

        if msg.tool_calls:
            historico.append(msg)

            for tc in msg.tool_calls:
                func  = tc.function.name
                args  = json.loads(tc.function.arguments)
                result = ""

                if func == "buscar_imoveis":
                    result = _buscar_imoveis(empresa_id, args)

                elif func == "qualificar_lead":
                    result = _qualificar_lead(lead_id, args)

                elif func == "escalar_para_humano":
                    result = _escalar_para_humano(empresa_id, lead_phone, args.get("resumo", ""))
                    # Muda status do lead
                    db = get_db()
                    db.table("leads").update({"status_lead": "em_atendimento"}).eq("id", lead_id).execute()

                historico.append({
                    "role":         "tool",
                    "tool_call_id": tc.id,
                    "content":      result,
                })
        else:
            resposta_final = msg.content or ""
            historico.append({"role": "assistant", "content": resposta_final})
            break

    # 4. Salva histórico atualizado (máximo 30 mensagens)
    _salvar_historico(lead_id, historico[-30:])

    # 5. Salva resposta do bot
    if resposta_final:
        _salvar_interacao(lead_id, resposta_final, "bot")

    return resposta_final
