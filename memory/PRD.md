# Clúster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Problema Original
Sitio web para el Clúster de Turismo de Naturaleza y Aventura Jalisco - catálogo de empresas turísticas.

## User Personas
1. **Turista Nacional/Internacional**: Busca experiencias de aventura en Jalisco
2. **Administrador del Clúster**: Gestiona empresas, categorías, contenido y medios
3. **Empresarios Turísticos**: Quieren visibilidad para sus servicios

## Lo Implementado (Enero 2026)

### Fase 1: MVP Base
- ✅ Catálogo de empresas con filtros por categoría
- ✅ Búsqueda en tiempo real
- ✅ Perfil de empresa con galería masonry y WhatsApp
- ✅ Blog de noticias
- ✅ Panel admin seguro (JWT)
- ✅ Datos de 2 empresas reales (Ecomuk, Aventúrate por Jalisco)

### Fase 2: Mejoras UI/UX y CMS
- ✅ Logo dinámico con scroll listener (hero logo fade + nav logo appear)
- ✅ Gradiente mejorado del Hero para mejor legibilidad
- ✅ Mapa interactivo con Leaflet y pines de empresas
- ✅ Filtros de categoría en el mapa
- ✅ Editor de configuración del Hero (imagen, título, subtítulo)
- ✅ Gestión de Categorías con imágenes
- ✅ Media Manager para subir/eliminar imágenes locales
- ✅ Selector de imágenes en formularios de admin
- ✅ Coordenadas (lat/lng) en empresas para el mapa

### Stack Técnico
- Frontend: React 19, Tailwind CSS, Shadcn UI, Leaflet
- Backend: FastAPI, MongoDB
- Auth: JWT
- Storage: Local (uploads/)
- Fuentes: Outfit (headings), Inter (body)

## Backlog Priorizado

### P0 (Crítico)
- [ ] SEO meta-tags dinámicos
- [ ] JSON-LD datos estructurados

### P1 (Alta prioridad)
- [ ] Optimización de imágenes
- [ ] Más empresas reales

### P2 (Mejoras)
- [ ] Newsletter
- [ ] Multi-idioma (EN)
- [ ] Sistema de reseñas
