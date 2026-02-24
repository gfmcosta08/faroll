import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

_HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}


class Table:
    """
    Wrapper leve sobre a API REST do Supabase (PostgREST).
    Substitui o SDK oficial sem dependências pesadas.
    """

    def __init__(self, name: str):
        self._name    = name
        self._url     = f"{SUPABASE_URL}/rest/v1/{name}"
        self._filters = []
        self._select  = "*"
        self._order   = None
        self._desc    = False

    def select(self, cols: str = "*"):
        self._select = cols
        return self

    def eq(self, col: str, val):
        self._filters.append(f"{col}=eq.{val}")
        return self

    def order(self, col: str, desc: bool = False):
        self._order = col
        self._desc  = desc
        return self

    def _build_params(self) -> dict:
        params = {"select": self._select}
        for f in self._filters:
            key, val = f.split("=", 1)
            params[key] = val
        if self._order:
            params["order"] = f"{self._order}.{'desc' if self._desc else 'asc'}"
        return params

    def execute(self):
        params = self._build_params()
        r = httpx.get(self._url, headers=_HEADERS, params=params)
        r.raise_for_status()
        return _Result(r.json())

    def insert(self, data: dict):
        self._data = data
        return self

    def update(self, data: dict):
        self._data = data
        return self

    def _flush_write(self, method: str):
        params = {}
        for f in self._filters:
            key, val = f.split("=", 1)
            params[key] = val
        r = httpx.request(
            method,
            self._url,
            headers=_HEADERS,
            params=params,
            json=self._data,
        )
        r.raise_for_status()
        return _Result(r.json())


class _Result:
    def __init__(self, data):
        self.data = data if isinstance(data, list) else [data]


class DB:
    def table(self, name: str) -> "TableBuilder":
        return TableBuilder(name)


class TableBuilder:
    def __init__(self, name: str):
        self._name    = name
        self._url     = f"{SUPABASE_URL}/rest/v1/{name}"
        self._filters: list[tuple] = []
        self._sel     = "*"
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
