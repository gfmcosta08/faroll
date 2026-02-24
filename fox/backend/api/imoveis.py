from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from backend.database import get_db
from backend.models.schemas import ImovelCreate, ImovelUpdate, ImovelVender
from backend.api.auth import verify_token

router = APIRouter(prefix="/api/imoveis", tags=["Imóveis"])


@router.get("")
def listar_imoveis(
    status: str = None,
    finalidade: str = None,
    me: dict = Depends(verify_token)
):
    db = get_db()
    query = db.table("imoveis").select("*").eq("empresa_id", me["empresa_id"])

    if status:
        query = query.eq("status", status)
    if finalidade:
        query = query.eq("finalidade", finalidade)

    return query.order("data_cadastro", desc=True).execute().data


@router.get("/{imovel_id}")
def buscar_imovel(imovel_id: str, me: dict = Depends(verify_token)):
    db = get_db()
    result = db.table("imoveis").select("*, imovel_fotos(*)") \
        .eq("id", imovel_id).eq("empresa_id", me["empresa_id"]).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    # Incrementa visualizações
    db.table("imoveis").update({"visualizacoes": result.data[0]["visualizacoes"] + 1}) \
        .eq("id", imovel_id).execute()

    return result.data[0]


@router.post("")
def criar_imovel(body: ImovelCreate, me: dict = Depends(verify_token)):
    db = get_db()
    result = db.table("imoveis").insert({
        **body.model_dump(),
        "empresa_id":  me["empresa_id"],
        "corretor_id": me["sub"],
    }).execute()
    return result.data[0]


@router.put("/{imovel_id}")
def atualizar_imovel(imovel_id: str, body: ImovelUpdate, me: dict = Depends(verify_token)):
    db = get_db()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")

    result = db.table("imoveis").update(updates) \
        .eq("id", imovel_id).eq("empresa_id", me["empresa_id"]).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    return result.data[0]


@router.put("/{imovel_id}/vender")
def registrar_venda(imovel_id: str, body: ImovelVender, me: dict = Depends(verify_token)):
    db = get_db()
    result = db.table("imoveis").update({
        "status":            "vendido_corretor",
        "data_venda":        datetime.utcnow().isoformat(),
        "valor_venda":       body.valor_venda,
        "corretor_venda_id": body.corretor_venda_id or me["sub"],
        "observacao_venda":  body.observacao_venda,
    }).eq("id", imovel_id).eq("empresa_id", me["empresa_id"]).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")

    return result.data[0]
