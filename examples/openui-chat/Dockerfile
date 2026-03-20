# ── Build Stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests (cache-friendly layer)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/openui-cli/package.json   packages/openui-cli/
COPY packages/react-ui/package.json     packages/react-ui/
COPY packages/react-headless/package.json packages/react-headless/
COPY packages/react-lang/package.json   packages/react-lang/
COPY examples/openui-chat/package.json  examples/openui-chat/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ packages/
COPY examples/openui-chat/ examples/openui-chat/

# Build workspace packages the chat app depends on
RUN pnpm --filter @openuidev/cli build
RUN pnpm --filter @openuidev/react-ui build
RUN pnpm --filter @openuidev/react-headless build
RUN pnpm --filter @openuidev/react-lang build

# Generate the system prompt used by the chat app
RUN cd examples/openui-chat && pnpm generate:prompt

# Build Next.js with standalone output
RUN cd examples/openui-chat && pnpm build

# ── Runtime Stage ───────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/examples/openui-chat/.next/standalone ./
# Static assets (not included in standalone)
COPY --from=builder /app/examples/openui-chat/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
