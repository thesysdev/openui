# Dockerfile for openui-chat example
# Build from the monorepo root context:
#   docker build -f examples/openui-chat/Dockerfile -t openui-chat .

# --- Stage 1: Install & Build ---
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config and package manifests first for better layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/ packages/
COPY examples/openui-chat/ examples/openui-chat/

# Enable standalone output for Docker deployment (does not modify source)
RUN sed -i 's/nextConfig: NextConfig = {/nextConfig: NextConfig = { output: "standalone",/' \
    examples/openui-chat/next.config.ts

# Install dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# Generate system prompt (required at runtime) and build the chat app
WORKDIR /app/examples/openui-chat
RUN pnpm generate:prompt && pnpm build

# --- Stage 2: Production ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone output and static assets
COPY --from=builder /app/examples/openui-chat/.next/standalone ./
COPY --from=builder /app/examples/openui-chat/.next/static ./examples/openui-chat/.next/static
COPY --from=builder /app/examples/openui-chat/public ./examples/openui-chat/public
COPY --from=builder /app/examples/openui-chat/src/generated ./examples/openui-chat/src/generated

EXPOSE 3000

CMD ["node", "examples/openui-chat/server.js"]
