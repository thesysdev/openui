# syntax=docker/dockerfile:1.7
# --------------------------------------------------
# Build stage
# --------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat
ARG PNPM_VERSION=9.12.0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

ENV NEXT_TELEMETRY_DISABLED=1

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./

COPY packages/openui-cli/package.json ./packages/openui-cli/
COPY packages/react-ui/package.json ./packages/react-ui/
COPY packages/react-headless/package.json ./packages/react-headless/
COPY packages/lang-core/package.json ./packages/lang-core/
COPY packages/react-lang/package.json ./packages/react-lang/
COPY examples/openui-chat/package.json ./examples/openui-chat/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile --ignore-scripts

COPY packages/openui-cli ./packages/openui-cli
COPY packages/react-ui ./packages/react-ui
COPY packages/react-headless ./packages/react-headless
COPY packages/lang-core ./packages/lang-core
COPY packages/react-lang ./packages/react-lang
COPY examples/openui-chat ./examples/openui-chat

RUN pnpm --filter @openuidev/cli build
RUN pnpm --filter @openuidev/react-ui build
RUN pnpm --filter @openuidev/react-headless build
RUN pnpm --filter @openuidev/lang-core build
RUN pnpm --filter @openuidev/react-lang build

WORKDIR /app/examples/openui-chat
RUN node /app/packages/openui-cli/dist/index.js generate src/library.ts --out src/generated/system-prompt.txt \
  && pnpm build

# --------------------------------------------------
# Runtime stage
# --------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000 HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

# Copy full standalone output to avoid brittle partial-copy assumptions
COPY --from=builder --chown=nextjs:nodejs /app/examples/openui-chat/.next/standalone ./

# Static assets expected by Next at runtime
COPY --from=builder --chown=nextjs:nodejs /app/examples/openui-chat/.next/static ./examples/openui-chat/.next/static

# If your app has a public directory, include this line
# COPY --from=builder --chown=nextjs:nodejs /app/examples/openui-chat/public ./examples/openui-chat/public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "examples/openui-chat/server.js"]
