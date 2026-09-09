from fastapi import APIRouter, HTTPException, Depends

from database import db
from auth import require_admin
from models import Requisito, RequisitoCreate, RequisitoUpdate

router = APIRouter()


@router.get("/requisitos")
async def get_requisitos(solo_activos: bool = True):
    """Public endpoint - returns active requirements for the wizard."""
    query = {"activo": True} if solo_activos else {}
    requisitos = await db.requisitos.find(query, {"_id": 0}).sort("orden", 1).to_list(100)
    return requisitos


@router.get("/admin/requisitos")
async def admin_get_requisitos(user=Depends(require_admin)):
    """Admin endpoint - returns all requirements including inactive."""
    requisitos = await db.requisitos.find({}, {"_id": 0}).sort("orden", 1).to_list(100)
    return requisitos


@router.post("/admin/requisitos")
async def admin_create_requisito(data: RequisitoCreate, user=Depends(require_admin)):
    requisito = Requisito(**data.model_dump())
    doc = requisito.model_dump()
    await db.requisitos.insert_one(doc)
    return await db.requisitos.find_one({"id": requisito.id}, {"_id": 0})


@router.put("/admin/requisitos/{requisito_id}")
async def admin_update_requisito(requisito_id: str, data: RequisitoUpdate, user=Depends(require_admin)):
    existing = await db.requisitos.find_one({"id": requisito_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Requisito no encontrado")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    # Handle boolean fields explicitly
    for bool_key in ["bloqueante", "documento_requerido", "activo"]:
        val = getattr(data, bool_key)
        if val is not None:
            update_data[bool_key] = val
    if update_data:
        await db.requisitos.update_one({"id": requisito_id}, {"$set": update_data})
    updated = await db.requisitos.find_one({"id": requisito_id}, {"_id": 0})
    return updated


@router.delete("/admin/requisitos/{requisito_id}")
async def admin_delete_requisito(requisito_id: str, user=Depends(require_admin)):
    result = await db.requisitos.delete_one({"id": requisito_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Requisito no encontrado")
    return {"message": "Requisito eliminado"}
