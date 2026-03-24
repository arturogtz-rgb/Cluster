from fastapi import APIRouter, HTTPException, Depends
from slugify import slugify

from database import db
from auth import get_current_user
from models import Categoria, CategoriaCreate, CategoriaUpdate, CATEGORIES

router = APIRouter()


@router.get("/categorias")
async def get_categorias():
    categorias = await db.categorias.find({}, {"_id": 0}).sort("orden", 1).to_list(100)
    if categorias:
        return {"categorias": categorias}
    return {
        "categorias": [
            {"nombre": c, "slug": slugify(c), "descripcion": "", "imagen_url": "", "orden": i, "activa": True}
            for i, c in enumerate(CATEGORIES)
        ]
    }


@router.post("/categorias", response_model=Categoria)
async def create_categoria(data: CategoriaCreate, user=Depends(get_current_user)):
    categoria_dict = data.model_dump()
    categoria_dict["slug"] = slugify(data.nombre, lowercase=True)
    existing = await db.categorias.find_one({"slug": categoria_dict["slug"]})
    if existing:
        raise HTTPException(status_code=400, detail="Categoría ya existe")
    categoria = Categoria(**categoria_dict)
    doc = categoria.model_dump()
    await db.categorias.insert_one(doc)
    return categoria


@router.put("/categorias/{slug}", response_model=Categoria)
async def update_categoria(slug: str, data: CategoriaUpdate, user=Depends(get_current_user)):
    categoria = await db.categorias.find_one({"slug": slug}, {"_id": 0})
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "nombre" in update_data:
        new_slug = slugify(update_data["nombre"], lowercase=True)
        if new_slug != slug:
            existing = await db.categorias.find_one({"slug": new_slug})
            if existing:
                raise HTTPException(status_code=400, detail="Nombre de categoría ya existe")
            update_data["slug"] = new_slug
    await db.categorias.update_one({"slug": slug}, {"$set": update_data})
    updated = await db.categorias.find_one({"slug": update_data.get("slug", slug)}, {"_id": 0})
    return updated


@router.delete("/categorias/{slug}")
async def delete_categoria(slug: str, user=Depends(get_current_user)):
    result = await db.categorias.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"message": "Categoría eliminada"}
