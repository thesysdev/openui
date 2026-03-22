# ── Stage 1: Install & Build ──────────────────────────────────────
FROM node:20-slim AS base

# pnpm via corepack (built into Node 20)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml ./

# Copy only package.json files first for layer caching
COPY packages/openui-cli/package.json packages/openui-cli/
COPY packages/react-headless/package.json packages/react-headless/
COPY packages/react-lang/package.json packages/react-lang/
COPY packages/react-ui/package.json packages/react-ui/
COPY examples/openui-chat/package.json examples/openui-chat/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy full source
COPY . .

# Build workspace packages (required by openui-chat)
RUN pnpm --filter @openuidev/cli build
RUN pnpm --filter @openuidev/react-headless build
RUN pnpm --filter @openuidev/react-lang build
RUN pnpm --filter @openuidev/react-ui build

# Generate system prompt & build Next.js app
WORKDIR /app/examples/openui-chat
RUN pnpm generate:prompt
RUN pnpm build

# ── Stage 2: Production ──────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone server + server chunks
COPY --from=base /app/examples/openui-chat/.next/standalone ./
# Copy static assets
COPY --from=base /app/examples/openui-chat/.next/static ./examples/openui-chat/.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "examples/openui-chat/server.js"]
