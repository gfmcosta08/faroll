import requests
import json
import time

URL = "http://localhost:5000/webhook"

def simulate_message(phone, text):
    payload = {
        "event": "messages.upsert",
        "data": {
            "key": {
                "remoteJid": phone,
                "fromMe": False,
                "id": "SIMULATION_ID"
            },
            "message": {
                "conversation": text
            },
            "pushName": "Usuario Teste"
        }
    }
    
    print(f"\n[USER {phone}]: {text}")
    try:
        response = requests.post(URL, json=payload)
        print(f"[SERVER]: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Erro ao conectar com o servidor: {e}. Verifique se 'python main.py' está rodando na porta 5000.")

if __name__ == "__main__":
    print("--- Simulação de Conversa FOX ---")
    simulate_message("5511999999999", "Olá, gostaria de saber sobre imóveis em São Paulo")
    time.sleep(2)
    simulate_message("5511999999999", "Meu nome é João e meu orçamento é de 500 mil")
