# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copy the whole monorepo
COPY . .

# Install workspace dependencies
RUN pnpm install

# Build the example app
WORKDIR /app/examples/openui-chat
RUN pnpm build


# Production stage
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm","start"]
