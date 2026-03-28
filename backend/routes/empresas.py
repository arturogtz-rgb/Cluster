from fastapi import APIRouter, Depends
from typing import List, Optional
from datetime import datetime
import uuid
from slugify import slugify

from database import db
from auth import get_current_user
from models import Empresa, EmpresaCreate, EmpresaUpdate

router = APIRouter()


@router.get("/empresas", response_model=List[Empresa])
async def get_empresas(
    categoria: Optional[str] = None,
    busqueda: Optional[str] = None,
    destacada: Optional[bool] = None,
    activa: bool = True,
):
    query = {"activa": activa}
    if categoria:
        query["categoria"] = categoria
    if destacada is not None:
        query["destacada"] = destacada
    if busqueda:
        query["$or"] = [
            {"nombre": {"$regex": busqueda, "$options": "i"}},
            {"descripcion": {"$regex": busqueda, "$options": "i"}},
            {"actividades": {"$regex": busqueda, "$options": "i"}},
        ]
    empresas = await db.empresas.find(query, {"_id": 0}).to_list(1000)
    for empresa in empresas:
        if isinstance(empresa.get("created_at"), str):
            empresa["created_at"] = datetime.fromisoformat(empresa["created_at"])
        if isinstance(empresa.get("updated_at"), str):
            empresa["updated_at"] = datetime.fromisoformat(empresa["updated_at"])
    # Resolve activity IDs to names
    all_actividades = await db.actividades.find({}, {"_id": 0, "id": 1, "nombre": 1, "slug": 1}).to_list(200)
    act_map = {}
    for a in all_actividades:
        act_map[a["id"]] = a["nombre"]
        act_map[a.get("slug", "")] = a["nombre"]
    for empresa in empresas:
        if empresa.get("actividades"):
            empresa["actividades"] = [act_map.get(act, act) for act in empresa["actividades"]]
    return empresas


@router.get("/empresas-top-views")
async def get_top_viewed_empresas():
    empresas = await db.empresas.find(
        {"activa": True},
        {"_id": 0, "nombre": 1, "slug": 1, "views": 1, "categoria": 1, "logo_url": 1},
    ).sort("views", -1).limit(5).to_list(5)
    for e in empresas:
        e.setdefault("views", 0)
    return empresas


@router.get("/empresas-destacadas")
async def get_empresas_destacadas():
    # Priority: destacada=true first, then top by views, limit 6
    destacadas = await db.empresas.find(
        {"activa": True, "destacada": True}, {"_id": 0}
    ).sort("views", -1).to_list(20)
    for e in destacadas:
        if isinstance(e.get("created_at"), str):
            e["created_at"] = datetime.fromisoformat(e["created_at"])
        if isinstance(e.get("updated_at"), str):
            e["updated_at"] = datetime.fromisoformat(e["updated_at"])
    slugs_used = {e["slug"] for e in destacadas}
    remaining = 6 - len(destacadas)
    if remaining > 0:
        top_views = await db.empresas.find(
            {"activa": True, "slug": {"$nin": list(slugs_used)}}, {"_id": 0}
        ).sort("views", -1).limit(remaining).to_list(remaining)
        for e in top_views:
            if isinstance(e.get("created_at"), str):
                e["created_at"] = datetime.fromisoformat(e["created_at"])
            if isinstance(e.get("updated_at"), str):
                e["updated_at"] = datetime.fromisoformat(e["updated_at"])
        destacadas.extend(top_views)
    result = destacadas[:6]
    # Resolve activity IDs to names
    all_actividades = await db.actividades.find({}, {"_id": 0, "id": 1, "nombre": 1, "slug": 1}).to_list(200)
    act_map = {}
    for a in all_actividades:
        act_map[a["id"]] = a["nombre"]
        act_map[a.get("slug", "")] = a["nombre"]
    for e in result:
        if e.get("actividades"):
            e["actividades"] = [act_map.get(act, act) for act in e["actividades"]]
    return result


@router.get("/empresas/{slug}", response_model=Empresa)
async def get_empresa(slug: str):
    empresa = await db.empresas.find_one({"slug": slug}, {"_id": 0})
    if not empresa:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if isinstance(empresa.get("created_at"), str):
        empresa["created_at"] = datetime.fromisoformat(empresa["created_at"])
    if isinstance(empresa.get("updated_at"), str):
        empresa["updated_at"] = datetime.fromisoformat(empresa["updated_at"])
    # Resolve activity IDs to names
    if empresa.get("actividades"):
        all_actividades = await db.actividades.find({}, {"_id": 0, "id": 1, "nombre": 1, "slug": 1}).to_list(200)
        act_map = {}
        for a in all_actividades:
            act_map[a["id"]] = a["nombre"]
            act_map[a.get("slug", "")] = a["nombre"]
        empresa["actividades"] = [act_map.get(act, act) for act in empresa["actividades"]]
    await db.empresas.update_one({"slug": slug}, {"$inc": {"views": 1}})
    return empresa


@router.post("/empresas", response_model=Empresa)
async def create_empresa(data: EmpresaCreate, user=Depends(get_current_user)):
    empresa_dict = data.model_dump()
    empresa_dict["slug"] = slugify(data.nombre, lowercase=True)
    existing = await db.empresas.find_one({"slug": empresa_dict["slug"]})
    if existing:
        empresa_dict["slug"] = f"{empresa_dict['slug']}-{str(uuid.uuid4())[:8]}"
    empresa = Empresa(**empresa_dict)
    doc = empresa.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.empresas.insert_one(doc)
    return empresa


@router.put("/empresas/{slug}", response_model=Empresa)
async def update_empresa(slug: str, data: EmpresaUpdate, user=Depends(get_current_user)):
    from fastapi import HTTPException
    empresa = await db.empresas.find_one({"slug": slug}, {"_id": 0})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "nombre" in update_data:
        new_slug = slugify(update_data["nombre"], lowercase=True)
        if new_slug != slug:
            existing = await db.empresas.find_one({"slug": new_slug})
            if existing:
                new_slug = f"{new_slug}-{str(uuid.uuid4())[:8]}"
            update_data["slug"] = new_slug
    update_data["updated_at"] = datetime.now().isoformat()
    if "social_links" in update_data and update_data["social_links"]:
        update_data["social_links"] = (
            update_data["social_links"].model_dump()
            if hasattr(update_data["social_links"], "model_dump")
            else update_data["social_links"]
        )
    await db.empresas.update_one({"slug": slug}, {"$set": update_data})
    updated = await db.empresas.find_one({"slug": update_data.get("slug", slug)}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    if isinstance(updated.get("updated_at"), str):
        updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    return updated


@router.delete("/empresas/{slug}")
async def delete_empresa(slug: str, user=Depends(get_current_user)):
    from fastapi import HTTPException
    result = await db.empresas.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return {"message": "Empresa eliminada"}
