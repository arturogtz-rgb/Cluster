# Clúster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Problema Original
Sitio web para el Clúster de Turismo de Naturaleza y Aventura Jalisco - catálogo de empresas turísticas profesional y escalable.

## User Personas
1. **Turista Nacional/Internacional**: Busca experiencias de aventura en Jalisco
2. **Administrador del Clúster**: Gestiona empresas, categorías, contenido, usuarios y leads
3. **Editor de Prensa**: Crea y edita artículos y actividades (rol restringido)
4. **Empresarios Turísticos**: Quieren visibilidad y unirse al Clúster

## Lo Implementado

### Fase 1-3: MVP + UI/UX + Infraestructura (Anteriores)
- Catálogo de empresas con filtros, búsqueda, perfiles con galería
- Blog de noticias, mapa interactivo con Leaflet
- Pipeline de optimización de imágenes (Pillow/WebP)
- Panel admin con JWT, ImageUploader drag-and-drop

### Fase 4: Rediseño Admin Panel
- AdminLayout persistente con sidebar navegación global
- Formularios a pantalla completa para Empresas, Artículos, Actividades
- Dashboard como hub con estadísticas y módulos

### Fase 5: Productividad Admin + Rich Text + Mapa Avanzado
- Buscador Global Command+K (Spotlight) en admin
- Editor Rich Text Tiptap WYSIWYG para Artículos
- Filtros Duales en Mapa (categoría + actividad) + Clustering

### Fase 6: Frontend Público
- Tarjetas con logo permanente, perfil mobile-first con carrusel
- Página /nosotros con misión/visión/valores/formulario de contacto
- Paginación (12/página), contador de vistas + analytics en dashboard

### Fase 7: Gestión Centralizada (Fase 4 del Plan del Usuario) - COMPLETADA Feb 2026
- **Notificaciones al Admin por Email (SMTP)**:
  - Envío automático al email del admin cuando alguien llena el formulario de /nosotros
  - Email HTML formateado con datos del interesado (nombre, email, empresa, mensaje)
  - Graceful fallback: si SMTP no está configurado, solo guarda en DB
  - Variables de entorno: ADMIN_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- **Gestión de Leads/Mensajes (/admin/leads)**:
  - Bandeja de entrada estilo email con indicadores de leído/no leído
  - Vista de detalle del mensaje con botón "Responder por email" (mailto:)
  - Conteo de mensajes sin leer en el listado
  - Endpoints: GET /api/leads, PUT /api/leads/{id}/read, DELETE /api/leads/{id}
- **Editor de Contenido Institucional (/admin/nosotros-editor)**:
  - Editar Hero Image del /nosotros
  - Editar Misión y Visión (textarea)
  - Agregar/quitar Valores dinámicamente
  - Estadísticas personalizables (label + value)
  - Textos del CTA (título + descripción)
  - Endpoint: PUT /api/nosotros-settings
- **Sistema de Usuarios y Roles**:
  - Rol **Admin**: Control total sobre todos los módulos
  - Rol **Editor**: Solo puede gestionar Artículos y Actividades
  - Sidebar se filtra automáticamente según el rol del usuario (JWT payload)
  - Página /admin/usuarios para crear/editar/eliminar usuarios
  - Explicación visual de roles en la página de usuarios
  - Protección anti-auto-eliminación
  - Backend: require_admin dependency para endpoints sensibles (403 para no-admin)
  - Endpoints: GET/POST /api/usuarios, PUT/DELETE /api/usuarios/{id}

### Stack Técnico
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Leaflet, Tiptap, react-leaflet-cluster
- **Backend**: FastAPI, MongoDB, Pillow, fastapi-mail, PyJWT
- **Auth**: JWT con roles (admin/editor)
- **Storage**: Local (/uploads/) con optimización WebP automática

## Backlog

### FASE 5 (Plan): SEO & PageSpeed
- [ ] Meta-tags dinámicos con React Helmet
- [ ] Sitemap.xml automático generado desde el backend
- [ ] JSON-LD datos estructurados (LocalBusiness)
- [ ] Lazy loading en todas las imágenes
- [ ] Code splitting para componentes pesados

### Mejoras Futuras
- [ ] Dashboard de analíticas avanzado (gráficas de visitas por periodo)
- [ ] Exportar leads a CSV
- [ ] Notificaciones push para nuevos leads
- [ ] Multi-idioma (español/inglés)
- [ ] PWA para acceso offline
