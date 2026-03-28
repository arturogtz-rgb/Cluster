# Clúster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Descripción del Proyecto
Sitio web completo para el Clúster de Turismo de Naturaleza y Aventura de Jalisco, México. Incluye directorio de empresas, mapa interactivo, sección de prensa, y panel de administración.

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
│   ├── server.py, database.py, models.py, auth.py, seed.py, utils.py
├── frontend/
│   ├── src/pages/ (Home, Empresas, EmpresaDetalle, Prensa, ArticuloDetalle, Mapa, Nosotros, admin/*)
│   ├── src/components/ (AdminLayout, CompanyCard, FloatingNav, WhatsAppButton, ImageUploader, etc.)
```

## Fases del Proyecto

### FASE 1: Correcciones Críticas y Ajustes Visuales - COMPLETADA (2026-03-28)
- [x] Hero Index al 50vh
- [x] "Empresas más consultadas" (renombrado + top 6 por visitas + prioridad manual)
- [x] CTA: "¿Eres una empresa de turismo de naturaleza en Jalisco?"
- [x] Footer: "Sitio desarrollado por Aventúrate Por Jalisco"
- [x] Bug fix: nombres de actividades resueltos (no UUIDs)
- [x] Prensa: fechas eliminadas de tarjetas
- [x] Nosotros: hero con imagen real
- [x] Categorías: centradas, máx 8, reducción móvil

### FASE 2: Funcionalidades de Admin y Gestión de Contenido - COMPLETADA (2026-03-28)
- [x] Hero dinámico: carrusel hasta 3 imágenes con texto en /admin/configuracion
- [x] Herencia de texto: slides sin texto heredan del slide 1
- [x] Numeralia editable: Nombre corto (Index) y Nombre largo (Nosotros) en /admin/nosotros-editor
- [x] WhatsApp global: número con formato internacional (+52), toggle visible/no visible
- [x] Burbuja flotante WhatsApp en todas las páginas públicas
- [x] Galería de imágenes en detalle de Prensa (/prensa/:slug)
- [x] Galería en formulario de artículos (admin)
- [x] Logo superpuesto en lightbox de galería de empresa
- [x] Fix botón "Agregar imágenes" (ahora con ImageUploader + URL)
- [x] Fix menú lateral admin en móvil (z-index: header z-30, overlay z-40, sidebar z-50)
- [x] Hero dinámico por categoría en /empresas?categoria=...

### FASE 3: Lógica Geo-Localizada - PENDIENTE
- [ ] Rediseño relación Empresa-Actividad (ubicaciones múltiples)
- [ ] Mapa interactivo admin para marcar pines por actividad
- [ ] Mapa general filtra pines por actividad
- [ ] Perfil empresa muestra todos sus pines

## Backlog
- Exportar Leads a CSV
- Onboarding de Editores (email)
- Multi-idioma
- PWA

## Credenciales
- Admin: username=admin, password=admin123

## Notas
- SMTP está MOCKED (sin credenciales configuradas)
- Sitio desplegado en VPS con Docker Compose + SSL
