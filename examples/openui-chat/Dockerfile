# OpenUI Chat Example - Dockerfile
# 
# Ce Dockerfile permet de containeriser l'application de chat OpenUI
# 
# Usage:
#   docker build -f examples/openui-chat/Dockerfile -t openui-chat ../../
#   docker run -p 3000:3000 -e OPENAI_API_KEY=sk-xxx openui-chat
#
# Note: Ce Dockerfile doit être build depuis la racine du monorepo

# syntax=docker/dockerfile:1

# Étape 1: Build
FROM node:20-alpine AS builder

# Installation de pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copie des fichiers de configuration du monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/ ./packages/
COPY examples/openui-chat/ ./examples/openui-chat/

# Installation des dépendances
RUN pnpm install --frozen-lockfile

# Build du CLI et génération du prompt
RUN pnpm --filter @openuidev/cli build

# Génération du system prompt
WORKDIR /app/examples/openui-chat
RUN node /app/packages/openui-cli/dist/index.js generate src/library.ts --out src/generated/system-prompt.txt

# Build de l'application Next.js
RUN pnpm build

# Étape 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Installation de wget pour le healthcheck
RUN apk add --no-cache wget

# Copie des fichiers nécessaires depuis le builder
COPY --from=builder /app/examples/openui-chat/.next/standalone ./
COPY --from=builder /app/examples/openui-chat/.next/static ./.next/static

# Exposition du port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Démarrage
CMD ["node", "examples/openui-chat/server.js"]
