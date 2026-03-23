=== FILE: examples/openui-chat/Dockerfile ===
# syntax=docker/dockerfile:1

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set dummy env vars for build time (Next.js requires them to be present)
# These will be overridden at runtime
ARG NEXT_PUBLIC_OPENUI_URL=
ARG NEXT_PUBLIC_MODEL=

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set correct permissions for Next.js cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime environment variables (override with -e flags at docker run)
# OPENAI_API_KEY - Your OpenAI API key
# OPENAI_BASE_URL - Custom API base URL (e.g. for Ollama, Azure, etc.)
# NEXT_PUBLIC_OPENUI_URL - Public URL for the OpenUI API endpoint
# NEXT_PUBLIC_MODEL - Default model to use (e.g. gpt-4o, gpt-4o-mini)

CMD ["node", "server.js"]


=== FILE: examples/openui-chat/.dockerignore ===
# Node modules
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Next.js build output
.next
out
build
dist

# Environment files (never bundle secrets into image)
.env
.env.local
.env.development
.env.production
.env.*.local

# Version control
.git
.gitignore
.gitattributes

# Editor / OS artifacts
.DS_Store
*.swp
*.swo
.vscode
.idea

# Test / coverage
coverage
.nyc_output
__tests__
*.test.*
*.spec.*

# Misc
README.md
Dockerfile
.dockerignore


=== FILE: examples/openui-chat/next.config.ts (or next.config.mjs / next.config.js — check existing) ===
// NOTE: This is a PATCH — add `output: 'standalone'` to the existing next.config.
// Only modify the output field; keep all other existing configuration intact.
//
// If the file is TypeScript (next.config.ts):
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ... keep any existing config options ...
  output: 'standalone',
};

export default nextConfig;

// If the file is ESM (next.config.mjs):
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: 'standalone',
// };
// export default nextConfig;

// If the file is CJS (next.config.js):
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: 'standalone',
// };
// module.exports = nextConfig;


=== FILE: examples/openui-chat/README.md (full replacement or append section) ===
# OpenUI Chat Example

A sample Next.js chat application built with OpenUI.

## Running with Docker

The easiest way to run the OpenUI chat example is with Docker.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running

### Build the image

```bash
cd examples/openui-chat
docker build -t openui-chat .
```

### Run the container

```bash
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... openui-chat
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | — | Your OpenAI API key. Required to call the model API. |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | Custom API base URL. Use this to point to Ollama, Azure OpenAI, LM Studio, or any OpenAI-compatible endpoint. |
| `NEXT_PUBLIC_OPENUI_URL` | No | — | Public URL for the OpenUI API endpoint, exposed to the browser. |
| `NEXT_PUBLIC_MODEL` | No | `gpt-4o-mini` | The default model to use for chat completions (e.g. `gpt-4o`, `gpt-4o-mini`, `ollama/llama3`). |
| `PORT` | No | `3000` | The port the server listens on inside the container. |

### Examples

**Use a custom model:**
```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=sk-... \
  -e NEXT_PUBLIC_MODEL=gpt-4o \
  openui-chat
```

**Use with Ollama (local models):**
```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=ollama \
  -e OPENAI_BASE_URL=http://host.docker.internal:11434/v1 \
  -e NEXT_PUBLIC_MODEL=llama3 \
  openui-chat
```

**Use with Azure OpenAI:**
```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=<azure-api-key> \
  -e OPENAI_BASE_URL=https://<your-resource>.openai.azure.com/openai/deployments/<deployment>/v1 \
  -e NEXT_PUBLIC_MODEL=gpt-4o \
  openui-chat
```

**Expose on a different host port:**
```bash
docker run -p 8080:3000 -e OPENAI_API_KEY=sk-... openui-chat
# Now available at http://localhost:8080
```

**Pass all env vars from a file:**
```bash
# Create a .env file (never commit this!)
echo 'OPENAI_API_KEY=sk-...' > .env.docker

docker run -p 3000:3000 --env-file .env.docker openui-chat
```

## Running Locally (without Docker)

### Prerequisites

- Node.js 20+
- pnpm

### Install & run

```bash
cd examples/openui-chat
pnpm install
cp .env.example .env.local   # then edit .env.local with your API key
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
