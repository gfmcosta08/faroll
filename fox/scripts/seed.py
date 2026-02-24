"""
Seed: cria empresa + corretor gerente + corretor comum para testes.
Execute: py scripts/seed.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import httpx
import bcrypt
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}


def hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode(), bcrypt.gensalt()).decode()


def post(path, data):
    r = httpx.post(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, json=data)
    r.raise_for_status()
    return r.json()


def main():
    print("[SEED] Iniciando seed...\n")

    # 1. Empresa
    empresa = post("empresas", {
        "nome":              "Imobiliaria FOX Demo",
        "numero_whatsapp":   "5511999990000",
        "grupo_whatsapp_id": "120363000000000000@g.us",
        "plano":             "trial",
    })
    empresa_id = empresa[0]["id"]
    print(f"[OK] Empresa criada: {empresa[0]['nome']} (id: {empresa_id})")

    # 2. Gerente
    gerente = post("corretores", {
        "empresa_id": empresa_id,
        "nome":       "Joao Gerente",
        "email":      "gerente@fox.com",
        "telefone":   "11999990001",
        "perfil":     "gerente",
        "senha_hash": hash_senha("fox123"),
    })
    print(f"[OK] Gerente criado: {gerente[0]['nome']} | gerente@fox.com | senha: fox123")

    # 3. Corretor
    corretor = post("corretores", {
        "empresa_id": empresa_id,
        "nome":       "Maria Corretora",
        "email":      "corretor@fox.com",
        "telefone":   "11999990002",
        "perfil":     "corretor",
        "senha_hash": hash_senha("fox123"),
    })
    corretor_id = corretor[0]["id"]
    print(f"[OK] Corretor criado: {corretor[0]['nome']} | corretor@fox.com | senha: fox123")

    # 4. Imoveis de teste
    imoveis = [
        {
            "empresa_id":  empresa_id,
            "corretor_id": corretor_id,
            "tipo":        "apartamento",
            "bairro":      "Moema",
            "cidade":      "Sao Paulo",
            "valor":       650000.00,
            "quartos":     3,
            "metragem":    85.0,
            "finalidade":  "venda",
            "status":      "disponivel",
            "mobiliado":   True,
            "area_pet":    True,
        },
        {
            "empresa_id":  empresa_id,
            "corretor_id": corretor_id,
            "tipo":        "casa",
            "bairro":      "Alphaville",
            "cidade":      "Barueri",
            "valor":       4500.00,
            "quartos":     4,
            "metragem":    200.0,
            "finalidade":  "aluguel",
            "status":      "disponivel",
            "condominio":  True,
            "valor_condominio": 800.00,
        },
        {
            "empresa_id":  empresa_id,
            "corretor_id": corretor_id,
            "tipo":        "apartamento",
            "bairro":      "Vila Madalena",
            "cidade":      "Sao Paulo",
            "valor":       420000.00,
            "quartos":     2,
            "metragem":    60.0,
            "finalidade":  "venda",
            "status":      "disponivel",
            "aceita_financiamento": True,
        },
    ]
    for im in imoveis:
        r = post("imoveis", im)
        print(f"[OK] Imovel: {r[0]['tipo']} em {r[0]['bairro']} - R$ {r[0]['valor']:,.2f}")

    # 5. Leads de teste
    leads = [
        {
            "empresa_id":  empresa_id,
            "telefone":    "5511888880001",
            "nome":        "Carlos Silva",
            "origem":      "whatsapp",
            "status_lead": "novo",
            "orcamento_max": 700000.00,
            "preferencias":  {"tipo": "apartamento", "bairro": "Moema"},
        },
        {
            "empresa_id":   empresa_id,
            "corretor_id":  corretor_id,
            "telefone":     "5511888880002",
            "nome":         "Ana Souza",
            "origem":       "whatsapp",
            "status_lead":  "em_atendimento",
            "orcamento_max": 5000.00,
            "preferencias": {"finalidade": "aluguel"},
        },
    ]
    for lead in leads:
        r = post("leads", lead)
        print(f"[OK] Lead: {r[0]['nome']} ({r[0]['telefone']})")

    print("\n[OK] Seed concluido!")
    print("\n[INFO] Credenciais de teste:")
    print("   Gerente : gerente@fox.com / fox123")
    print("   Corretor: corretor@fox.com / fox123")


if __name__ == "__main__":
    main()
