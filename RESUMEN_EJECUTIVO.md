# 📋 Resumen Ejecutivo del Proyecto
## Clúster de Turismo de Naturaleza y Aventura Jalisco

---

## 1. Visión General

**Plataforma web integral** que conecta a empresas de turismo de naturaleza y aventura en Jalisco con viajeros conscientes. Funciona como un **directorio geolocalizado**, un portal de noticias del sector, y una herramienta de gestión administrativa para el Clúster.

**URL de Producción:** Desplegado en VPS propio con dominio del cliente (HTTPS/SSL)
**URL de Preview:** https://nature-hub-23.preview.emergentagent.com

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18, Tailwind CSS, Shadcn/UI, Leaflet (Mapas), Recharts (Gráficas) |
| **Backend** | FastAPI (Python), Motor (MongoDB async), JWT Auth |
| **Base de Datos** | MongoDB |
| **Infraestructura** | Docker Compose, Nginx (Proxy Inverso), Certbot (SSL/HTTPS) |
| **Servidor** | VPS Hostinger (Linux) |

---

## 3. Módulos Desarrollados

### 🌐 Sitio Público (Frontend)

| Página | Funcionalidad |
|--------|--------------|
| **Home (Index)** | Hero con carrusel de hasta 3 imágenes editables, numeralia dinámica, categorías (máx 8 centradas), sección "Empresas más consultadas" (Top 6 por visitas + prioridad manual), CTA y footer personalizados |
| **Directorio de Empresas** | Listado filtrable por categoría, búsqueda por nombre/actividad, hero dinámico por categoría seleccionada |
| **Detalle de Empresa** | Perfil completo con galería (lightbox con logo superpuesto), actividades, mapa Leaflet con todos los pines de operación, datos de contacto y redes sociales |
| **Mapa Interactivo** | Mapa Leaflet con pines geolocalizados, filtro por actividad, búsqueda, popup con información de empresa y enlace al perfil, panel lateral con listado de empresas |
| **Prensa** | Listado de artículos/notas sin fechas en tarjetas, detalle con galería de imágenes |
| **Nosotros** | Hero con imagen de fondo, misión/visión/valores, numeralia con nombres largos, formulario de contacto |
| **WhatsApp Flotante** | Burbuja en todas las páginas públicas, configurable desde admin (número + visibilidad) |

### 🔧 Panel de Administración

| Módulo | Funcionalidad |
|--------|--------------|
| **Dashboard** | 6 KPIs (Empresas, Artículos, Actividades, Mensajes, No leídos, WhatsApp Clicks), gráficas de visitas por categoría |
| **Empresas** | CRUD completo, upload de logo/hero/galería (con ImageUploader), multi-select de actividades, MapPicker para sede + ActivityLocationManager para pines de operación |
| **Artículos/Prensa** | CRUD con editor de texto enriquecido, imagen principal + galería de imágenes |
| **Actividades** | CRUD con colores personalizados para pines del mapa |
| **Categorías** | CRUD con imagen, descripción, orden |
| **Leads/Contactos** | Listado con filtro leído/no leído, eliminación, **exportación a CSV** (UTF-8 con BOM para Excel) |
| **Configuración** | Carrusel del hero (hasta 3 slides con texto independiente, herencia automática), WhatsApp global (número internacional + toggle) |
| **Nosotros Editor** | Edición de misión/visión/valores, **numeralia editable** con nombre corto (Index) y largo (Nosotros) |
| **SEO** | Configuración de meta tags por página |

---

## 4. Arquitectura del Proyecto

```
/app
├── backend/
│   ├── server.py           → App principal, analytics, mapa/pines, WA clicks, CSV export
│   ├── database.py         → Conexión MongoDB (Motor async)
│   ├── models.py           → Modelos Pydantic (Empresa, Articulo, SiteSettings, etc.)
│   ├── auth.py             → JWT Authentication + middleware
│   ├── seed.py             → Seed idempotente (admin, categorías, actividades)
│   ├── routes/
│   │   ├── empresas.py     → CRUD + empresas-destacadas + resolución de actividades
│   │   ├── actividades.py  → CRUD actividades
│   │   ├── articulos.py    → CRUD artículos/prensa
│   │   ├── categorias.py   → CRUD categorías
│   │   ├── leads.py        → CRUD contactos
│   │   ├── media_settings.py → Settings + nosotros-settings + upload de imágenes
│   │   ├── auth_routes.py  → Login/registro
│   │   ├── seo.py          → Configuración SEO
│   │   └── usuarios.py     → Gestión de usuarios
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.js          → Router principal + ScrollToTop
│   │   ├── pages/          → Home, Empresas, EmpresaDetalle, Mapa, Prensa, Nosotros
│   │   ├── pages/admin/    → Dashboard, EmpresaForm, ArticuloForm, AdminSettings, etc.
│   │   └── components/     → FloatingNav, WhatsAppButton, ActivityLocationManager,
│   │                         MapPicker, ImageUploader, CompanyCard, SEO, AdminLayout
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml      → Orquestación (frontend + backend + MongoDB)
└── DEPLOY_VPS.md           → Guía de despliegue
```

---

## 5. API Endpoints Principales

### Públicos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/settings` | Configuración del sitio (hero, WhatsApp) |
| GET | `/api/empresas` | Listado de empresas (filtro por categoría, activa) |
| GET | `/api/empresas/:slug` | Detalle de empresa (incrementa vistas, resuelve actividades) |
| GET | `/api/empresas-destacadas` | Top 6 empresas por visitas + toggle destacada |
| GET | `/api/actividades` | Listado de actividades |
| GET | `/api/categorias` | Listado de categorías |
| GET | `/api/articulos` | Listado de artículos |
| GET | `/api/mapa/pines` | Pines geolocalizados (filtro: `?actividad=X`) |
| GET | `/api/nosotros-settings` | Configuración de Nosotros (numeralia) |
| POST | `/api/analytics/whatsapp-click` | Tracking silencioso de clics en WhatsApp |

### Autenticados (Admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Autenticación JWT |
| PUT | `/api/settings` | Actualizar configuración (hero slides, WhatsApp) |
| PUT | `/api/nosotros-settings` | Actualizar nosotros (numeralia) |
| GET | `/api/analytics/overview` | Dashboard con 6 KPIs |
| GET | `/api/leads/export-csv` | Exportar leads como CSV (UTF-8 + BOM) |
| POST/PUT/DELETE | `/api/empresas` | CRUD empresas |
| POST/PUT/DELETE | `/api/articulos` | CRUD artículos |

---

## 6. Modelo de Datos Clave

### Empresa
```json
{
  "id": "uuid",
  "nombre": "Ecomuk Aventura Natural",
  "slug": "ecomuk-aventura-natural",
  "categoria": "Operadora de aventura",
  "actividades": ["id-senderismo", "id-rappel"],
  "ubicaciones_actividades": [
    {
      "actividad_id": "id-senderismo",
      "actividad_nombre": "Senderismo",
      "latitud": 20.6523,
      "longitud": -103.4012,
      "nota": "Trail Barranca de Huentitán"
    }
  ],
  "latitud": 20.7214,    // Sede principal
  "longitud": -103.3890,
  "views": 45,
  "destacada": true,
  "galeria": ["url1", "url2"],
  "logo_url": "...",
  "hero_url": "..."
}
```

### Site Settings
```json
{
  "id": "site_settings",
  "hero_slides": [
    {"image": "url", "title": "Descubre la Aventura", "subtitle": "..."}
  ],
  "whatsapp_number": "+523331234567",
  "whatsapp_visible": true
}
```

### Nosotros Settings → Numeralia
```json
{
  "stats": [
    {"value": "50+", "short_label": "Destinos", "label": "Destinos Naturales"}
  ]
}
```

---

## 7. Fases de Desarrollo Completadas

### Fase 1 — Correcciones Críticas y Ajustes Visuales ✅
- Hero restaurado con carrusel, categorías centradas (máx 8), "Empresas más consultadas"
- Resolución de actividades (IDs→Nombres), fechas eliminadas de Prensa, hero en Nosotros

### Fase 2 — Admin Autónomo y Gestión de Contenido ✅
- Carrusel de hero editable (3 slides), numeralia con nombre corto/largo
- WhatsApp global con toggle, galerías en Prensa, logo en lightbox
- Fix de botón "Agregar imágenes" y menú móvil del admin

### Fase 3 — Inteligencia Geoespacial ✅
- Modelo multi-ubicación (`ubicaciones_actividades`)
- ActivityLocationManager: pines drag & drop por actividad en admin
- Mapa general con filtros por actividad, búsqueda, popups interactivos
- Panel lateral con listado de empresas
- WhatsApp Clicks tracking + KPI en Dashboard
- Exportación de Leads a CSV (UTF-8 + BOM)

### Ajustes Post-Producción ✅
- Restauración de logo (eliminación de animaciones que fallaban en Docker/producción)
- Logo reubicado a margen superior izquierdo (visibilidad inmediata)
- Gradiente dual en heroes para contraste de menú
- Mapa en layout boxed con panel lateral
- ScrollToTop global

---

## 8. Infraestructura de Despliegue

```
VPS Hostinger (Ubuntu/Debian)
├── Docker Compose
│   ├── turismo-frontend  → Nginx + React Build (puerto 80/443)
│   ├── turismo-backend   → FastAPI/Uvicorn (puerto 8001)
│   └── turismo-db        → MongoDB (puerto 27017)
├── Certbot (SSL/HTTPS automático)
└── Nginx (Proxy Inverso)
```

**Comando de actualización:**
```bash
cd /home/Cluster
git pull origin main
docker compose down
docker compose up -d --build
```

---

## 9. Credenciales

| Recurso | Usuario | Contraseña |
|---------|---------|------------|
| Panel Admin | `admin` | `admin123` |

---

## 10. Backlog Futuro (Roadmap)

| Prioridad | Feature | Descripción |
|-----------|---------|-------------|
| P1 | Onboarding de Editores | Envío de email para crear contraseña de nuevos editores |
| P2 | Multi-idioma | Soporte para inglés (turismo internacional) |
| P3 | PWA | Conversión a Progressive Web App para acceso offline |
| P3 | Rutas de Aventura | Itinerarios visuales conectando pines de diferentes empresas |

---

## 11. Métricas Actuales del Sistema

| Métrica | Valor |
|---------|-------|
| Empresas registradas | 3 |
| Actividades configuradas | 10 |
| Categorías | 5 |
| Artículos de prensa | 3 |
| Leads/Contactos | 8 |
| WhatsApp Clicks | 6 |

---

*Documento generado el 29 de marzo de 2026*
*Proyecto desarrollado con Emergent AI Platform*
