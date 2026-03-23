# Clúster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Problema Original
Sitio web para el Clúster de Turismo de Naturaleza y Aventura Jalisco - catálogo de empresas turísticas profesional y escalable.

## User Personas
1. **Turista Nacional/Internacional**: Busca experiencias de aventura en Jalisco
2. **Administrador del Clúster**: Gestiona empresas, categorías, contenido y medios
3. **Empresarios Turísticos**: Quieren visibilidad para sus servicios

## Lo Implementado (Enero-Marzo 2026)

### Fase 1: MVP Base ✅
- Catálogo de empresas con filtros por categoría
- Búsqueda en tiempo real
- Perfil de empresa con galería masonry y WhatsApp
- Blog de noticias con editor Rich Text
- Panel admin seguro (JWT)
- Datos de 2 empresas reales (Ecomuk, Aventúrate por Jalisco)

### Fase 2: Mejoras UI/UX y CMS ✅
- Logo dinámico con scroll listener (hero logo fade + nav logo appear)
- Gradiente mejorado del Hero para mejor legibilidad
- Mapa interactivo con Leaflet y pines de empresas
- Editor de configuración del Hero (imagen, título, subtítulo)
- Gestión de Categorías con imágenes
- Media Manager básico
- Coordenadas (lat/lng) en empresas

### Fase 3: Infraestructura Core & Optimización de Media ✅
- **Pipeline de Optimización de Imágenes (Pillow)**:
  - Redimensionamiento automático según tipo (hero:1920px, card:800px, logo:400px)
  - Conversión automática a formato WebP
  - Compresión calidad 85%
  - Feedback de ratio de compresión al usuario
- **Estructura Jerárquica de Carpetas**:
  - /uploads/system/
  - /uploads/empresas/{slug}/logo|hero|galeria/
  - /uploads/articulos/{slug}/
  - /uploads/categorias/{slug}/
  - /uploads/actividades/{slug}/
- **Componentes ImageUploader Profesionales**:
  - Zona drag-and-drop con instrucciones claras
  - Vista previa de imágenes
  - Soporte URL manual + upload directo
  - Validación de tipos (JPG, PNG, WebP, GIF, SVG) y tamaños (máx 10MB)
  - Información de optimización y compresión

### Stack Técnico Actual
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Leaflet
- **Backend**: FastAPI, MongoDB, Pillow
- **Auth**: JWT (admin/admin123)
- **Storage**: Local (/uploads/) con optimización WebP automática
- **Fuentes**: Outfit (headings), Inter (body)

## Backlog - Próximas Fases del Plan

### FASE 2 (Plan): Re-diseño Admin y Nuevos Módulos
- [ ] Transición de popups a páginas completas para empresas/artículos
- [ ] Selector de mapa interactivo en formulario de empresas
- [ ] Módulo de Actividades de Naturaleza (CRUD completo)
- [ ] Editor Rich Text real (Tiptap/CKEditor) con inserción de imágenes
- [ ] Multi-select de actividades en empresas
- [ ] Relación Actividad <-> Empresa <-> Ubicación

### FASE 3 (Plan): Re-diseño Frontend Público (UX)
- [ ] Logo visible permanente en tarjetas de empresa (no solo hover)
- [ ] Paginación servidor/cliente (12 empresas por página)
- [ ] Perfil de empresa mobile-first con slider hero
- [ ] Mapa con filtros duales (empresa + actividad) y clusters de pines

### FASE 4 (Plan): CMS Avanzado y Configuración
- [ ] Editor de numeraria del home (estadísticas editables)
- [ ] Carrusel de actividades en home
- [ ] Gestión de footer y logo global
- [ ] Sistema de usuarios y roles (SuperAdmin, EditorPrensa)

### FASE 5 (Plan): SEO & PageSpeed
- [ ] Meta-tags dinámicos con React Helmet
- [ ] Sitemap.xml automático
- [ ] JSON-LD datos estructurados (LocalBusiness)
- [ ] Lazy loading en todas las imágenes
- [ ] Code splitting para componentes pesados
