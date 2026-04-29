# Kodus Helpdesk

Internal helpdesk system for Kodus enterprise clients. Monorepo with NestJS API + Next.js 15 web.

For product/feature/architecture details, see [SUMMARY.md](./SUMMARY.md).

## Tech Stack

NestJS 11 · Next.js 15 · React 19 · TypeORM 0.3 · PostgreSQL (schema `helpdesk` inside `kodus_db`) · Yarn workspaces · Node 22.22 · Docker

## Repo layout

```
apps/
  api/        NestJS backend (port 3003)
  web/        Next.js frontend (port 3004 dev / 3000 prod)
docker/       Dockerfiles + entrypoints
scripts/
  start.sh         Deploy orchestration (runs on EC2)
  dev/             SSM env fetchers (fetch-env-{qa,prod}.sh)
docker-compose.{dev,qa,prod}.yml
```

## Prerequisites

- Node 22.22
- Yarn 1.x (workspaces)
- Docker + Docker Compose
- Postgres reachable on `kodus_db` (the dev compose can spin one up via the `local-db` profile, otherwise expects the kodus-ai Postgres on the `kodus-backend-services` external network)

## Run locally

```bash
# 1. install deps
yarn install

# 2. seed env
cp .env.example .env
# edit values you care about (KODUS_JWT_SECRET, AUTH_SECRET, etc.)

# 3. spin up everything (API + Web + MinIO; DB is optional via profile)
yarn docker:up:infra      # start local Postgres (omit if reusing kodus-ai's)
yarn docker:start         # build + start API and Web with hot reload

# 4. tail logs
yarn docker:logs
```

API at http://localhost:3003, Web at http://localhost:3004.

The API container runs migrations + seeds automatically on startup (`RUN_MIGRATIONS=true`, `RUN_SEEDS=true`). The default seed creates `admin@kodus.io` / `Admin#00`.

### Without Docker

```bash
yarn install
yarn start:dev:all        # runs API + Web concurrently
```

You'll need a Postgres reachable at the env values in `.env` and the `helpdesk` schema (it'll be created by the seeder on first run).

## Useful scripts

| Command | What it does |
|---|---|
| `yarn start:dev:all` | API + Web concurrently with hot reload |
| `yarn build` | Builds both API (Nest) and Web (Next) |
| `yarn typecheck` | TS typecheck across the monorepo |
| `yarn migration:generate` | Generate a new TypeORM migration |
| `yarn migration:run` | Apply pending migrations |
| `yarn seed` | Run the seeder |
| `yarn docker:start` / `:stop` / `:logs` / `:restart` | Local dev compose lifecycle |
| `yarn fetch:env:qa` / `:prod` | Pull env vars from AWS SSM into `.env.{qa,prod}` (requires AWS creds) |

## Environments

- **dev**: `docker-compose.dev.yml` — local hot-reload, optional MinIO + Postgres.
- **qa / prod**: `docker-compose.{qa,prod}.yml` — pull pre-built images from AWS ECR. Driven by `start.sh` on the EC2; env vars come from AWS SSM Parameter Store. Triggered by GitHub Actions on push to `main` (QA) and on release publish (prod).

## Cloud SSO with kodus-ai

Helpdesk is embedded as an iframe inside kodus-ai's web app (`/helpdesk`). Auth tokens cross via `postMessage`; helpdesk validates the JWT using a shared `KODUS_JWT_SECRET`. Details in [SUMMARY.md](./SUMMARY.md#cloud-sso--iframe-integration-kodus-ai--helpdesk).

## License

UNLICENSED — internal use only.
