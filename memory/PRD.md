# Clúster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Problema Original
Sitio web para el Clúster de Turismo de Naturaleza y Aventura Jalisco - catálogo de empresas turísticas con:
- Paleta de colores basada en logotipo (Verde Bosque, Azul Océano, Gris Mineral)
- Categorías: Capacitación, Operadora de aventura, Parque acuático, Hospedaje, Parque de aventura
- Modelo de Empresa con Hero, galería, contacto y WhatsApp dinámico
- Módulo de Prensa/Blog con editor Rich Text
- Panel de administración con usuario/contraseña (admin/admin123)

## User Personas
1. **Turista Nacional/Internacional**: Busca experiencias de aventura en Jalisco
2. **Administrador del Clúster**: Gestiona empresas y publica noticias
3. **Empresarios Turísticos**: Quieren visibilidad para sus servicios

## Requisitos Core
- Directorio de empresas con filtros por categoría
- Búsqueda en tiempo real
- Perfil de empresa con galería masonry y WhatsApp
- Blog de noticias
- Panel admin seguro (JWT)

## Lo Implementado (Enero 2026)

### Backend (FastAPI + MongoDB)
- ✅ CRUD completo de Empresas
- ✅ CRUD de Artículos/Blog
- ✅ Autenticación JWT (admin/admin123)
- ✅ Seed data con 2 empresas reales
- ✅ API endpoints protegidos

### Frontend (React + Tailwind)
- ✅ Home con hero inmersivo y secciones
- ✅ /empresas con filtros y búsqueda
- ✅ /empresas/[slug] con galería y WhatsApp
- ✅ /prensa con listado de artículos
- ✅ /prensa/[slug] con contenido HTML
- ✅ /admin login
- ✅ /admin/dashboard con gestión completa
- ✅ Editor Rich Text personalizado
- ✅ Navegación flotante glassmorphism
- ✅ Botón WhatsApp flotante

### Datos Iniciales
- Ecomuk Aventura Natural (Capacitación)
- Aventúrate por Jalisco DMC (Operadora de aventura)
- 1 artículo de bienvenida

## Backlog Priorizado

### P0 (Crítico)
- [ ] Agregar más empresas reales al catálogo
- [ ] SEO meta-tags dinámicos por empresa

### P1 (Alta prioridad)
- [ ] JSON-LD para datos estructurados
- [ ] Galería de imágenes mejorada con lightbox
- [ ] Optimización de imágenes (lazy loading)

### P2 (Mejoras)
- [ ] Mapa interactivo con ubicaciones
- [ ] Sistema de reseñas/valoraciones
- [ ] Newsletter / suscripciones
- [ ] Multi-idioma (EN)

## Stack Técnico
- Frontend: React 19, Tailwind CSS, Shadcn UI
- Backend: FastAPI, MongoDB
- Auth: JWT
- Fuentes: Outfit (headings), Inter (body)
