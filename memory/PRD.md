# Clúster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Problema Original
Sitio web completo para el Clúster de Turismo de Naturaleza y Aventura Jalisco.

## User Personas
1. **Turista**: Busca experiencias de aventura en Jalisco
2. **Administrador**: Gestiona empresas, contenido, usuarios y leads
3. **Editor de Prensa**: Crea artículos y gestiona actividades
4. **Empresarios Turísticos**: Buscan visibilidad y unirse al Clúster

## Implementación Completa

### Fase 1: MVP Base
- Catálogo de empresas con filtros y búsqueda
- Perfil de empresa con galería masonry y WhatsApp
- Blog de noticias, panel admin con JWT

### Fase 2: UI/UX y CMS
- Logo dinámico, mapa interactivo Leaflet
- Editor de Hero, categorías con imágenes, Media Manager

### Fase 3: Infraestructura & Media
- Pipeline WebP automático (Pillow), carpetas jerárquicas
- ImageUploader con drag-and-drop

### Fase 4: Rediseño Admin Panel
- AdminLayout con sidebar persistente
- Formularios a pantalla completa (Empresas, Artículos, Actividades)
- Dashboard como hub de navegación

### Fase 5: Productividad Admin + Rich Text + Mapa
- Buscador Global Command+K (Spotlight)
- Editor Rich Text Tiptap WYSIWYG
- Filtros duales en mapa (categoría + actividad) + Clustering

### Fase 6: Frontend Público
- Tarjetas con logo permanente, perfil mobile-first con carrusel
- Página /nosotros (misión/visión/valores/contacto)
- Paginación (12/pág), contador de vistas + analytics

### Fase 7: Gestión Centralizada
- Notificaciones SMTP + bandeja de leads (/admin/leads)
- Editor de /nosotros desde admin (misión, visión, valores, estadísticas, CTA)
- Sistema de usuarios y roles (Admin vs Editor)

### Fase 8: SEO & PageSpeed
- Meta-tags dinámicos (react-helmet-async), JSON-LD, sitemap XML dinámico, code splitting

### Fase 9: Refactorización + Analytics Dashboard - COMPLETADA Mar 2026
- **Refactorización Backend**: server.py dividido de 1264 líneas a ~130 líneas con módulos
- **Auto-seed en startup**: El admin user se crea automáticamente al arrancar el servidor
- **Dashboard de Analíticas (recharts)**: 4 gráficas interactivas + KPI cards
- **Endpoint /api/analytics/overview**: Agregaciones MongoDB para estadísticas

### Fase 9b: Limpieza y White Label - COMPLETADA Mar 2026
- **Reset credenciales admin**: Colección limpia + auto-seed garantiza admin/admin123
- **White Label**: Marca "Made with Emergent" eliminada del index.html + CSS fallback
- Sitio 100% marca del Clúster

### Arquitectura Backend (Post-Refactorización)
```
backend/
├── server.py          (~130 líneas - app principal + analytics)
├── database.py        (Conexión MongoDB)
├── models.py          (Todos los modelos Pydantic)
├── auth.py            (JWT helpers + dependencies)
├── utils.py           (Optimización de imágenes + email)
├── seed.py            (Datos iniciales)
├── routes/
│   ├── auth_routes.py
│   ├── empresas.py
│   ├── articulos.py
│   ├── categorias.py
│   ├── actividades.py
│   ├── media_settings.py
│   ├── leads.py
│   ├── usuarios.py
│   └── seo.py
├── uploads/
└── tests/
```

### Stack Técnico Final
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Leaflet, Tiptap, recharts, react-leaflet-cluster, react-helmet-async
- **Backend**: FastAPI (modular routers), MongoDB, Pillow, fastapi-mail, PyJWT
- **Auth**: JWT con roles (admin/editor)
- **Storage**: Local (/uploads/) con optimización WebP automática

## Backlog (P1/P2/P3)
- **P1**: Onboarding de Editores (email con enlace para establecer contraseña)
- **P2**: Exportar Leads a CSV
- **P3**: Soporte Multi-idioma (español/inglés)
- **P3**: PWA (Progressive Web App)

## Estado: Producción-Ready + White Label
Todas las fases completadas y probadas. Sitio sin marcas de terceros.
