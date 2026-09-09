# Cluster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Problem Statement
Transformar el sitio web de directorio curado a una plataforma de auto-registro y afiliación pagada para prestadores de servicios turísticos (PST). Incluye wizard de perfil, requisitos configurables, planes de suscripción (Stripe), transferencia bancaria, códigos de descuento, flujo de aprobación admin, notificaciones por correo, landing de afiliación, y mejoras al home.

## Stack
- Backend: FastAPI + MongoDB (Motor async) + Pydantic
- Frontend: React 19 (CRA/craco) + TailwindCSS + Shadcn/UI + Leaflet + Recharts
- Payments: Stripe Checkout + Billing (recurring subscriptions)
- Email: SMTP directo (servicetourmexico.com)
- Storage: Emergent Object Storage (documents, images)
- DevOps: Docker Compose + Nginx + Let's Encrypt (webroot)

## Architecture
```
/app
├── backend/
│   ├── routes/
│   │   ├── pst_auth.py (NEW - PST registration, login, profile, documents)
│   │   ├── requisitos.py (NEW - affiliation requirements CRUD)
│   │   ├── planes.py (NEW - plans, discount codes, affiliated companies mgmt)
│   │   ├── empresas.py (import/export Excel added)
│   │   ├── auth_routes.py, actividades.py, articulos.py, categorias.py
│   │   ├── leads.py, media_settings.py, seo.py, usuarios.py
│   ├── models.py (expanded with EmpresaCuenta, Requisito, Plan, CodigoDescuento, Suscripcion)
│   ├── auth.py (expanded with PST auth: create_pst_token, require_pst)
│   ├── storage.py (NEW - Emergent Object Storage client)
│   ├── seed.py (expanded with requisitos + plans seed)
│   ├── server.py, database.py, utils.py
│   ├── Dockerfile
├── frontend/
│   ├── src/pages/ (Home, Mapa, Empresas, Admin*, etc.)
│   ├── src/components/
│   ├── public/ (manifest.json, service-worker.js, robots.txt, PWA icons)
│   ├── Dockerfile, nginx.conf
├── scripts/ (renew-cluster-cert.sh, backup-mongodb.sh)
├── .github/workflows/tests.yml
├── docker-compose.yml
├── DEPLOY_VPS.md
```

## DB Collections
- `usuarios` - Admin accounts
- `empresa_cuentas` - PST company accounts (email+password auth)
- `empresas` - Company profiles (now with estado, cuenta_id, requisitos_completados, certificaciones)
- `requisitos` - Configurable affiliation requirements
- `planes` - Subscription plans
- `codigos_descuento` - Discount codes
- `suscripciones` - Active subscriptions
- `documentos_pst` - Uploaded PST documents (object storage refs)
- `actividades`, `articulos`, `categorias`, `contactos`, `media`, `analytics`, `settings`

## Completed Work

### Previous Forks (Phases 1-3 original)
- Full directory site with admin panel, interactive map, analytics, WhatsApp tracking

### July 2026 - Security & Infrastructure (Phases 1-5)
- Security hardening (JWT, seed, CORS, ports)
- SSL webroot integration, PWA, Excel import/export, SEO fixes, backup scripts, CI

### September 2026 - Platform Transformation

#### Bloque A - Fundamentos (DONE, tested 29/29)
- EmpresaCuenta model + PST JWT auth (register/login/me)
- Requisito model + seed (5 requirements: RFC bloqueante, RNT, membresía, seguro, antigüedad)
- Plan model + seed (3 plans: Mensual/Semestral/Anual at $0 placeholder)
- CodigoDescuento model + admin CRUD + public validation
- Profile state machine: borrador → pendiente_pago → pendiente_aprobacion → aprobado/rechazado
- Blocking requirement validation in submit-for-payment
- Admin: manage affiliated companies, change states, approve/reject
- Document upload via Object Storage
- Empresa model extended with estado, cuenta_id, requisitos_completados, certificaciones

## In Progress / Next

#### Bloque B - Wizard + Panel Admin (NEXT)
- Multi-step wizard UI (datos, categoría, ubicación, fotos, checklist, certificaciones)
- Profile preview before payment
- Admin /admin/requisitos panel
- Admin /admin/configuracion extended (planes, banco, logo, GA/GTM)
- Admin affiliated companies management UI

#### Bloque C - Pagos
- Stripe Checkout + Billing (recurring subscriptions)
- Bank transfer flow (manual admin confirmation)
- Discount codes in payment flow
- Stripe config from admin panel

#### Bloque D - Frontend Público + Emails + Bug fix
- Landing /afiliate
- Home: tourist intro block + category/region search
- Fix dynamic categories in /empresas
- Email notifications (SMTP: registration, payment, approval, rejection, expiration reminders)

## Key API Endpoints (New)
- POST /api/pst/register, /api/pst/login, GET /api/pst/me
- PUT /api/pst/perfil, POST /api/pst/submit-for-payment
- POST /api/pst/documents/upload
- GET /api/requisitos (public), /api/admin/requisitos (admin CRUD)
- GET /api/planes (public), /api/admin/planes (admin CRUD)
- POST /api/admin/codigos-descuento, /api/codigos-descuento/validar
- GET /api/admin/empresas-afiliadas, PUT .../estado

## Security
- JWT_SECRET required env var, PST and Admin share same secret but different token roles
- Admin auth: username+password (usuarios collection)
- PST auth: email+password (empresa_cuentas collection, email unique index)
- Role-based access: require_admin, require_pst, require_any_auth
- CORS: production domains only
- Ports: Only frontend (80/443) exposed
