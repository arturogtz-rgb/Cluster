from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
from slugify import slugify
import shutil
import aiofiles
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'cluster-turismo-jalisco-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

# Categories enum
CATEGORIES = [
    "Capacitación",
    "Operadora de aventura", 
    "Parque acuático",
    "Hospedaje",
    "Parque de aventura"
]

class SocialLinks(BaseModel):
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    youtube: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None

class Empresa(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    slug: str
    categoria: str
    descripcion: str
    logo_url: Optional[str] = None
    hero_url: Optional[str] = None
    galeria: List[str] = []
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    direccion: Optional[str] = None
    email: Optional[str] = None
    social_links: SocialLinks = Field(default_factory=SocialLinks)
    actividades: List[str] = []
    destacada: bool = False
    activa: bool = True
    # Coordenadas para el mapa
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmpresaCreate(BaseModel):
    nombre: str
    categoria: str
    descripcion: str
    logo_url: Optional[str] = None
    hero_url: Optional[str] = None
    galeria: List[str] = []
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    direccion: Optional[str] = None
    email: Optional[str] = None
    social_links: SocialLinks = Field(default_factory=SocialLinks)
    actividades: List[str] = []
    destacada: bool = False
    activa: bool = True
    latitud: Optional[float] = None
    longitud: Optional[float] = None

class EmpresaUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    logo_url: Optional[str] = None
    hero_url: Optional[str] = None
    galeria: Optional[List[str]] = None
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    direccion: Optional[str] = None
    email: Optional[str] = None
    social_links: Optional[SocialLinks] = None
    actividades: Optional[List[str]] = None
    destacada: Optional[bool] = None
    activa: Optional[bool] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None

class Articulo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    slug: str
    contenido: str
    resumen: str
    hero_url: Optional[str] = None
    galeria: List[str] = []
    publicado: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ArticuloCreate(BaseModel):
    titulo: str
    contenido: str
    resumen: str
    hero_url: Optional[str] = None
    galeria: List[str] = []
    publicado: bool = False

class ArticuloUpdate(BaseModel):
    titulo: Optional[str] = None
    contenido: Optional[str] = None
    resumen: Optional[str] = None
    hero_url: Optional[str] = None
    galeria: Optional[List[str]] = None
    publicado: Optional[bool] = None

class Usuario(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    username: str

# ==================== SETTINGS & CATEGORIES MODELS ====================

class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "site_settings"
    hero_image: str = "https://images.unsplash.com/photo-1732043846829-dc34d9e2e989?w=1920"
    hero_title: str = "Descubre la Aventura"
    hero_subtitle: str = "Explora las experiencias más emocionantes de turismo de naturaleza y aventura en Jalisco, México"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteSettingsUpdate(BaseModel):
    hero_image: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None

class Categoria(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    slug: str
    descripcion: str = ""
    imagen_url: str = ""
    orden: int = 0
    activa: bool = True

class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: str = ""
    imagen_url: str = ""
    orden: int = 0
    activa: bool = True

class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    orden: Optional[int] = None
    activa: Optional[bool] = None

class MediaFile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_name: str
    url: str
    size: int
    mime_type: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== ACTIVIDADES MODELS ====================

class Actividad(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    slug: str
    descripcion: str = ""
    icono_url: str = ""
    color: str = "#1a4d2e"  # Color for map markers
    orden: int = 0
    activa: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActividadCreate(BaseModel):
    nombre: str
    descripcion: str = ""
    icono_url: str = ""
    color: str = "#1a4d2e"
    orden: int = 0
    activa: bool = True

class ActividadUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    icono_url: Optional[str] = None
    color: Optional[str] = None
    orden: Optional[int] = None
    activa: Optional[bool] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())

def create_token(user_id: str, username: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc).timestamp() + 86400  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await db.usuarios.find_one({"username": request.username}, {"_id": 0})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_token(user["id"], user["username"])
    return LoginResponse(token=token, username=user["username"])

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    return {"username": user["username"], "user_id": user["user_id"]}

# ==================== EMPRESAS ROUTES ====================

@api_router.get("/empresas", response_model=List[Empresa])
async def get_empresas(
    categoria: Optional[str] = None,
    busqueda: Optional[str] = None,
    destacada: Optional[bool] = None,
    activa: bool = True
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
            {"actividades": {"$regex": busqueda, "$options": "i"}}
        ]
    
    empresas = await db.empresas.find(query, {"_id": 0}).to_list(1000)
    
    for empresa in empresas:
        if isinstance(empresa.get('created_at'), str):
            empresa['created_at'] = datetime.fromisoformat(empresa['created_at'])
        if isinstance(empresa.get('updated_at'), str):
            empresa['updated_at'] = datetime.fromisoformat(empresa['updated_at'])
    
    return empresas

@api_router.get("/empresas/{slug}", response_model=Empresa)
async def get_empresa(slug: str):
    empresa = await db.empresas.find_one({"slug": slug}, {"_id": 0})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    if isinstance(empresa.get('created_at'), str):
        empresa['created_at'] = datetime.fromisoformat(empresa['created_at'])
    if isinstance(empresa.get('updated_at'), str):
        empresa['updated_at'] = datetime.fromisoformat(empresa['updated_at'])
    
    # Increment views counter
    await db.empresas.update_one({"slug": slug}, {"$inc": {"views": 1}})
    
    return empresa

@api_router.get("/empresas-top-views")
async def get_top_viewed_empresas():
    """Get top 5 most viewed empresas for admin dashboard"""
    empresas = await db.empresas.find(
        {"activa": True},
        {"_id": 0, "nombre": 1, "slug": 1, "views": 1, "categoria": 1, "logo_url": 1}
    ).sort("views", -1).limit(5).to_list(5)
    for e in empresas:
        e.setdefault("views", 0)
    return empresas

@api_router.get("/nosotros-settings")
async def get_nosotros_settings():
    settings = await db.settings.find_one({"id": "nosotros_settings"}, {"_id": 0})
    if not settings:
        return {
            "mision": "Impulsar el desarrollo sustentable y la profesionalización del turismo de naturaleza en Jalisco, conectando a viajeros conscientes con experiencias auténticas en nuestras montañas, costas y bosques.",
            "vision": "Ser el referente nacional en turismo de aventura, posicionando a Jalisco como un destino seguro, diverso y líder en conservación ambiental.",
            "valores": ["Sustentabilidad", "Seguridad", "Comunidad", "Pasión por la Tierra"],
            "cta_titulo": "¿Quieres unirte al Clúster?",
            "cta_texto": "Si tu empresa ofrece servicios de turismo de naturaleza y aventura en Jalisco, te invitamos a formar parte de nuestra red.",
        }
    return settings

@api_router.put("/nosotros-settings")
async def update_nosotros_settings(data: dict, user = Depends(get_current_user)):
    data["id"] = "nosotros_settings"
    await db.settings.update_one(
        {"id": "nosotros_settings"},
        {"$set": data},
        upsert=True
    )
    return {"status": "ok"}

@api_router.post("/contacto")
async def submit_contacto(data: dict):
    """Save contact form submission"""
    doc = {
        "id": str(uuid.uuid4()),
        "nombre": data.get("nombre", ""),
        "email": data.get("email", ""),
        "empresa": data.get("empresa", ""),
        "mensaje": data.get("mensaje", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contactos.insert_one(doc)
    return {"status": "ok", "message": "Mensaje enviado correctamente"}

@api_router.post("/empresas", response_model=Empresa)
async def create_empresa(data: EmpresaCreate, user = Depends(get_current_user)):
    empresa_dict = data.model_dump()
    empresa_dict["slug"] = slugify(data.nombre, lowercase=True)
    
    # Check for duplicate slug
    existing = await db.empresas.find_one({"slug": empresa_dict["slug"]})
    if existing:
        empresa_dict["slug"] = f"{empresa_dict['slug']}-{str(uuid.uuid4())[:8]}"
    
    empresa = Empresa(**empresa_dict)
    doc = empresa.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.empresas.insert_one(doc)
    return empresa

@api_router.put("/empresas/{slug}", response_model=Empresa)
async def update_empresa(slug: str, data: EmpresaUpdate, user = Depends(get_current_user)):
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
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "social_links" in update_data and update_data["social_links"]:
        update_data["social_links"] = update_data["social_links"].model_dump() if hasattr(update_data["social_links"], 'model_dump') else update_data["social_links"]
    
    await db.empresas.update_one({"slug": slug}, {"$set": update_data})
    
    updated = await db.empresas.find_one({"slug": update_data.get("slug", slug)}, {"_id": 0})
    
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return updated

@api_router.delete("/empresas/{slug}")
async def delete_empresa(slug: str, user = Depends(get_current_user)):
    result = await db.empresas.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return {"message": "Empresa eliminada"}

# ==================== ARTICULOS ROUTES ====================

@api_router.get("/articulos", response_model=List[Articulo])
async def get_articulos(publicado: Optional[bool] = None):
    query = {}
    if publicado is not None:
        query["publicado"] = publicado
    
    articulos = await db.articulos.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for articulo in articulos:
        if isinstance(articulo.get('created_at'), str):
            articulo['created_at'] = datetime.fromisoformat(articulo['created_at'])
        if isinstance(articulo.get('updated_at'), str):
            articulo['updated_at'] = datetime.fromisoformat(articulo['updated_at'])
    
    return articulos

@api_router.get("/articulos/{slug}", response_model=Articulo)
async def get_articulo(slug: str):
    articulo = await db.articulos.find_one({"slug": slug}, {"_id": 0})
    if not articulo:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    
    if isinstance(articulo.get('created_at'), str):
        articulo['created_at'] = datetime.fromisoformat(articulo['created_at'])
    if isinstance(articulo.get('updated_at'), str):
        articulo['updated_at'] = datetime.fromisoformat(articulo['updated_at'])
    
    return articulo

@api_router.post("/articulos", response_model=Articulo)
async def create_articulo(data: ArticuloCreate, user = Depends(get_current_user)):
    articulo_dict = data.model_dump()
    articulo_dict["slug"] = slugify(data.titulo, lowercase=True)
    
    existing = await db.articulos.find_one({"slug": articulo_dict["slug"]})
    if existing:
        articulo_dict["slug"] = f"{articulo_dict['slug']}-{str(uuid.uuid4())[:8]}"
    
    articulo = Articulo(**articulo_dict)
    doc = articulo.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.articulos.insert_one(doc)
    return articulo

@api_router.put("/articulos/{slug}", response_model=Articulo)
async def update_articulo(slug: str, data: ArticuloUpdate, user = Depends(get_current_user)):
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
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.articulos.update_one({"slug": slug}, {"$set": update_data})
    
    updated = await db.articulos.find_one({"slug": update_data.get("slug", slug)}, {"_id": 0})
    
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return updated

@api_router.delete("/articulos/{slug}")
async def delete_articulo(slug: str, user = Depends(get_current_user)):
    result = await db.articulos.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    return {"message": "Artículo eliminado"}

# ==================== CATEGORIES CRUD ====================

@api_router.get("/categorias")
async def get_categorias():
    # First try to get from database
    categorias = await db.categorias.find({}, {"_id": 0}).sort("orden", 1).to_list(100)
    if categorias:
        return {"categorias": categorias}
    
    # Fallback to default categories
    return {"categorias": [{"nombre": c, "slug": slugify(c), "descripcion": "", "imagen_url": "", "orden": i, "activa": True} for i, c in enumerate(CATEGORIES)]}

@api_router.post("/categorias", response_model=Categoria)
async def create_categoria(data: CategoriaCreate, user = Depends(get_current_user)):
    categoria_dict = data.model_dump()
    categoria_dict["slug"] = slugify(data.nombre, lowercase=True)
    
    existing = await db.categorias.find_one({"slug": categoria_dict["slug"]})
    if existing:
        raise HTTPException(status_code=400, detail="Categoría ya existe")
    
    categoria = Categoria(**categoria_dict)
    doc = categoria.model_dump()
    await db.categorias.insert_one(doc)
    return categoria

@api_router.put("/categorias/{slug}", response_model=Categoria)
async def update_categoria(slug: str, data: CategoriaUpdate, user = Depends(get_current_user)):
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

@api_router.delete("/categorias/{slug}")
async def delete_categoria(slug: str, user = Depends(get_current_user)):
    result = await db.categorias.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"message": "Categoría eliminada"}

# ==================== ACTIVIDADES CRUD ====================

@api_router.get("/actividades", response_model=List[Actividad])
async def get_actividades(activa: Optional[bool] = None):
    query = {}
    if activa is not None:
        query["activa"] = activa
    
    actividades = await db.actividades.find(query, {"_id": 0}).sort("orden", 1).to_list(100)
    
    for act in actividades:
        if isinstance(act.get('created_at'), str):
            act['created_at'] = datetime.fromisoformat(act['created_at'])
    
    return actividades

@api_router.get("/actividades/{slug}", response_model=Actividad)
async def get_actividad(slug: str):
    actividad = await db.actividades.find_one({"slug": slug}, {"_id": 0})
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    
    if isinstance(actividad.get('created_at'), str):
        actividad['created_at'] = datetime.fromisoformat(actividad['created_at'])
    
    return actividad

@api_router.post("/actividades", response_model=Actividad)
async def create_actividad(data: ActividadCreate, user = Depends(get_current_user)):
    actividad_dict = data.model_dump()
    actividad_dict["slug"] = slugify(data.nombre, lowercase=True)
    
    existing = await db.actividades.find_one({"slug": actividad_dict["slug"]})
    if existing:
        actividad_dict["slug"] = f"{actividad_dict['slug']}-{str(uuid.uuid4())[:8]}"
    
    actividad = Actividad(**actividad_dict)
    doc = actividad.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.actividades.insert_one(doc)
    return actividad

@api_router.put("/actividades/{slug}", response_model=Actividad)
async def update_actividad(slug: str, data: ActividadUpdate, user = Depends(get_current_user)):
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
    
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return updated

@api_router.delete("/actividades/{slug}")
async def delete_actividad(slug: str, user = Depends(get_current_user)):
    result = await db.actividades.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    return {"message": "Actividad eliminada"}

# ==================== SITE SETTINGS ====================

@api_router.get("/settings", response_model=SiteSettings)
async def get_settings():
    settings = await db.settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        return SiteSettings()
    
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return settings

@api_router.put("/settings", response_model=SiteSettings)
async def update_settings(data: SiteSettingsUpdate, user = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["id"] = "site_settings"
    
    await db.settings.update_one(
        {"id": "site_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"id": "site_settings"}, {"_id": 0})
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return settings

# ==================== MEDIA UPLOAD WITH OPTIMIZATION PIPELINE ====================

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create organized folder structure
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
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Image optimization settings
IMAGE_SIZES = {
    "hero": 1920,      # Hero images max width
    "card": 800,       # Card/thumbnail images
    "logo": 400,       # Logos
    "galeria": 1200,   # Gallery images
    "icon": 200,       # Icons/small images
}
WEBP_QUALITY = 85

def optimize_image(image_data: bytes, max_width: int = 1920, quality: int = WEBP_QUALITY) -> tuple[bytes, str]:
    """
    Optimize image: resize if needed, convert to WebP, compress.
    Returns (optimized_bytes, new_extension)
    """
    try:
        img = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary (for PNG with transparency, keep RGBA)
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            # Keep alpha channel for transparency
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        
        # Resize if wider than max_width
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # Save as WebP
        output = io.BytesIO()
        if img.mode == 'RGBA':
            img.save(output, format='WEBP', quality=quality, method=6)
        else:
            img.save(output, format='WEBP', quality=quality, method=6)
        
        return output.getvalue(), '.webp'
    except Exception as e:
        logging.error(f"Image optimization failed: {e}")
        # Return original if optimization fails
        return image_data, None

def get_upload_folder(category: str, entity_slug: str = None, subfolder: str = None) -> Path:
    """Get the appropriate upload folder based on category and entity."""
    base = MEDIA_FOLDERS.get(category, UPLOAD_DIR / "system")
    
    if entity_slug:
        folder = base / entity_slug
        if subfolder:
            folder = folder / subfolder
    else:
        folder = base
    
    folder.mkdir(parents=True, exist_ok=True)
    return folder

@api_router.get("/media", response_model=List[MediaFile])
async def get_media_files(
    category: Optional[str] = None,
    entity_slug: Optional[str] = None,
    user = Depends(get_current_user)
):
    """Get media files, optionally filtered by category and entity."""
    query = {}
    if category:
        query["category"] = category
    if entity_slug:
        query["entity_slug"] = entity_slug
    
    files = await db.media.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for f in files:
        if isinstance(f.get('created_at'), str):
            f['created_at'] = datetime.fromisoformat(f['created_at'])
    return files

@api_router.post("/media/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form(default="system"),
    entity_slug: str = Form(default=""),
    subfolder: str = Form(default=""),
    image_type: str = Form(default="card"),
    user = Depends(get_current_user)
):
    """
    Upload and optimize image file.
    
    - category: system, empresas, articulos, actividades, categorias
    - entity_slug: slug of the entity (empresa, articulo, etc.)
    - subfolder: logo, hero, galeria (for empresas)
    - image_type: hero, card, logo, galeria, icon (determines max width)
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de archivo no permitido. Permitidos: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande. Máximo 10MB")
    
    # Optimize image (skip for SVG and GIF)
    original_size = len(content)
    if file_ext not in {'.svg', '.gif'}:
        max_width = IMAGE_SIZES.get(image_type, 1200)
        optimized_content, new_ext = optimize_image(content, max_width)
        if new_ext:
            content = optimized_content
            file_ext = new_ext
    
    # Generate unique filename
    unique_id = str(uuid.uuid4())[:8]
    safe_name = slugify(Path(file.filename).stem, lowercase=True)
    new_filename = f"{safe_name}_{unique_id}{file_ext}"
    
    # Get appropriate folder
    upload_folder = get_upload_folder(category, entity_slug or None, subfolder or None)
    file_path = upload_folder / new_filename
    
    # Build relative URL path
    relative_path = file_path.relative_to(UPLOAD_DIR)
    url = f"/api/uploads/{relative_path.as_posix()}"
    
    # Save file
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar archivo: {str(e)}")
    
    # Create media record
    media_file = MediaFile(
        filename=new_filename,
        original_name=file.filename,
        url=url,
        size=len(content),
        mime_type="image/webp" if file_ext == '.webp' else (file.content_type or "application/octet-stream")
    )
    
    # Add category info to record
    doc = media_file.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['category'] = category
    doc['entity_slug'] = entity_slug
    doc['subfolder'] = subfolder
    doc['original_size'] = original_size
    doc['optimized_size'] = len(content)
    doc['compression_ratio'] = round((1 - len(content) / original_size) * 100, 1) if original_size > 0 else 0
    
    await db.media.insert_one(doc)
    
    # Return response with optimization info
    return {
        **media_file.model_dump(),
        "category": category,
        "entity_slug": entity_slug,
        "original_size": original_size,
        "optimized_size": len(content),
        "compression_ratio": doc['compression_ratio'],
        "message": f"Imagen optimizada. Reducción: {doc['compression_ratio']}%"
    }

@api_router.delete("/media/{file_id}")
async def delete_media(file_id: str, user = Depends(get_current_user)):
    media = await db.media.find_one({"id": file_id}, {"_id": 0})
    if not media:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    # Build full path from URL
    url_path = media.get("url", "").replace("/api/uploads/", "")
    file_path = UPLOAD_DIR / url_path
    
    if file_path.exists():
        file_path.unlink()
    
    await db.media.delete_one({"id": file_id})
    return {"message": "Archivo eliminado"}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Clúster de Turismo de Naturaleza y Aventura Jalisco API"}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Create admin user if not exists
    admin = await db.usuarios.find_one({"username": "admin"})
    if not admin:
        admin_user = Usuario(
            username="admin",
            password_hash=hash_password("admin123")
        )
        doc = admin_user.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.usuarios.insert_one(doc)
    
    # Seed Actividades
    actividades_seed = [
        {"nombre": "Senderismo", "descripcion": "Caminatas por senderos naturales", "color": "#2d6a4f", "orden": 1},
        {"nombre": "Rappel", "descripcion": "Descenso por cuerdas en formaciones rocosas", "color": "#1a4d2e", "orden": 2},
        {"nombre": "Kayak", "descripcion": "Navegación en kayak por ríos y lagos", "color": "#0284c7", "orden": 3},
        {"nombre": "Ciclismo de Montaña", "descripcion": "Rutas en bicicleta por terrenos montañosos", "color": "#d97706", "orden": 4},
        {"nombre": "Tirolesa", "descripcion": "Deslizamiento por cables en las alturas", "color": "#059669", "orden": 5},
        {"nombre": "Campismo", "descripcion": "Acampada en entornos naturales", "color": "#4f46e5", "orden": 6},
        {"nombre": "Escalada", "descripcion": "Escalada en roca natural", "color": "#dc2626", "orden": 7},
        {"nombre": "Observación de Aves", "descripcion": "Avistamiento de aves silvestres", "color": "#7c3aed", "orden": 8},
        {"nombre": "Tours de Tequila", "descripcion": "Visitas a destilerías y campos de agave", "color": "#ca8a04", "orden": 9},
        {"nombre": "Cabalgata", "descripcion": "Paseos a caballo", "color": "#9a3412", "orden": 10},
    ]
    
    for act_data in actividades_seed:
        slug = slugify(act_data["nombre"], lowercase=True)
        existing = await db.actividades.find_one({"slug": slug})
        if not existing:
            actividad = Actividad(
                nombre=act_data["nombre"],
                slug=slug,
                descripcion=act_data["descripcion"],
                color=act_data["color"],
                orden=act_data["orden"],
                activa=True
            )
            doc = actividad.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.actividades.insert_one(doc)
    
    # Create Ecomuk empresa
    ecomuk = await db.empresas.find_one({"slug": "ecomuk-aventura-natural"})
    if not ecomuk:
        ecomuk_data = Empresa(
            nombre="Ecomuk Aventura Natural",
            slug="ecomuk-aventura-natural",
            categoria="Capacitación",
            descripcion="En Ecomuk, llevamos a cabo nuestras actividades en una selección de destinos excepcionales, todos ellos ubicados en entornos naturales de gran valor escénico y biodiversidad. Estos lugares, cuidadosamente elegidos, no solo son seguros para que disfrutes con total confianza, sino que también te permiten conectar con la belleza y la riqueza de la naturaleza en su estado más puro. Guías certificados, equipos de última generación y protocolos rigurosos garantizan experiencias inolvidables en la naturaleza.",
            logo_url="https://ecomuk.com.mx/wp-content/uploads/2025/03/1.png",
            hero_url="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920",
            galeria=[
                "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
                "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800",
                "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800"
            ],
            telefono="+52 333 460 1257",
            whatsapp="523334601257",
            direccion="Zapopan, Jalisco, México",
            email="contacto@ecomuk.com.mx",
            social_links=SocialLinks(
                facebook="https://www.facebook.com/ecomukaventuranatural",
                instagram="https://www.instagram.com/ecomuk/",
                twitter="https://twitter.com/ecomuk",
                youtube="https://www.youtube.com/channel/UCU8I5eNl1Hfr24XQ5uIALYg",
                website="https://ecomuk.com.mx"
            ),
            actividades=["Navegación Terrestre", "Aventura en la Barranca", "Sierra de Quila", "Capacitación", "Senderismo", "Rappel"],
            destacada=True,
            activa=True,
            latitud=20.7214,
            longitud=-103.4189
        )
        doc = ecomuk_data.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.empresas.insert_one(doc)
    
    # Create Aventúrate por Jalisco empresa
    aventurate = await db.empresas.find_one({"slug": "aventurate-por-jalisco"})
    if not aventurate:
        aventurate_data = Empresa(
            nombre="Aventúrate por Jalisco DMC",
            slug="aventurate-por-jalisco",
            categoria="Operadora de aventura",
            descripcion="Aventúrate por Jalisco DMC ofrece tours, paquetes y experiencias únicas en Jalisco, México. Desde el legendario tren José Cuervo Express hasta visitas a haciendas tequileras centenarias como Casa Herradura. Descubre los mejores tours de día desde Guadalajara: Tequila, pueblos mágicos y experiencias inolvidables. Servicios de transportación privada y grupal.",
            logo_url="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=400",
            hero_url="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1920",
            galeria=[
                "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800",
                "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
                "https://images.unsplash.com/photo-1596397249129-c7a2f89dc7d2?w=800"
            ],
            telefono="+52 332 253 7893",
            whatsapp="523322537893",
            direccion="Guadalajara, Jalisco, México",
            email="info@aventurateporjalisco.com",
            social_links=SocialLinks(
                website="https://aventurateporjalisco.com"
            ),
            actividades=["José Cuervo Express", "Tours de Tequila", "Haciendas", "Transportación", "Paquetes turísticos", "Lago de Chapala"],
            destacada=True,
            activa=True,
            latitud=20.6597,
            longitud=-103.3496
        )
        doc = aventurate_data.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.empresas.insert_one(doc)
    
    # Create sample article
    articulo = await db.articulos.find_one({"slug": "bienvenidos-al-cluster"})
    if not articulo:
        articulo_data = Articulo(
            titulo="Bienvenidos al Clúster de Turismo de Naturaleza y Aventura Jalisco",
            slug="bienvenidos-al-cluster",
            contenido="""<h2>Un nuevo capítulo para el turismo en Jalisco</h2>
<p>El Clúster de Turismo de Naturaleza y Aventura Jalisco nace con el objetivo de promover y fortalecer el sector turístico de aventura en nuestro estado.</p>
<p>Jalisco cuenta con una riqueza natural incomparable: desde las majestuosas barrancas de Zapopan hasta los campos de agave que son Patrimonio de la Humanidad, pasando por la Sierra de Quila y los hermosos lagos y ríos que adornan nuestra geografía.</p>
<h3>Nuestros objetivos</h3>
<ul>
<li>Promover el turismo sustentable y responsable</li>
<li>Capacitar a los operadores turísticos</li>
<li>Conectar a visitantes con experiencias auténticas</li>
<li>Preservar nuestros recursos naturales</li>
</ul>
<p>Te invitamos a explorar nuestro directorio de empresas y descubrir las increíbles experiencias que Jalisco tiene para ofrecer.</p>""",
            resumen="El Clúster de Turismo de Naturaleza y Aventura Jalisco nace para promover el turismo sustentable y conectar visitantes con experiencias auténticas.",
            hero_url="https://images.unsplash.com/photo-1732043846829-dc34d9e2e989?w=1920",
            galeria=[],
            publicado=True
        )
        doc = articulo_data.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.articulos.insert_one(doc)
    
    return {"message": "Datos sembrados exitosamente", "admin_credentials": {"username": "admin", "password": "admin123"}}

# Include router and middleware
app.include_router(api_router)

# Mount uploads directory as static files
app.mount("/api/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
