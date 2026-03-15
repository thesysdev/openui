# -------------------------
# Base
# -------------------------
FROM node:20-alpine AS base
WORKDIR /app

RUN npm install -g pnpm

# -------------------------
# Dependencies
# -------------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY packages ./packages
COPY examples/openui-chat ./examples/openui-chat

RUN pnpm install --frozen-lockfile

# -------------------------
# Build
# -------------------------
FROM deps AS builder

WORKDIR /app/examples/openui-chat

RUN pnpm build

# -------------------------
# Production
# -------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

ENV NODE_ENV=production

COPY --from=builder /app /app

WORKDIR /app/examples/openui-chat

EXPOSE 3000

CMD ["pnpm","start"]