from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
    
    return empresa

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

# ==================== CATEGORIES ====================

@api_router.get("/categorias")
async def get_categorias():
    return {"categorias": CATEGORIES}

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
            activa=True
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
            activa=True
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
