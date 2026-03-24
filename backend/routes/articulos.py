from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import uuid
from slugify import slugify

from database import db
from auth import get_current_user
from models import Articulo, ArticuloCreate, ArticuloUpdate

router = APIRouter()


@router.get("/articulos", response_model=List[Articulo])
async def get_articulos(publicado: Optional[bool] = None):
    query = {}
    if publicado is not None:
        query["publicado"] = publicado
    articulos = await db.articulos.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for articulo in articulos:
        if isinstance(articulo.get("created_at"), str):
            articulo["created_at"] = datetime.fromisoformat(articulo["created_at"])
        if isinstance(articulo.get("updated_at"), str):
            articulo["updated_at"] = datetime.fromisoformat(articulo["updated_at"])
    return articulos


@router.get("/articulos/{slug}", response_model=Articulo)
async def get_articulo(slug: str):
    articulo = await db.articulos.find_one({"slug": slug}, {"_id": 0})
    if not articulo:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    if isinstance(articulo.get("created_at"), str):
        articulo["created_at"] = datetime.fromisoformat(articulo["created_at"])
    if isinstance(articulo.get("updated_at"), str):
        articulo["updated_at"] = datetime.fromisoformat(articulo["updated_at"])
    return articulo


@router.post("/articulos", response_model=Articulo)
async def create_articulo(data: ArticuloCreate, user=Depends(get_current_user)):
    articulo_dict = data.model_dump()
    articulo_dict["slug"] = slugify(data.titulo, lowercase=True)
    existing = await db.articulos.find_one({"slug": articulo_dict["slug"]})
    if existing:
        articulo_dict["slug"] = f"{articulo_dict['slug']}-{str(uuid.uuid4())[:8]}"
    articulo = Articulo(**articulo_dict)
    doc = articulo.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.articulos.insert_one(doc)
    return articulo


@router.put("/articulos/{slug}", response_model=Articulo)
async def update_articulo(slug: str, data: ArticuloUpdate, user=Depends(get_current_user)):
    articulo = await db.articulos.find_one({"slug": slug}, {"_id": 0})
    if not articulo:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "titulo" in update_data:
        new_slug = slugify(update_data["titulo"], lowercase=True)
        if new_slug != slug:
            existing = await db.articulos.find_one({"slug": new_slug})
            if existing:
                new_slug = f"{new_slug}-{str(uuid.uuid4())[:8]}"
            update_data["slug"] = new_slug
    update_data["updated_at"] = datetime.now().isoformat()
    await db.articulos.update_one({"slug": slug}, {"$set": update_data})
    updated = await db.articulos.find_one({"slug": update_data.get("slug", slug)}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    if isinstance(updated.get("updated_at"), str):
        updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    return updated


@router.delete("/articulos/{slug}")
async def delete_articulo(slug: str, user=Depends(get_current_user)):
    result = await db.articulos.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    return {"message": "Artículo eliminado"}
