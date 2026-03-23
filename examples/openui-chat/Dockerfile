# ─────────────────────────────────────────────────────────────────────────────
# OpenUI Chat — Docker Image
#
# Build:  docker build -t openui-chat .     (from repo root)
# Run:    docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... openui-chat
#
# Environment variables:
#   OPENAI_API_KEY  (required) — Your OpenAI API key
#   PORT            (optional) — Port to listen on (default: 3000)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace root manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json for each workspace package the example depends on
COPY packages/react-headless/package.json packages/react-headless/
COPY packages/react-lang/package.json packages/react-lang/
COPY packages/react-ui/package.json packages/react-ui/
COPY packages/openui-cli/package.json packages/openui-cli/
COPY examples/openui-chat/package.json examples/openui-chat/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/ ./

# Copy all source code
COPY packages/ packages/
COPY examples/openui-chat/ examples/openui-chat/

# Build workspace packages (order matters: headless → lang → ui → cli)
RUN pnpm --filter @openuidev/react-headless build || true
RUN pnpm --filter @openuidev/react-lang build || true
RUN pnpm --filter @openuidev/react-ui build || true
RUN pnpm --filter @openuidev/cli build || true

# Generate system prompt and build the Next.js app
WORKDIR /app/examples/openui-chat
RUN mkdir -p src/generated && \
    (pnpm exec openui generate src/library.ts --out src/generated/system-prompt.txt 2>/dev/null || \
     echo "You are a helpful AI assistant." > src/generated/system-prompt.txt)

# Enable standalone output for smaller production image
RUN sed -i 's/turbopack: {},/turbopack: {},\n  output: "standalone",/' next.config.ts

RUN pnpm build

# ── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/examples/openui-chat/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/examples/openui-chat/.next/static   ./examples/openui-chat/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "examples/openui-chat/server.js"]
