from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid


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
    ubicaciones_actividades: List[dict] = []
    destacada: bool = False
    activa: bool = True
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    # Affiliation fields
    estado: str = "aprobado"  # borrador, pendiente_pago, pendiente_aprobacion, aprobado, rechazado
    cuenta_id: Optional[str] = None
    motivo_rechazo: Optional[str] = None
    requisitos_completados: List[dict] = []
    certificaciones: List[dict] = []
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
    ubicaciones_actividades: List[dict] = []
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
    ubicaciones_actividades: Optional[List[dict]] = None
    destacada: Optional[bool] = None
    activa: Optional[bool] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    estado: Optional[str] = None
    motivo_rechazo: Optional[str] = None
    requisitos_completados: Optional[List[dict]] = None
    certificaciones: Optional[List[dict]] = None


# ==================== PST Account ====================

class EmpresaCuenta(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    nombre_contacto: str
    telefono_contacto: str = ""
    empresa_id: Optional[str] = None
    activa: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PSTRegisterRequest(BaseModel):
    email: str
    password: str
    nombre_contacto: str
    telefono_contacto: str = ""


class PSTLoginRequest(BaseModel):
    email: str
    password: str


# ==================== Affiliation Requirements ====================

class Requisito(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    descripcion: str = ""
    eje: str = ""
    bloqueante: bool = False
    tipo_captura: str = "checkbox"  # documento, checkbox, selector, campo_texto, campo_numerico
    opciones_selector: List[str] = []
    documento_requerido: bool = False
    texto_informativo: str = ""
    orden: int = 0
    activo: bool = True


class RequisitoCreate(BaseModel):
    nombre: str
    descripcion: str = ""
    eje: str = ""
    bloqueante: bool = False
    tipo_captura: str = "checkbox"
    opciones_selector: List[str] = []
    documento_requerido: bool = False
    texto_informativo: str = ""
    orden: int = 0
    activo: bool = True


class RequisitoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    eje: Optional[str] = None
    bloqueante: Optional[bool] = None
    tipo_captura: Optional[str] = None
    opciones_selector: Optional[List[str]] = None
    documento_requerido: Optional[bool] = None
    texto_informativo: Optional[str] = None
    orden: Optional[int] = None
    activo: Optional[bool] = None


# ==================== Plans & Subscriptions ====================

class Plan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    duracion_meses: int
    precio: float = 0.0
    moneda: str = "MXN"
    descripcion: str = ""
    beneficios: List[str] = []
    activo: bool = True
    orden: int = 0


class PlanCreate(BaseModel):
    nombre: str
    duracion_meses: int
    precio: float = 0.0
    moneda: str = "MXN"
    descripcion: str = ""
    beneficios: List[str] = []
    activo: bool = True
    orden: int = 0


class PlanUpdate(BaseModel):
    nombre: Optional[str] = None
    duracion_meses: Optional[int] = None
    precio: Optional[float] = None
    moneda: Optional[str] = None
    descripcion: Optional[str] = None
    beneficios: Optional[List[str]] = None
    activo: Optional[bool] = None
    orden: Optional[int] = None


class CodigoDescuento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    codigo: str
    tipo_descuento: str = "porcentaje"  # porcentaje | monto_fijo
    valor: float = 0.0
    usos_maximos: int = 0  # 0 = unlimited
    usos_actuales: int = 0
    fecha_expiracion: Optional[str] = None
    activo: bool = True


class Suscripcion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    empresa_id: str
    cuenta_id: str
    plan_id: str
    plan_nombre: str = ""
    estado: str = "activa"  # activa | vencida | cancelada
    metodo_pago: str = ""  # stripe | transferencia
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    fecha_inicio: str = ""
    fecha_fin: str = ""
    codigo_descuento_id: Optional[str] = None
    monto_pagado: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
    nombre: str = ""
    email: str = ""
    role: str = "admin"
    activo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str


class HeroSlide(BaseModel):
    image: str = ""
    title: str = ""
    subtitle: str = ""


class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str = "site_settings"
    hero_image: str = "https://images.unsplash.com/photo-1732043846829-dc34d9e2e989?w=1920"
    hero_title: str = "Descubre la Aventura"
    hero_subtitle: str = "Explora las experiencias más emocionantes de turismo de naturaleza y aventura en Jalisco, México"
    hero_slides: List[dict] = []
    whatsapp_number: str = ""
    whatsapp_visible: bool = False
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SiteSettingsUpdate(BaseModel):
    hero_image: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_slides: Optional[List[dict]] = None
    whatsapp_number: Optional[str] = None
    whatsapp_visible: Optional[bool] = None


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


class Actividad(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    slug: str
    descripcion: str = ""
    icono_url: str = ""
    color: str = "#1a4d2e"
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


CATEGORIES = [
    "Capacitación",
    "Operadora de aventura",
    "Parque acuático",
    "Hospedaje",
    "Parque de aventura",
]
