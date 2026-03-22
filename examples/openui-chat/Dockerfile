# ──────────────────────────────────────────────
# Dockerfile for openui-chat
# Build context: monorepo root (../../)
#
#   docker build -f examples/openui-chat/Dockerfile -t openui-chat .
#   docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... openui-chat
# ──────────────────────────────────────────────

# ── Stage 1: Install & Build ─────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace metadata for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for each workspace package
COPY packages/react-lang/package.json     packages/react-lang/
COPY packages/react-headless/package.json packages/react-headless/
COPY packages/react-ui/package.json       packages/react-ui/
COPY packages/openui-cli/package.json     packages/openui-cli/

# Copy the chat example source
COPY examples/openui-chat/ examples/openui-chat/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build workspace packages (order matters — deps first)
RUN pnpm --filter @openuidev/react-lang run build \
 && pnpm --filter @openuidev/react-headless run build \
 && pnpm --filter @openuidev/react-ui run build

# Build the Next.js app
WORKDIR /app/examples/openui-chat
RUN pnpm run build

# ── Stage 2: Production ─────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the full built /app (node_modules, .next, workspace packages)
# This preserves pnpm's symlink structure and workspace resolution
COPY --from=builder /app /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

WORKDIR /app/examples/openui-chat

CMD ["pnpm", "start"]
