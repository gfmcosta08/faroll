"""
Auth — valida JWT do Supabase e carrega perfil do usuário em imob.profiles.
O login agora é feito pelo frontend via Supabase Auth diretamente.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import os
from dotenv import load_dotenv

from backend.database import get_db

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SUPABASE_URL      = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

bearer = HTTPBearer()

PERFIL_MAP = {
    "dono_imobiliaria": "admin",
    "gerente":           "gerente",
    "corretor":          "corretor",
    "secretaria":        "secretaria",
}


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    """
    1. Verifica o JWT com Supabase Auth (/auth/v1/user)
    2. Carrega empresa_id e perfil de imob.profiles
    Retorna: {"sub": user_id, "empresa_id": ..., "perfil": ..., "email": ...}
    """
    token = credentials.credentials

    # 1. Verifica o token com Supabase
    r = httpx.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey":        SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {token}",
        },
        timeout=5,
    )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    supabase_user = r.json()
    user_id = supabase_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token sem identificação de usuário")

    # 2. Carrega perfil do usuário em imob.profiles
    db = get_db()
    result = db.table("profiles").select("empresa_id,role").eq("user_id", user_id).execute()

    if not result.data or not result.data[0].get("empresa_id"):
        raise HTTPException(status_code=403, detail="Usuário sem perfil no Faroll Imóveis")

    profile = result.data[0]

    return {
        "sub":        user_id,
        "empresa_id": profile["empresa_id"],
        "perfil":     PERFIL_MAP.get(profile.get("role", ""), "corretor"),
        "email":      supabase_user.get("email", ""),
    }


@router.get("/me")
def me(payload: dict = Depends(verify_token)):
    """Retorna os dados do usuário autenticado (útil para debug)."""
    return payload
