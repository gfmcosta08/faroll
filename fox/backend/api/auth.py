from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

from backend.database import get_db
from backend.models.schemas import LoginRequest, TokenResponse

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "fox-secret-change-in-production")
ALGORITHM  = "HS256"
TOKEN_EXP_HOURS = 24

bearer = HTTPBearer()


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXP_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    db = get_db()

    result = db.table("corretores").select("*").eq("email", body.email).eq("ativo", True).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    corretor = result.data[0]

    if not bcrypt.checkpw(body.senha.encode(), corretor["senha_hash"].encode()):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    token = create_token({
        "sub":        corretor["id"],
        "empresa_id": corretor["empresa_id"],
        "perfil":     corretor["perfil"],
    })

    return TokenResponse(
        access_token=token,
        corretor_id=corretor["id"],
        empresa_id=corretor["empresa_id"],
        perfil=corretor["perfil"],
        nome=corretor["nome"],
    )
