# Cluster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Problem Statement
Sitio web full-stack para el Cluster de Turismo de Naturaleza y Aventura Jalisco. Directorio de empresas, mapa interactivo, blog/prensa, analytics y administracion completa.

## Stack
- Backend: FastAPI + MongoDB (Motor async) + Pydantic
- Frontend: React 19 (CRA/craco) + TailwindCSS + Shadcn/UI + Leaflet + Recharts
- DevOps: Docker Compose + Nginx + Let's Encrypt (webroot)
- Production: VPS propio del usuario

## Architecture
```
/app
├── backend/
│   ├── routes/ (actividades, articulos, categorias, empresas, leads, media_settings, seo, usuarios, auth_routes)
│   ├── models.py, auth.py, database.py, seed.py, server.py, utils.py
│   ├── tests/
│   ├── Dockerfile
├── frontend/
│   ├── src/pages/ (Home, Mapa, Empresas, Admin*, etc.)
│   ├── src/components/ (ActivityLocationManager, MapPicker, WhatsAppButton, etc.)
│   ├── public/ (manifest.json, service-worker.js, robots.txt, icons)
│   ├── Dockerfile, nginx.conf
├── scripts/ (renew-cluster-cert.sh, backup-mongodb.sh)
├── .github/workflows/tests.yml
├── docker-compose.yml
├── DEPLOY_VPS.md
```

## Completed Features

### Original Phases (Previous Forks)
- Phase 1 UI/UX: Hero index, top companies, UUID resolution, press dates
- Phase 2 Admin: Dynamic carousel, editable statistics, WhatsApp button, gallery overlays
- Phase 3 Geo: Multi-location activities, interactive map, leads CSV, WA click tracking
- Deploy fixes: Node 20, CSS animation fixes, gradient contrast

### July 2026 Improvements (Current Fork)
- **Fase 1 Security** (2026-07-10):
  - Removed /api/seed endpoint (seed is CLI-only: `docker compose exec backend python seed.py`)
  - Admin password from ADMIN_INITIAL_PASSWORD env var (auto-generates if missing)
  - JWT_SECRET required (no hardcoded default, fails fast)
  - MongoDB port (27017) removed from docker-compose.yml (internal only)
  - Backend port (8001) removed from docker-compose.yml (internal only)
  - CORS wildcard removed (production domains only)
  - test_credentials.md added to .gitignore, .gitignore cleaned up

- **Fase 2 SSL/Nginx** (2026-07-10):
  - nginx.conf: ACME challenge block for webroot validation
  - docker-compose.yml: webroot volume for certbot
  - scripts/renew-cluster-cert.sh: deploy-hook versionado
  - DEPLOY_VPS.md: Complete webroot SSL documentation

- **Fase 3 PWA** (2026-07-10):
  - manifest.json with brand colors and maskable icons
  - Generated PWA icons (192x192, 512x512)
  - Service worker with network-first + cache fallback strategy
  - Service worker registration in index.js

- **Fase 4 Import/Export Excel** (2026-07-10):
  - GET /api/empresas/plantilla - Template .xlsx download (public)
  - POST /api/empresas/importar - Import with validation (admin)
  - GET /api/empresas/exportar - Export all empresas (admin)
  - Admin UI with 3 buttons + import result panel with error table

- **Fase 5 Other Pending** (2026-07-10):
  - SITE_URL default fixed to production domain
  - robots.txt with sitemap reference
  - backup-mongodb.sh script with 14-day rotation
  - GitHub Actions CI workflow for pytest

## Key API Endpoints
- POST /api/auth/login
- GET/POST/PUT/DELETE /api/empresas
- GET /api/empresas/plantilla (public)
- POST /api/empresas/importar (admin)
- GET /api/empresas/exportar (admin)
- GET /api/mapa/pines
- POST /api/analytics/whatsapp-click
- GET /api/leads/export-csv (admin)
- GET /api/sitemap.xml

## Backlog (P1-P3)
- P1: Onboarding de Editores (email automatico para creacion/reseteo de contrasena)
- P2: Rutas de Aventura (itinerarios visuales conectando pines en el mapa)
- P3: Soporte Multi-idioma
- P3: Conversión avanzada a PWA (offline-first, push notifications)

## Security Notes
- JWT_SECRET: Required env var, no default
- Admin seed: Reads ADMIN_INITIAL_PASSWORD from env, generates random if not set
- CORS: Production domains only (no wildcard)
- Ports: Only frontend (80/443) exposed; DB and backend internal-only
- SSL: Let's Encrypt webroot method with automated renewal
