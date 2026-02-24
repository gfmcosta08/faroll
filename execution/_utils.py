"""
Utilitários compartilhados entre os scripts de execução.
Importe com: from execution._utils import get_env, get_logger, get_supabase_client
"""

import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Carrega o .env a partir da raiz do projeto (dois níveis acima de execution/)
_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")


# ---------------------------------------------------------------------------
# Ambiente
# ---------------------------------------------------------------------------

def get_env(key: str, required: bool = True) -> str:
    """Retorna variável de ambiente. Lança erro se required=True e não existir."""
    value = os.getenv(key)
    if required and not value:
        raise EnvironmentError(
            f"Variável de ambiente '{key}' não definida. Verifique o arquivo .env."
        )
    return value or ""


def get_app_env() -> str:
    """Retorna o ambiente atual: 'dev', 'test' ou 'prod'."""
    return get_env("APP_ENV", required=False) or "dev"


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def get_logger(name: str) -> logging.Logger:
    """
    Retorna um logger configurado com o nível definido em LOG_LEVEL (.env).
    Uso: logger = get_logger(__name__)
    """
    log_level_str = get_env("LOG_LEVEL", required=False) or "INFO"
    log_level = getattr(logging, log_level_str.upper(), logging.INFO)

    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(name)s — %(message)s")
        )
        logger.addHandler(handler)
    logger.setLevel(log_level)
    return logger


# ---------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------

def get_supabase_client():
    """
    Retorna cliente Supabase inicializado com SUPABASE_URL e SUPABASE_KEY do .env.
    Requer: pip install supabase
    """
    try:
        from supabase import create_client, Client  # type: ignore
    except ImportError:
        raise ImportError("Pacote 'supabase' não instalado. Execute: pip install supabase")

    url = get_env("SUPABASE_URL")
    key = get_env("SUPABASE_KEY")
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Google API
# ---------------------------------------------------------------------------

def get_google_service(service_name: str, version: str, scopes: list[str]):
    """
    Retorna um serviço autenticado da Google API usando OAuth 2.0.

    Parâmetros:
        service_name: ex. 'sheets', 'drive', 'gmail'
        version:      ex. 'v4', 'v3', 'v1'
        scopes:       lista de escopos necessários

    Requer: credentials.json na raiz do projeto (gerado no Google Cloud Console).
    O token.json será criado automaticamente após o primeiro login.
    """
    try:
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build  # type: ignore
    except ImportError:
        raise ImportError(
            "Pacotes Google não instalados. Execute: "
            "pip install google-api-python-client google-auth-oauthlib"
        )

    creds_path = _ROOT / get_env("GOOGLE_CREDENTIALS_PATH", required=False) or _ROOT / "credentials.json"
    token_path = _ROOT / "token.json"

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), scopes)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(creds_path), scopes)
            creds = flow.run_local_server(port=0)
        token_path.write_text(creds.to_json())

    return build(service_name, version, credentials=creds)


# ---------------------------------------------------------------------------
# Helpers de arquivo
# ---------------------------------------------------------------------------

def tmp_path(filename: str) -> Path:
    """Retorna o caminho completo para um arquivo dentro de .tmp/."""
    path = _ROOT / ".tmp" / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    return path
