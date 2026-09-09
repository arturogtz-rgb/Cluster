# Cluster de Turismo de Naturaleza y Aventura Jalisco - PRD

## Problem Statement
Plataforma de auto-registro y afiliación pagada para prestadores de servicios turísticos (PST) en Jalisco. Incluye directorio público, mapa interactivo, wizard de perfil, requisitos configurables, planes de suscripción con Stripe y transferencia bancaria, códigos de descuento, flujo de aprobación admin, notificaciones por correo, y landing de afiliación.

## Stack
- Backend: FastAPI + MongoDB (Motor async) + Pydantic + Stripe SDK
- Frontend: React 19 (CRA/craco) + TailwindCSS + Shadcn/UI + Leaflet + Recharts
- Payments: Stripe Checkout + Billing (recurring subscriptions) + Bank transfer (manual)
- Email: SMTP directo (servicetourmexico.com)
- Storage: Emergent Object Storage
- DevOps: Docker Compose + Nginx + Let's Encrypt (webroot)

## All Completed Work

### Original Phases (Previous Forks)
- Full directory site with admin panel, interactive map, analytics, WhatsApp tracking

### July 2026 - Security & Infrastructure
- Security hardening (JWT, seed, CORS, ports), SSL webroot, PWA, Excel import/export, SEO fixes, backup scripts, CI

### September 2026 - Platform Transformation

#### Bloque A - Fundamentos (DONE)
- PST auth (email+password JWT), models (EmpresaCuenta, Requisito, Plan, CodigoDescuento, Suscripcion)
- Requisitos seed (5), Plans seed (3), Discount codes CRUD, Profile state machine, Document upload

#### Bloque B - Wizard + Admin Panels (DONE)
- Multi-step wizard (6 steps), PST Dashboard, Admin /admin/requisitos, Admin /admin/afiliados
- Admin /admin/configuracion extended (6 tabs: Hero, WhatsApp, Plans, Codes, Bank, Analytics)

#### Bloque C - Pagos (DONE)
- Stripe Checkout + Billing sandbox, bank transfer flow, discount codes in payment
- Free plan bypass ($0), webhook with signature verification, payment status polling

#### Bloque D - Frontend Público + Emails (DONE)
- Landing /afiliate with hero, benefits, requirements summary, plans, testimonials placeholder, CTAs
- Home: tourist intro block + category/region search dropdown + "Explorar mapa" button
- CategoryFilter: dynamic from /api/categorias (not hardcoded), responsive limits + "Ver más"
- FloatingNav: "Afíliate" link added to main navigation
- Email notifications: SMTP utility (registration, payment, approval, rejection, expiration reminders)
- Security fixes: Stripe key no fallback, payment-status ownership check

## Key Routes
### Public
- / (Home), /empresas, /empresas/:slug, /mapa, /prensa, /nosotros, /afiliate
- /registro, /pst/login, /pst/wizard, /pst/dashboard, /pst/pago, /pst/pago/exito

### Admin
- /admin (login), /admin/dashboard, /admin/empresas, /admin/afiliados, /admin/requisitos
- /admin/articulos, /admin/actividades, /admin/categorias, /admin/media
- /admin/leads, /admin/nosotros-editor, /admin/usuarios, /admin/configuracion

## Backlog
- P1: SMTP credentials for servicetourmexico.com (user to provide)
- P2: Expiration reminder cron job (15 and 7 days before plan expiry)
- P2: Onboarding de Editores (email for password creation/reset)
- P3: Rutas de Aventura (visual itineraries on map)
- P3: Multi-idioma, Advanced PWA (offline-first, push notifications)
