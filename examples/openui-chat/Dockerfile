# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration first for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all package.json files for dependency resolution
COPY packages/react-headless/package.json packages/react-headless/
COPY packages/react-lang/package.json packages/react-lang/
COPY packages/react-ui/package.json packages/react-ui/
COPY packages/cli/package.json packages/cli/
COPY examples/openui-chat/package.json examples/openui-chat/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for workspace packages and the chat example
COPY packages/ packages/
COPY examples/openui-chat/ examples/openui-chat/
COPY tsconfig.json ./

# Build CLI, generate system prompt, then build the Next.js app
RUN pnpm --filter @openuidev/cli build
RUN pnpm --filter openui-chat generate:prompt
RUN pnpm --filter openui-chat build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what's needed to run the app
COPY --from=builder --chown=nextjs:nodejs /app/examples/openui-chat/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/examples/openui-chat/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/examples/openui-chat/public ./public 2>/dev/null || true
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
