# Clúster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Descripción del Proyecto
Sitio web completo para el Clúster de Turismo de Naturaleza y Aventura de Jalisco, México. Incluye directorio de empresas, mapa interactivo geolocalizado, sección de prensa, y panel de administración completo.

## Stack Técnico
- **Frontend**: React, Tailwind CSS, Shadcn UI, Recharts, Leaflet
- **Backend**: FastAPI (modular), Motor (MongoDB async), JWT Auth
- **Base de datos**: MongoDB
- **DevOps**: Docker Compose, Nginx (Proxy Inverso), Certbot (SSL)

## Fases del Proyecto - TODAS COMPLETADAS

### FASE 1: Correcciones Críticas y Ajustes Visuales - COMPLETADA (2026-03-28)
- [x] Hero Index al 50vh (luego ajustado a 60vh)
- [x] "Empresas más consultadas" (renombrado + top 6 por visitas + prioridad manual)
- [x] CTA y footer actualizados
- [x] Bug fix: nombres de actividades resueltos (no UUIDs)
- [x] Prensa: fechas eliminadas de tarjetas
- [x] Nosotros: hero con imagen real
- [x] Categorías: centradas, máx 8, reducción móvil

### FASE 2: Funcionalidades de Admin y Gestión de Contenido - COMPLETADA (2026-03-28)
- [x] Hero dinámico: carrusel hasta 3 imágenes con texto
- [x] Numeralia editable: Nombre corto (Index) y Nombre largo (Nosotros)
- [x] WhatsApp global: número con formato internacional, toggle, burbuja flotante
- [x] Galerías en Prensa y lightbox con logo en empresa
- [x] Fix botón "Agregar imágenes" + Fix menú móvil admin
- [x] Hero dinámico por categoría

### FASE 3: Lógica Geo-Localizada + Extras - COMPLETADA (2026-03-29)
- [x] Modelo multi-ubicación: ubicaciones_actividades
- [x] Admin ActivityLocationManager (drag & drop pins)
- [x] Mapa General con filtros por actividad y popups interactivos
- [x] WhatsApp Clicks tracking + KPI en Dashboard
- [x] Export Leads a CSV (UTF-8 con BOM)

### Ajustes Post-Fase 3 - COMPLETADOS (2026-03-29)
- [x] Hero aumentado a min-h-[60vh] (Index + Categorías)
- [x] Logo optimizado para móvil (h-14 sm:h-16 md:h-20)
- [x] Mapa restaurado: layout boxed con panel lateral de empresas
- [x] ScrollToTop global en navegación entre páginas
- [x] Scroll suave al cambiar filtro de categoría en /empresas

## Backlog Futuro
- Onboarding de Editores (envío de email)
- Multi-idioma
- PWA

## Credenciales
- Admin: username=admin, password=admin123
