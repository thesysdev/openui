=== FILE: examples/openui-chat/Dockerfile ===
# syntax=docker/dockerfile:1

# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy manifests first for layer caching
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ─── Stage 2: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects anonymous telemetry; disable it
ENV NEXT_TELEMETRY_DISABLED=1

# Build args that may be baked into the image at build time
# (runtime env vars override these via next.config)
ARG NEXT_PUBLIC_OPENAI_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_MODEL

RUN pnpm build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only the build artefacts needed at runtime
COPY --from=builder /app/public ./public

# Standalone output (set output:'standalone' in next.config)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Runtime environment variables — all can be overridden with -e / --env-file
# OPENAI_API_KEY          – required; your OpenAI (or compatible) API key
# OPENAI_BASE_URL         – optional; custom API base URL (default: https://api.openai.com/v1)
# DEFAULT_MODEL           – optional; model name to use (default: gpt-4o)
# NEXT_PUBLIC_APP_TITLE   – optional; chat window title shown in the UI

CMD ["node", "server.js"]


=== FILE: examples/openui-chat/.dockerignore ===
# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# next.js
.next/
out/
build/

# misc
.DS_Store
*.pem
.env*
!.env.example

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# git
.git
.gitignore

# docs
*.md


=== FILE: examples/openui-chat/next.config.ts (ADD output: 'standalone') ===
// NOTE: merge this change into the existing next.config.ts.
// Only the `output` field is new; keep everything else that already exists.
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable standalone output so Docker can run the app without node_modules
  output: 'standalone',

  // Expose server-side env vars to the client where needed
  env: {
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    DEFAULT_MODEL:   process.env.DEFAULT_MODEL   ?? 'gpt-4o',
  },

  // --- keep any existing config below this line ---
};

export default nextConfig;


=== FILE: examples/openui-chat/.env.example ===
# Copy this file to .env.local and fill in your values.
# When running with Docker, pass these as -e flags or use --env-file.

# Required
OPENAI_API_KEY=sk-...

# Optional – change to point at a compatible API (Ollama, Azure OpenAI, etc.)
OPENAI_BASE_URL=https://api.openai.com/v1

# Optional – model name to use
DEFAULT_MODEL=gpt-4o

# Optional – title shown in the chat UI
NEXT_PUBLIC_APP_TITLE=OpenUI Chat


=== FILE: examples/openui-chat/README.md (full replacement) ===
# openui-chat

A ready-to-use chat interface powered by [OpenUI](https://openui.com).

---

## Quick start (local)

```bash
cd examples/openui-chat
cp .env.example .env.local   # fill in OPENAI_API_KEY at minimum
npm install
npm run dev
```

Open <http://localhost:3000>.

---

## Docker

### Build

```bash
cd examples/openui-chat
docker build -t openui-chat .
```

### Run

```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=sk-... \
  openui-chat
```

Open <http://localhost:3000>.

### Using an env file

```bash
cp .env.example .env.local   # edit values
docker run -p 3000:3000 --env-file .env.local openui-chat
```

### Build-time vs run-time variables

| Variable | Stage | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | **run-time** | OpenAI (or compatible) secret key — **required** |
| `OPENAI_BASE_URL` | run-time | API base URL. Default: `https://api.openai.com/v1` |
| `DEFAULT_MODEL` | run-time | Model name. Default: `gpt-4o` |
| `NEXT_PUBLIC_APP_TITLE` | run-time | Title shown in the chat UI |
| `NEXT_PUBLIC_OPENAI_BASE_URL` | **build-time** `--build-arg` | Bake a base URL into the image (optional) |
| `NEXT_PUBLIC_DEFAULT_MODEL` | **build-time** `--build-arg` | Bake a default model into the image (optional) |

> **Security note:** never pass `OPENAI_API_KEY` as a build-time `--build-arg`; it would be baked into image layers. Always supply it at `docker run` time.

### Using a custom / self-hosted model

```bash
# Ollama example
docker run -p 3000:3000 \
  -e OPENAI_BASE_URL=http://host.docker.internal:11434/v1 \
  -e OPENAI_API_KEY=ollama \
  -e DEFAULT_MODEL=llama3 \
  openui-chat
```

---

## Environment variables reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | API key for OpenAI or a compatible provider |
| `OPENAI_BASE_URL` | ❌ | `https://api.openai.com/v1` | Base URL of the chat-completions API |
| `DEFAULT_MODEL` | ❌ | `gpt-4o` | Model name sent in every request |
| `NEXT_PUBLIC_APP_TITLE` | ❌ | `OpenUI Chat` | Heading displayed in the browser tab / header |
| `PORT` | ❌ | `3000` | HTTP port the server listens on inside the container |
