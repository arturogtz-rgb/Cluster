# Clúster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Problema Original
Sitio web para el Clúster de Turismo de Naturaleza y Aventura Jalisco - catálogo de empresas turísticas profesional y escalable.

## User Personas
1. **Turista Nacional/Internacional**: Busca experiencias de aventura en Jalisco
2. **Administrador del Clúster**: Gestiona empresas, categorías, contenido y medios
3. **Empresarios Turísticos**: Quieren visibilidad para sus servicios

## Lo Implementado

### Fase 1: MVP Base
- Catálogo de empresas con filtros por categoría
- Búsqueda en tiempo real
- Perfil de empresa con galería masonry y WhatsApp
- Blog de noticias
- Panel admin seguro (JWT)

### Fase 2: Mejoras UI/UX y CMS
- Logo dinámico con scroll listener
- Mapa interactivo con Leaflet
- Editor de configuración del Hero
- Gestión de Categorías con imágenes
- Media Manager básico

### Fase 3: Infraestructura Core & Optimización de Media
- Pipeline de Optimización de Imágenes (Pillow): WebP auto, redimensión, compresión
- Estructura Jerárquica de Carpetas para uploads
- Componentes ImageUploader con drag-and-drop

### Fase 4: Rediseño Admin Panel - COMPLETADA Feb 2026
- AdminLayout persistente con sidebar navegación global
- AdminDashboard como hub con estadísticas y módulos
- Páginas dedicadas y formularios a pantalla completa
- Eliminación total del sistema de popups/modales

### Fase 5: Productividad Admin + Rich Text + Mapa Avanzado - COMPLETADA Feb 2026
- Buscador Global Command+K (Spotlight) en admin
- Editor Rich Text Tiptap para Artículos (WYSIWYG completo)
- Filtros Duales en Mapa Público (categoría + actividad)
- Clustering de marcadores con react-leaflet-cluster

### Fase 6: Frontend Público (Fase 3 del Plan del Usuario) - COMPLETADA Feb 2026
- **Tarjetas de Empresa con Logo Permanente**:
  - Logo siempre visible (no solo en hover), con fallback a icono TreePine
  - Aspecto ratio 4:3, categoría badge, dirección, descripción, activity tags
  - Hover con scale y shadow suave
- **Página /nosotros**:
  - Hero institucional con logo, misión, CTA "Únete al Clúster"
  - Barra de estadísticas dinámicas (empresas, actividades, destinos, sustentabilidad)
  - Tarjetas de Misión y Visión con contenido editable desde la API
  - 4 tarjetas de Valores (Sustentabilidad, Seguridad, Comunidad, Pasión por la Tierra)
  - Formulario de contacto/registro (nombre, email, empresa, mensaje) conectado a API
  - Contenido 100% editable desde `/api/nosotros-settings`
- **Perfil de Empresa Mobile-First**:
  - Carrusel de imágenes (hero + galería) con flechas y dots
  - Barra de acciones rápidas sticky en mobile (WhatsApp + Llamar)
  - Logo visible en mobile debajo del hero
  - Galería en grid 2x3 con modal de ampliación
  - Mapa embebido (OpenStreetMap iframe) con enlace a Google Maps
  - Sidebar de contacto sticky en desktop
- **Paginación en catálogo**: 12 empresas por página con controles de paginación
- **Contador de vistas (Analytics)**: 
  - Incremento automático de `views` al visitar `/empresas/:slug`
  - Sección "Empresas Más Visitadas" en el Admin Dashboard con top 5
- **Navegación actualizada**: Enlace "Nosotros" añadido al FloatingNav
- **Nuevos endpoints**: `/api/nosotros-settings`, `/api/contacto`, `/api/empresas-top-views`

### Stack Técnico Actual
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Leaflet, Tiptap, react-leaflet-cluster
- **Backend**: FastAPI, MongoDB, Pillow
- **Auth**: JWT (admin/admin123)
- **Storage**: Local (/uploads/) con optimización WebP automática
- **Fuentes**: Outfit (headings), Inter (body)

## Backlog - Próximas Fases

### FASE 4 (Plan): CMS Avanzado y Configuración
- [ ] Editor de numeraria del home (estadísticas editables)
- [ ] Carrusel de actividades en home
- [ ] Gestión de footer y logo global
- [ ] Sistema de usuarios y roles (SuperAdmin, EditorPrensa)
- [ ] Editor del contenido de /nosotros desde el admin

### FASE 5 (Plan): SEO & PageSpeed
- [ ] Meta-tags dinámicos con React Helmet
- [ ] Sitemap.xml automático
- [ ] JSON-LD datos estructurados (LocalBusiness)
- [ ] Lazy loading en todas las imágenes
- [ ] Code splitting para componentes pesados
