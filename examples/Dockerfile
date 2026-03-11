# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy source and build
COPY . .
RUN pnpm build


# Production stage
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

# Copy built app
COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm","start"]
