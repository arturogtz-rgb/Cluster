from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import uuid
from slugify import slugify

from database import db
from auth import get_current_user
from models import Actividad, ActividadCreate, ActividadUpdate

router = APIRouter()


@router.get("/actividades", response_model=List[Actividad])
async def get_actividades(activa: Optional[bool] = None):
    query = {}
    if activa is not None:
        query["activa"] = activa
    actividades = await db.actividades.find(query, {"_id": 0}).sort("orden", 1).to_list(100)
    for act in actividades:
        if isinstance(act.get("created_at"), str):
            act["created_at"] = datetime.fromisoformat(act["created_at"])
    return actividades


@router.get("/actividades/{slug}", response_model=Actividad)
async def get_actividad(slug: str):
    actividad = await db.actividades.find_one({"slug": slug}, {"_id": 0})
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    if isinstance(actividad.get("created_at"), str):
        actividad["created_at"] = datetime.fromisoformat(actividad["created_at"])
    return actividad


@router.post("/actividades", response_model=Actividad)
async def create_actividad(data: ActividadCreate, user=Depends(get_current_user)):
    actividad_dict = data.model_dump()
    actividad_dict["slug"] = slugify(data.nombre, lowercase=True)
    existing = await db.actividades.find_one({"slug": actividad_dict["slug"]})
    if existing:
        actividad_dict["slug"] = f"{actividad_dict['slug']}-{str(uuid.uuid4())[:8]}"
    actividad = Actividad(**actividad_dict)
    doc = actividad.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.actividades.insert_one(doc)
    return actividad


@router.put("/actividades/{slug}", response_model=Actividad)
async def update_actividad(slug: str, data: ActividadUpdate, user=Depends(get_current_user)):
    actividad = await db.actividades.find_one({"slug": slug}, {"_id": 0})
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "nombre" in update_data:
        new_slug = slugify(update_data["nombre"], lowercase=True)
        if new_slug != slug:
            existing = await db.actividades.find_one({"slug": new_slug})
            if existing:
                new_slug = f"{new_slug}-{str(uuid.uuid4())[:8]}"
            update_data["slug"] = new_slug
    await db.actividades.update_one({"slug": slug}, {"$set": update_data})
    updated = await db.actividades.find_one({"slug": update_data.get("slug", slug)}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return updated


@router.delete("/actividades/{slug}")
async def delete_actividad(slug: str, user=Depends(get_current_user)):
    result = await db.actividades.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    return {"message": "Actividad eliminada"}
