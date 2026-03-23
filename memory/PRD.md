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
- Logo dinámico con scroll listener (hero logo fade + nav logo appear)
- Gradiente mejorado del Hero para mejor legibilidad
- Mapa interactivo con Leaflet y pines de empresas
- Editor de configuración del Hero (imagen, título, subtítulo)
- Gestión de Categorías con imágenes
- Media Manager básico
- Coordenadas (lat/lng) en empresas

### Fase 3: Infraestructura Core & Optimización de Media
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

### Fase 4: Rediseño Admin Panel (Fase 2 del Plan de Usuario) - COMPLETADA Feb 2026
- **AdminLayout persistente**: Sidebar con navegación global entre todos los módulos del admin
  - Dashboard, Empresas, Artículos, Actividades, Categorías, Media, Configuración
  - Responsive: sidebar colapsable en mobile, fija en desktop
- **AdminDashboard como hub de navegación**: Tarjetas de estadísticas + módulos con contadores y enlaces directos
- **Páginas de listado dedicadas**:
  - `AdminEmpresas`: Grid de empresas con búsqueda y filtro por categoría
  - `AdminArticulos`: Grid de artículos con búsqueda
  - `AdminActividades`: Lista de actividades con búsqueda, colores y estados
  - `AdminCategorias`: Grid de categorías con modal create/edit
  - `AdminMedia`: Zona de upload + biblioteca visual con copiar URL
  - `AdminSettings`: Configuración del Hero del sitio
- **Formularios a pantalla completa**:
  - `EmpresaForm`: Nombre, categoría, descripción, logo/hero image upload, galería, contacto (teléfono, whatsapp, email, dirección), redes sociales, MapPicker interactivo, MultiSelectActividades, estado (activa/destacada)
  - `ArticuloForm`: Título, resumen, contenido con Rich Text Editor, hero image, publicado/borrador
  - `ActividadForm`: Nombre, descripción, color picker con presets, icono upload, orden, activa
- **Eliminación total del sistema de popups/modales** del dashboard anterior

### Stack Técnico Actual
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Leaflet
- **Backend**: FastAPI, MongoDB, Pillow
- **Auth**: JWT (admin/admin123)
- **Storage**: Local (/uploads/) con optimización WebP automática
- **Fuentes**: Outfit (headings), Inter (body)

## Backlog - Próximas Fases

### FASE 2 (Plan - Continuación):
- [ ] Editor Rich Text real (Tiptap/CKEditor) con inserción de imágenes para Artículos

### FASE 3 (Plan): Re-diseño Frontend Público (UX)
- [ ] Logo visible permanente en tarjetas de empresa (no solo hover)
- [ ] Paginación servidor/cliente (12 empresas por página)
- [ ] Perfil de empresa mobile-first con slider hero
- [ ] Mapa con filtros duales (empresa + actividad) y clusters de pines
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
