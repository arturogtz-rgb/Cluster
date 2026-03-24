# Clúster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Problema Original
Sitio web completo para el Clúster de Turismo de Naturaleza y Aventura Jalisco.

## Implementación Completa (Fases 1-9)
- MVP + CMS + Media pipeline + Admin panel + Rich text + Mapa interactivo
- Frontend público responsive + SEO + JSON-LD + Sitemap
- Gestión centralizada: leads, usuarios, roles, email SMTP
- Refactorización backend modular (15 archivos)
- Dashboard de Analíticas con recharts (4 gráficas + KPIs)
- White Label (badge Emergent eliminado)

## Bug Fixes (Mar 2026)
- **t.map is not a function**: Protegidos todos los `.map()` en 6 páginas con `Array.isArray` guards
- **Hero image rota**: Corregida URL en settings que apuntaba a dominio anterior
- **Seed innecesario**: Removido `POST /seed` del Home.jsx (auto-seed en startup lo maneja)
- **Home data loading**: Migrado a `Promise.allSettled` para cargas paralelas resilientes

## Arquitectura Backend
```
backend/
├── server.py (~130 líneas)
├── database.py, models.py, auth.py, utils.py, seed.py
├── routes/ (9 archivos: auth, empresas, articulos, categorias, actividades, media_settings, leads, usuarios, seo)
```

## Stack
- Frontend: React 19, Tailwind, Shadcn, Leaflet, Tiptap, recharts, react-helmet-async
- Backend: FastAPI modular, MongoDB, Pillow, fastapi-mail, PyJWT
- Auth: JWT con roles (admin/editor)

## Backlog
- **P1**: Onboarding de Editores (email con enlace para contraseña)
- **P2**: Exportar Leads a CSV
- **P3**: Multi-idioma (español/inglés)
- **P3**: PWA

## Estado: Producción-Ready + White Label + Bug-Free
