# ── Multi-stage Dockerfile for OpenUI Chat ──
# Builds the monorepo workspace packages and the openui-chat Next.js app.
#
# Usage:
#   docker build -t openui-chat -f examples/openui-chat/Dockerfile .
#   docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... openui-chat

# ── Stage 1: Dependencies ──
FROM node:20-slim AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace root config first (cache layer for installs)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package sources
COPY packages/ packages/
COPY examples/openui-chat/ examples/openui-chat/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ──
FROM deps AS build

# Build workspace packages the chat example depends on
RUN pnpm --filter @openuidev/react-headless run build && \
    pnpm --filter @openuidev/react-lang run build && \
    pnpm --filter @openuidev/react-ui run build

# Build the CLI (needed for system prompt generation)
RUN pnpm --filter @openuidev/cli run build

# Generate the system prompt
RUN pnpm --filter openui-chat run generate:prompt

# Build the Next.js app
RUN pnpm --filter openui-chat run build

# ── Stage 3: Production ──
FROM node:20-slim AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy entire app from build stage
COPY --from=build /app /app

WORKDIR /app/examples/openui-chat

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]
