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
│   ├── src/components/ (AdminLayout, CompanyCard, FloatingNav, WhatsAppButton, etc.)
```

## Fases del Proyecto (Plan Actual)

### FASE 1: Correcciones Críticas y Ajustes Visuales - COMPLETADA (2026-03-28)
- [x] Hero Index al 50vh
- [x] "Empresas más consultadas" (renombrado + top 6 por visitas + prioridad manual)
- [x] CTA: "¿Eres una empresa de turismo de naturaleza en Jalisco?"
- [x] Footer: "Sitio desarrollado por Aventúrate Por Jalisco"
- [x] Bug fix: nombres de actividades en vez de UUIDs
- [x] Prensa: fechas eliminadas de tarjetas
- [x] Nosotros: hero con imagen real
- [x] Categorías: centradas, máx 8, reducción móvil

### FASE 2: Funcionalidades de Admin y Gestión de Contenido - PENDIENTE
- [ ] Hero dinámico (hasta 3 imágenes con texto) en /admin/configuracion
- [ ] Numeralia editable en /admin/nosotros-editor
- [ ] WhatsApp global con toggle y burbuja flotante
- [ ] Galería en detalle de Prensa
- [ ] Logo superpuesto en lightbox de galería de empresa
- [ ] Fix botón "Agregar imágenes" en admin empresas
- [ ] Fix menú lateral admin en móvil

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
