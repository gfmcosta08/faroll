from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api import auth, corretores, imoveis, leads, dashboard, webhook

app = FastAPI(
    title="APP FOX API",
    description="SaaS Imobiliário Multi-Tenant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção: restringir ao domínio do dashboard
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(corretores.router)
app.include_router(imoveis.router)
app.include_router(leads.router)
app.include_router(dashboard.router)
app.include_router(webhook.router)


@app.get("/")
def health():
    return {"status": "FOX API online"}
