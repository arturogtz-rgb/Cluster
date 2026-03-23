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
- Blog de noticias con editor Rich Text
- Panel admin seguro (JWT)
- Datos de 2 empresas reales (Ecomuk, Aventúrate por Jalisco)

### Fase 2: Mejoras UI/UX y CMS
- Logo dinámico con scroll listener
- Gradiente mejorado del Hero
- Mapa interactivo con Leaflet y pines de empresas
- Editor de configuración del Hero
- Gestión de Categorías con imágenes
- Media Manager básico
- Coordenadas (lat/lng) en empresas

### Fase 3: Infraestructura Core & Optimización de Media
- Pipeline de Optimización de Imágenes (Pillow): WebP auto, redimensión, compresión
- Estructura Jerárquica de Carpetas para uploads
- Componentes ImageUploader con drag-and-drop

### Fase 4: Rediseño Admin Panel - COMPLETADA Feb 2026
- AdminLayout persistente con sidebar navegación global
- AdminDashboard como hub con estadísticas y módulos
- Páginas dedicadas: AdminEmpresas, AdminArticulos, AdminActividades, AdminCategorias, AdminMedia, AdminSettings
- Formularios a pantalla completa: EmpresaForm, ArticuloForm, ActividadForm
- Eliminación total del sistema de popups/modales

### Fase 5: Productividad Admin + Rich Text + Mapa Avanzado - COMPLETADA Feb 2026
- **Buscador Global Command+K (Spotlight)**:
  - Atajo de teclado Cmd+K / Ctrl+K desde cualquier página del admin
  - Botón "Buscar..." en el sidebar con indicador de atajo
  - Búsqueda simultánea en empresas, artículos y actividades
  - Resultados agrupados por tipo con navegación por teclado (↑↓ + Enter)
  - Navegación directa al formulario de edición del resultado seleccionado
- **Editor Rich Text Tiptap para Artículos**:
  - Reemplazó el editor HTML manual por Tiptap WYSIWYG
  - Toolbar: H2, H3, Negrita, Cursiva, Código, Lista viñetas, Lista numerada, Cita, Línea horizontal, Enlace, Imagen, Deshacer, Rehacer
  - Estilos CSS personalizados para el editor (ProseMirror)
  - Carga contenido existente al editar artículos
- **Filtros Duales en Mapa Público**:
  - Filtro por Categoría de empresa (pills con contadores)
  - Filtro por Actividad (pills con colores identificadores de cada actividad)
  - Botón "Limpiar filtros" cuando hay filtros activos
  - Clustering de marcadores con react-leaflet-cluster (zoom suave al hacer clic)
  - Fly-to animado al seleccionar empresa en el panel lateral
  - Popups mejorados con imagen, categoría, descripción y enlace al perfil

### Stack Técnico Actual
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Leaflet, Tiptap, react-leaflet-cluster
- **Backend**: FastAPI, MongoDB, Pillow
- **Auth**: JWT (admin/admin123)
- **Storage**: Local (/uploads/) con optimización WebP automática
- **Fuentes**: Outfit (headings), Inter (body)

## Backlog - Próximas Fases

### FASE 3 (Plan): Re-diseño Frontend Público (UX)
- [ ] Logo visible permanente en tarjetas de empresa (no solo hover)
- [ ] Paginación servidor/cliente (12 empresas por página)
- [ ] Perfil de empresa mobile-first con slider hero
- [ ] Nueva página /nosotros con formulario de registro y CTA

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
