import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Accept-Profile e Content-Profile direcionam o PostgREST para o schema imob
_HEADERS = {
    "apikey":           SUPABASE_KEY,
    "Authorization":    f"Bearer {SUPABASE_KEY}",
    "Content-Type":     "application/json",
    "Prefer":           "return=representation",
    "Accept-Profile":   "imob",
    "Content-Profile":  "imob",
}


class _Result:
    def __init__(self, data):
        self.data = data if isinstance(data, list) else [data]


class DB:
    def table(self, name: str) -> "TableBuilder":
        return TableBuilder(name)


class TableBuilder:
    def __init__(self, name: str):
        self._name       = name
        self._url        = f"{SUPABASE_URL}/rest/v1/{name}"
        self._filters: list[tuple] = []
        self._sel        = "*"
        self._order_col  = None
        self._order_desc = False
        self._write_data = None
        self._method     = "GET"

    def select(self, cols: str = "*"):
        self._sel = cols
        return self

    def eq(self, col: str, val):
        self._filters.append((col, val))
        return self

    def order(self, col: str, desc: bool = False):
        self._order_col  = col
        self._order_desc = desc
        return self

    def insert(self, data: dict):
        self._method     = "POST"
        self._write_data = data
        return self

    def update(self, data: dict):
        self._method     = "PATCH"
        self._write_data = data
        return self

    def maybeSingle(self):
        """Alias: retorna None se não encontrar, sem erro."""
        self._maybe_single = True
        return self

    def _params(self) -> dict:
        p = {}
        if self._method == "GET":
            p["select"] = self._sel
        for col, val in self._filters:
            p[col] = f"eq.{val}"
        if self._order_col:
            p["order"] = f"{self._order_col}.{'desc' if self._order_desc else 'asc'}"
        return p

    def execute(self) -> _Result:
        params = self._params()
        r = httpx.request(
            self._method,
            self._url,
            headers=_HEADERS,
            params=params,
            json=self._write_data,
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        return _Result(data if isinstance(data, list) else [data])


_db = DB()


def get_db() -> DB:
    return _db
