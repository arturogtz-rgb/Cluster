# Clúster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Descripción del Proyecto
Sitio web completo para el Clúster de Turismo de Naturaleza y Aventura de Jalisco, México. Incluye directorio de empresas, mapa interactivo geolocalizado, sección de prensa, y panel de administración completo.

## Stack Técnico
- **Frontend**: React, Tailwind CSS, Shadcn UI, Recharts, Leaflet
- **Backend**: FastAPI (modular), Motor (MongoDB async), JWT Auth
- **Base de datos**: MongoDB
- **DevOps**: Docker Compose, Nginx (Proxy Inverso), Certbot (SSL)

## Arquitectura
```
/app
├── backend/
│   ├── routes/ (actividades, articulos, auth_routes, categorias, empresas, leads, media_settings, seo, usuarios)
│   ├── server.py (analytics, mapa/pines, whatsapp-click, leads/export-csv)
│   ├── database.py, models.py, auth.py, seed.py, utils.py
├── frontend/
│   ├── src/pages/ (Home, Empresas, EmpresaDetalle, Prensa, ArticuloDetalle, Mapa, Nosotros, admin/*)
│   ├── src/components/ (AdminLayout, CompanyCard, FloatingNav, WhatsAppButton, ImageUploader, ActivityLocationManager, MapPicker, MultiSelectActividades, SEO)
```

## Fases del Proyecto - TODAS COMPLETADAS

### FASE 1: Correcciones Críticas y Ajustes Visuales - COMPLETADA (2026-03-28)
- [x] Hero Index al 50vh
- [x] "Empresas más consultadas" (renombrado + top 6 por visitas + prioridad manual)
- [x] CTA y footer actualizados
- [x] Bug fix: nombres de actividades resueltos (no UUIDs)
- [x] Prensa: fechas eliminadas de tarjetas
- [x] Nosotros: hero con imagen real
- [x] Categorías: centradas, máx 8, reducción móvil

### FASE 2: Funcionalidades de Admin y Gestión de Contenido - COMPLETADA (2026-03-28)
- [x] Hero dinámico: carrusel hasta 3 imágenes con texto en /admin/configuracion
- [x] Numeralia editable: Nombre corto (Index) y Nombre largo (Nosotros)
- [x] WhatsApp global: número con formato internacional, toggle, burbuja flotante
- [x] Galería de imágenes en detalle de Prensa y formulario de artículos
- [x] Logo superpuesto en lightbox de galería de empresa
- [x] Fix botón "Agregar imágenes" (ImageUploader + URL)
- [x] Fix menú lateral admin en móvil (z-index corregido)
- [x] Hero dinámico por categoría en /empresas?categoria=...

### FASE 3: Lógica Geo-Localizada + Extras - COMPLETADA (2026-03-29)
- [x] Rediseño modelo Empresa-Actividad: `ubicaciones_actividades` array de objetos
- [x] Admin EmpresaForm: Sede Principal (MapPicker) + Puntos de Operación (ActivityLocationManager)
- [x] Mapa interactivo admin: drag & drop pins por actividad con notas
- [x] Mapa General (/mapa): Leaflet completo con filtro por actividad, búsqueda, popups con empresa + enlace
- [x] Perfil Empresa: actividades únicas en texto, mapa Leaflet con todos los pines
- [x] WhatsApp Clicks tracking silencioso + métrica en Dashboard (6 KPIs)
- [x] Exportar Leads a CSV (UTF-8 con BOM para Excel, caracteres especiales correctos)

## API Endpoints Clave
- `GET /api/mapa/pines` - Todos los pines de actividades (filtro: ?actividad=X)
- `POST /api/analytics/whatsapp-click` - Tracking silencioso de clics
- `GET /api/leads/export-csv` - Exportación CSV (autenticado)
- `GET /api/analytics/overview` - Dashboard metrics (incluye whatsapp_clicks)
- `GET/PUT /api/settings` - Configuración (hero_slides, whatsapp_number, whatsapp_visible)
- `GET/PUT /api/nosotros-settings` - Numeralia con short_label/label
- `GET /api/empresas-destacadas` - Top 6 por visitas con prioridad manual

## Modelo de Datos - ubicaciones_actividades
```json
empresa.ubicaciones_actividades = [
  {"actividad_id": "uuid", "actividad_nombre": "Senderismo", "latitud": 20.65, "longitud": -103.34, "nota": "Trail norte"}
]
```

## Backlog Futuro
- Onboarding de Editores (envío de email para crear contraseña)
- Multi-idioma
- PWA

## Credenciales
- Admin: username=admin, password=admin123

## Notas
- SMTP está MOCKED (sin credenciales configuradas)
- Sitio desplegado en VPS con Docker Compose + SSL
