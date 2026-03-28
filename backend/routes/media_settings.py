from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from pathlib import Path
import uuid
import aiofiles
from slugify import slugify

from database import db
from auth import get_current_user
from models import MediaFile, SiteSettings, SiteSettingsUpdate
from utils import optimize_image, IMAGE_SIZES

ROOT_DIR = Path(__file__).parent.parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

MEDIA_FOLDERS = {
    "system": UPLOAD_DIR / "system",
    "empresas": UPLOAD_DIR / "empresas",
    "articulos": UPLOAD_DIR / "articulos",
    "actividades": UPLOAD_DIR / "actividades",
    "categorias": UPLOAD_DIR / "categorias",
}
for folder in MEDIA_FOLDERS.values():
    folder.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
MAX_FILE_SIZE = 10 * 1024 * 1024

router = APIRouter()


def get_upload_folder(category: str, entity_slug: str = None, subfolder: str = None) -> Path:
    base = MEDIA_FOLDERS.get(category, UPLOAD_DIR / "system")
    if entity_slug:
        folder = base / entity_slug
        if subfolder:
            folder = folder / subfolder
    else:
        folder = base
    folder.mkdir(parents=True, exist_ok=True)
    return folder


@router.get("/media", response_model=List[MediaFile])
async def get_media_files(
    category: Optional[str] = None,
    entity_slug: Optional[str] = None,
    user=Depends(get_current_user),
):
    query = {}
    if category:
        query["category"] = category
    if entity_slug:
        query["entity_slug"] = entity_slug
    files = await db.media.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for f in files:
        if isinstance(f.get("created_at"), str):
            f["created_at"] = datetime.fromisoformat(f["created_at"])
    return files


@router.post("/media/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form(default="system"),
    entity_slug: str = Form(default=""),
    subfolder: str = Form(default=""),
    image_type: str = Form(default="card"),
    user=Depends(get_current_user),
):
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Permitidos: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande. Máximo 10MB")

    original_size = len(content)
    if file_ext not in {".svg", ".gif"}:
        max_width = IMAGE_SIZES.get(image_type, 1200)
        optimized_content, new_ext = optimize_image(content, max_width)
        if new_ext:
            content = optimized_content
            file_ext = new_ext

    unique_id = str(uuid.uuid4())[:8]
    safe_name = slugify(Path(file.filename).stem, lowercase=True)
    new_filename = f"{safe_name}_{unique_id}{file_ext}"

    upload_folder = get_upload_folder(category, entity_slug or None, subfolder or None)
    file_path = upload_folder / new_filename
    relative_path = file_path.relative_to(UPLOAD_DIR)
    url = f"/api/uploads/{relative_path.as_posix()}"

    try:
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar archivo: {str(e)}")

    media_file = MediaFile(
        filename=new_filename,
        original_name=file.filename,
        url=url,
        size=len(content),
        mime_type="image/webp" if file_ext == ".webp" else (file.content_type or "application/octet-stream"),
    )

    doc = media_file.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["category"] = category
    doc["entity_slug"] = entity_slug
    doc["subfolder"] = subfolder
    doc["original_size"] = original_size
    doc["optimized_size"] = len(content)
    doc["compression_ratio"] = round((1 - len(content) / original_size) * 100, 1) if original_size > 0 else 0
    await db.media.insert_one(doc)

    return {
        **media_file.model_dump(),
        "category": category,
        "entity_slug": entity_slug,
        "original_size": original_size,
        "optimized_size": len(content),
        "compression_ratio": doc["compression_ratio"],
        "message": f"Imagen optimizada. Reducción: {doc['compression_ratio']}%",
    }


@router.delete("/media/{file_id}")
async def delete_media(file_id: str, user=Depends(get_current_user)):
    media = await db.media.find_one({"id": file_id}, {"_id": 0})
    if not media:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    url_path = media.get("url", "").replace("/api/uploads/", "")
    file_path = UPLOAD_DIR / url_path
    if file_path.exists():
        file_path.unlink()
    await db.media.delete_one({"id": file_id})
    return {"message": "Archivo eliminado"}


# ==================== SITE SETTINGS ====================

@router.get("/settings", response_model=SiteSettings)
async def get_settings():
    settings = await db.settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        return SiteSettings()
    if isinstance(settings.get("updated_at"), str):
        settings["updated_at"] = datetime.fromisoformat(settings["updated_at"])
    return settings


@router.put("/settings", response_model=SiteSettings)
async def update_settings(data: SiteSettingsUpdate, user=Depends(get_current_user)):
    from datetime import timezone
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["id"] = "site_settings"
    # Handle boolean fields explicitly (False should be saved, not skipped)
    for bool_key in ["whatsapp_visible"]:
        val = getattr(data, bool_key)
        if val is not None:
            update_data[bool_key] = val
    await db.settings.update_one({"id": "site_settings"}, {"$set": update_data}, upsert=True)
    settings = await db.settings.find_one({"id": "site_settings"}, {"_id": 0})
    if isinstance(settings.get("updated_at"), str):
        settings["updated_at"] = datetime.fromisoformat(settings["updated_at"])
    return settings


@router.get("/nosotros-settings")
async def get_nosotros_settings():
    settings = await db.settings.find_one({"id": "nosotros_settings"}, {"_id": 0})
    if not settings:
        return {
            "mision": "Impulsar el desarrollo sustentable y la profesionalización del turismo de naturaleza en Jalisco, conectando a viajeros conscientes con experiencias auténticas en nuestras montañas, costas y bosques.",
            "vision": "Ser el referente nacional en turismo de aventura, posicionando a Jalisco como un destino seguro, diverso y líder en conservación ambiental.",
            "valores": ["Sustentabilidad", "Seguridad", "Comunidad", "Pasión por la Tierra"],
            "cta_titulo": "¿Quieres unirte al Clúster?",
            "cta_texto": "Si tu empresa ofrece servicios de turismo de naturaleza y aventura en Jalisco, te invitamos a formar parte de nuestra red.",
            "hero_image": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920",
        }
    return settings


@router.put("/nosotros-settings")
async def update_nosotros_settings(data: dict, user=Depends(get_current_user)):
    data["id"] = "nosotros_settings"
    await db.settings.update_one({"id": "nosotros_settings"}, {"$set": data}, upsert=True)
    return {"status": "ok"}
