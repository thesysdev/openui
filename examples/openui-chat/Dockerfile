FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files from monorepo root and example
COPY package.json package-lock.json* ./
COPY examples/openui-chat/package.json ./examples/openui-chat/

# Install dependencies
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/examples/openui-chat/node_modules ./examples/openui-chat/node_modules

# Copy source files
COPY . .

# Build the application
WORKDIR /app/examples/openui-chat
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/examples/openui-chat/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/examples/openui-chat/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/examples/openui-chat/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Environment variables for OpenAI configuration
ENV OPENAI_API_KEY=""
ENV OPENAI_MODEL="gpt-4"
ENV OPENAI_BASE_URL=""

CMD ["node", "examples/openui-chat/server.js"]
