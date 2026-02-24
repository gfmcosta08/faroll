from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import datetime
from dotenv import load_dotenv

# Import our Layer 3 (Execution) tools
from execution.whatsapp_handler import send_message, parse_incoming_webhook
from execution.google_calendar_tool import get_free_slots, create_event
from execution.database_handler import DatabaseHandler
from execution.ai_processor import AIProcessor

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for the React dashboard

# Initialize Handlers
db = DatabaseHandler()
ai = AIProcessor(directive_path="directives/app_fox_secretary.md")

# In-memory session (use Redis/Postgres for multi-instance)
user_sessions = {}

def handle_ai_tools(user_id, ai_msg, history):
    """
    Executes tools requested by the AI and returns the updated history.
    """
    if not ai_msg.tool_calls:
        return None

    for tool_call in ai_msg.tool_calls:
        func_name = tool_call.function.name
        args = json.loads(tool_call.function.arguments)
        
        reply_content = ""
        
        if func_name == "check_availability":
            slots = get_free_slots(args['date'])
            if slots:
                reply_content = f"Para o dia {args['date']}, tenho estes horários livres: {', '.join(slots)}. Algum destes funciona para você?"
            else:
                reply_content = f"Infelizmente não tenho horários disponíveis para o dia {args['date']}. Gostaria de tentar outro dia?"
        
        elif func_name == "book_appointment":
            start_dt = datetime.datetime.fromisoformat(args['start'].replace('Z', '+00:00'))
            end_dt = start_dt + datetime.timedelta(hours=1)
            link = create_event(start_dt.isoformat(), end_dt.isoformat(), args['summary'])
            reply_content = f"Perfeito! Agendamento realizado com sucesso. Você pode ver os detalhes aqui: {link}"
            
            # Update CRM to 'Agendado'
            db.save_lead(user_id, name="Lead", demand=args['summary'], status="Agendado")

        history.append(ai_msg)
        history.append({"role": "tool", "tool_call_id": tool_call.id, "content": reply_content})
    
    # Get final response after tools
    final_ai_msg = ai.process_message(history)
    return final_ai_msg.content

@app.route("/webhook", methods=["POST"])
def webhook():
    data = request.json
    print(f"Received webhook: {json.dumps(data, indent=2)}")
    
    # uazapiGO v2 — normaliza o payload recebido
    try:
        parsed = parse_incoming_webhook(data)

        if not parsed:
            return jsonify({"status": "ignored"}), 200

        user_id = parsed["phone"]
        text     = parsed["text"]

        # Ignora mensagens de grupo (por enquanto)
        if parsed["is_group"]:
            return jsonify({"status": "ignored_group"}), 200

        # Ignora áudios (por enquanto — futura integração com Whisper)
        if parsed["is_audio"]:
            send_message(user_id, "Olá! Por enquanto só consigo responder mensagens de texto. 😊")
            return jsonify({"status": "audio_not_supported"}), 200

        # 1. Get/Init History
        history = user_sessions.get(user_id, [])
        history.append({"role": "user", "content": text})

        # 2. Define Tools for the AI
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "check_availability",
                    "description": "Busca horários disponíveis para uma data (YYYY-MM-DD)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "date": {"type": "string"}
                        },
                        "required": ["date"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "book_appointment",
                    "description": "Agenda uma visita ou reunião",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "start": {"type": "string", "description": "ISO Datetime"},
                            "summary": {"type": "string"}
                        },
                        "required": ["start", "summary"]
                    }
                }
            }
        ]

        # 3. Process with AI
        ai_msg = ai.process_message(history, tools=tools)

        if ai_msg.tool_calls:
            response_text = handle_ai_tools(user_id, ai_msg, history)
        else:
            response_text = ai_msg.content

        # 4. Save to History & CRM
        history.append({"role": "assistant", "content": response_text})
        user_sessions[user_id] = history[-20:]  # Keep last 20 messages

        # Async summary for CRM (could be a background task)
        summary = ai.summarize_demand(history)
        db.save_lead(user_id, name="Cliente WhatsApp", demand=summary)

        # 5. Send WhatsApp reply
        send_message(user_id, response_text)

    except Exception as e:
        print(f"Error processing webhook: {e}")
        
    return jsonify({"status": "ok"}), 200

@app.route("/api/leads", methods=["GET"])
def get_leads():
    """
    API for the React Dashboard to get real lead data.
    """
    leads = db.get_metrics()
    return jsonify(leads)

if __name__ == "__main__":
    # In production, use Gunicorn
    app.run(host="0.0.0.0", port=5000, debug=True)
