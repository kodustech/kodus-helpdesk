# ============================================
# Stage 1: Base
# ============================================
FROM node:22.22.0-slim AS base

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

RUN apt-get update && apt-get install -y \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base AS deps

COPY package.json yarn.lock* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN yarn install --frozen-lockfile

# ============================================
# Stage 3: Build API
# ============================================
FROM deps AS build-api

COPY . .
RUN yarn build:api

# ============================================
# Stage 4: Build Web
# ============================================
FROM deps AS build-web

COPY . .
RUN yarn build:web

# ============================================
# Stage 5: Production API
# ============================================
FROM node:22.22.0-slim AS api

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build-api /app/dist ./dist
COPY --from=build-api /app/package.json ./
COPY docker/prod-entrypoint.sh ./docker/

RUN chmod +x ./docker/prod-entrypoint.sh

USER 1000

ENTRYPOINT ["./docker/prod-entrypoint.sh"]
CMD ["node", "dist/apps/api/main.js"]

# ============================================
# Stage 6: Production Web
# ============================================
FROM node:22.22.0-slim AS web

WORKDIR /app

COPY --from=build-web /app/apps/web/.next ./apps/web/.next
COPY --from=build-web /app/apps/web/public ./apps/web/public
COPY --from=build-web /app/apps/web/package.json ./apps/web/
COPY --from=build-web /app/apps/web/next.config.ts ./apps/web/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

USER 1000

CMD ["yarn", "--cwd", "apps/web", "start"]
