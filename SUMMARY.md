# Kodus Helpdesk - Project Summary

## What is this project?
A helpdesk system for Kodus enterprise clients. Monorepo with NestJS API (backend) and Next.js 15 (frontend). Allows Kodus team to manage support tickets internally and gives clients a portal to open/track their own tickets.

## Tech Stack
- **Backend**: NestJS 11, TypeORM 0.3.28, PostgreSQL (schema `helpdesk` inside `kodus_db`), Passport JWT
- **Frontend**: Next.js 15, React 19, TailwindCSS 4, Next-Auth v5, React Query
- **Infra**: Docker (dev/qa/prod), Node 22.22, Yarn workspaces
- **Email**: Customer.io API for invite emails

## What's been built

### Database (schema `helpdesk` in `kodus_db`)
4 tables created via TypeORM migration:
- **customers** — uuid, name (required), site (optional), timestamps
- **users** — uuid, email (unique), password (nullable for cloud users), name, role (enum), status (enum), auth_type (local/cloud), external_user_uuid (for kodus-ai mapping), customer_id (FK), timestamps
- **editor_assignments** — uuid, user_id (FK), customer_id (FK), unique constraint on pair, timestamps
- **auth_tokens** — uuid, user_id (FK), refresh_token, expiry_date, used (boolean), timestamps

All tables use UUID PKs, createdAt/updatedAt, snake_case FKs — matching kodus-ai patterns.

### User Roles (6 roles)

**Internal (Kodus team):**
- **Owner** — full access, only role that can manage other owners/admins. Seed user: `admin@kodus.io` / `Admin#00`
- **Admin** — full access, can create editor/customer users, can promote editor→admin
- **Editor** — sees only assigned workspaces, no user management

**External (Client side):**
- **Customer Owner** — 1 per workspace, cannot be removed, can transfer ownership
- **Customer Admin** — manages customer users in their workspace, can remove them
- **Customer Editor** — opens tickets, adds comments

### Authentication
- **Local auth**: email/password login with JWT (15min access token + 7-day refresh token)
- **Cloud SSO**: shared JWT secret with kodus-ai. Cloud users coming from kodus-ai web are authenticated via `POST /api/auth/cloud` endpoint that validates the kodus-ai JWT and issues helpdesk tokens
- **Cloud user detection**: when inviting a user, the system queries `public.users` (kodus-ai schema) — if the email exists there, the user is mapped as cloud (no invite email, immediately active)

### API Endpoints

**Auth** (`/api/auth`):
- `POST /login` — email/password login (public)
- `POST /refresh` — refresh token (public)
- `POST /cloud` — cloud SSO with kodus-ai JWT (public)

**Users** (`/api/users`):
- `GET /` — list users (filtered by role/workspace)
- `POST /invite` — invite users (comma-separated emails, role, optional customer_id)
- `GET /invite/:uuid` — get invite data (public)
- `POST /invite/:uuid/accept` — accept invite with name + password (public)
- `PATCH /password` — change own password (current + new + confirm)
- `PATCH /:uuid/role` — change user role (permission-checked)
- `DELETE /:uuid` — soft delete (status→removed)

**Customers** (`/api/customers`):
- `POST /` — create customer (name, site, first_user_email → auto-creates customer_owner)
- `GET /` — list customers (filtered by role)
- `GET /:uuid` — get customer detail
- `PATCH /:uuid` — update customer
- `DELETE /:uuid` — delete customer

**Health** (`/api/health`):
- `GET /` — health check (public)

### Permission System
- Global JWT guard (all routes protected by default, `@Public()` decorator to opt out)
- Global Roles guard (`@Roles()` decorator)
- Permission helper with `canManageRole()`, `canChangeRole()`, `canRemoveUser()` functions
- Password validation: `@IsStrongPassword` (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol) — same rules as kodus-ai

### Email (Customer.io)
- Invite emails sent via Customer.io HTTP API
- HTML template with Kodus dark theme branding
- Invite link: `{HELPDESK_FRONTEND_URL}/invite/{user_uuid}`
- Graceful fallback when `API_CUSTOMERIO_APP_API_TOKEN` is not configured (logs warning)

### Frontend Pages

**Auth pages** (public):
- `/sign-in` — login with email/password
- `/invite/[id]` — accept invite (set name + password with real-time strength validation)

**App pages** (protected, with navbar):
- `/customers` — list customers + "New Customer" modal (name, site, first user email)
- `/customers/[uuid]` — customer detail with users table + "Invite Users" modal
- `/users` — all users table + "Invite Internal Users" modal
- `/settings` — change password form

**Visual identity**: matches kodus-ai web exactly — dark theme (#101019 background), card levels (#181825/#202032/#30304b), primary orange (#f8b76d), h-12 inputs with rounded-xl, ring-1 borders, brightness-120 hover, DM Sans font.

### Docker Setup
- `docker-compose.dev.yml` — API (port 3003) + Web (port 3004), connects to kodus-ai Postgres via `kodus-backend-services` network. Has API healthcheck (Node fetch).
- `docker-compose.qa.yml` / `docker-compose.prod.yml` — pulls images from AWS ECR (`kodus-helpdesk-{api,web}-{qa,prod}`). Image refs come from `IMAGE_NAME_API` / `IMAGE_NAME_WEB` env vars exported by `start.sh` on the EC2.
- `Dockerfile.dev` — Node 22.22-slim with hot reload
- `Dockerfile` — multi-stage production build (separate `api` and `web` targets)
- API entrypoint auto-runs migrations + seeds on startup (controlled by `RUN_MIGRATIONS` / `RUN_SEEDS` env)

### Environment Variables (local dev)
```
API_PORT=3003
API_PG_DB_HOST=localhost (db_postgres in Docker)
API_PG_DB_USERNAME=kodusdev
API_PG_DB_PASSWORD=123456
API_PG_DB_DATABASE=kodus_db
JWT_SECRET=helpdesk-change-me
KODUS_JWT_SECRET= (must match kodus-ai's API_JWT_SECRET for cloud SSO)
API_CUSTOMERIO_APP_API_TOKEN= (Customer.io)
API_CUSTOMERIO_BASE_URL=https://api.customer.io
HELPDESK_FRONTEND_URL=http://localhost:3004
WEB_PORT=3004
AUTH_SECRET= (Next-Auth)
NEXTAUTH_URL=http://localhost:3004
ALLOWED_PARENT_ORIGINS=http://localhost:3000 https://app.kodus.io (CSP frame-ancestors)
```

**QA / prod**: env vars come from AWS SSM Parameter Store. App-level keys live under `/{qa,prod}/kodus-helpdesk/*`; Postgres credentials are reused from the orchestrator under `/{qa,prod}/kodus-orchestrator/API_PG_DB_*` (same DB, schema `helpdesk`). Full key list in `scripts/dev/fetch-env-{qa,prod}.sh`.

**kodus-ai env vars needed:**
```
WEB_HOSTNAME_HELPDESK=localhost (helpdesk-web in Docker)
WEB_PORT_HELPDESK=3004
```

### Cloud SSO + Iframe Integration (kodus-ai ↔ helpdesk)
- **Helpdesk embedded in kodus-ai** — helpdesk renders inside an iframe on `/helpdesk` page in kodus-ai, keeping kodus-ai's navigation visible
- **Conditional visibility** — "Helpdesk" link appears in kodus-ai Support menu only for enterprise plans + cloud mode (not self-hosted)
- **Secure token exchange** — kodus-ai passes its JWT access token via `postMessage` (no token in URL). Helpdesk iframe listens for `HELPDESK_CLOUD_AUTH_READY` → parent sends `HELPDESK_CLOUD_AUTH` with token
- **Cloud auth provider** — NextAuth has a second Credentials provider (`id: 'cloud'`) that calls `POST /api/auth/cloud` with the kodus-ai token
- **Token validation** — helpdesk API verifies the kodus-ai JWT using shared `KODUS_JWT_SECRET` (= kodus-ai's `API_JWT_SECRET`), maps user via `payload.sub` → `external_user_uuid`
- **Compact header in iframe** — detects iframe mode (`window.self !== window.top`), shows a slim h-10 header with horizontal tabs instead of the full navbar
- **Cookie isolation** — helpdesk NextAuth cookies use `helpdesk.` prefix to avoid collision with kodus-ai cookies on same domain
- **CSP headers** — `frame-ancestors` configured via `ALLOWED_PARENT_ORIGINS` env var (replaces `X-Frame-Options: DENY`)
- **Friendly error page** — shows "Access Denied" message when user is not mapped in helpdesk

## What's NOT built yet
- **Editor workspace assignments** — the table exists but no CRUD endpoints/UI yet
- **Customer Owner transfer** — transferring ownership to another user
- **Role change UI** — the API exists but the frontend doesn't have role change buttons in tables yet
- **User removal UI** — the API exists but no delete buttons in the frontend tables yet
- **Ticket views by workspace** — editors should only see tickets from assigned workspaces

## Key Files
```
apps/api/src/
  main.ts                                    — API bootstrap (port 3003)
  api.module.ts                              — Root module
  config/enums/                              — UserRole, UserStatus, AuthType
  config/database/                           — TypeORM config, CoreModel, ormconfig, seed, migrations
  modules/auth/                              — JWT strategy, guards, decorators, permission helper, service, controller
  modules/auth/auth.service.ts               — Login, refresh, cloud SSO (validateCloudToken uses payload.sub)
  modules/users/                             — Users service/controller/DTOs, User + EditorAssignment models
  modules/customers/                         — Customers service/controller/DTOs, Customer model
  modules/mail/                              — MailerSend service
  modules/health/                            — Health check

apps/web/src/
  app/globals.css                            — Design system (colors, typography, base styles)
  app/layout.tsx                             — Root layout with providers
  app/(auth)/                                — Auth pages (sign-in, invite, auth/cloud)
  app/(auth)/auth/cloud/page.tsx             — Cloud SSO via postMessage (iframe entry point)
  app/(app)/                                 — Protected pages (customers, users, settings, tickets, dashboard)
  app/(app)/layout.tsx                       — Navbar with iframe detection (compact header in iframe mode)
  lib/auth/auth.config.ts                    — Next-Auth config (credentials + cloud providers, helpdesk.* cookies)
  lib/services/api.ts                        — Axios API client
  core/providers/                            — Session + Query providers
  core/hooks/useAuthApi.ts                   — Authenticated API hook
  middleware.ts                              — Route protection (/auth/cloud is public)
  next.config.ts                             — CSP frame-ancestors via ALLOWED_PARENT_ORIGINS
```
