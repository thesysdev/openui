# --------------------------------------------------
# Build stage: install dependencies and build app
# --------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm through corepack
RUN corepack enable

# Copy the whole repository
COPY . .

# Install dependencies
RUN pnpm install

# Build the OpenUI chat example
WORKDIR /app/examples/openui-chat
RUN pnpm build


# --------------------------------------------------
# Runtime stage: production container
# --------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Set production environment
ENV NODE_ENV=production

# Copy built app from builder
COPY --from=builder /app ./

# Switch to example directory
WORKDIR /app/examples/openui-chat

# Expose app port
EXPOSE 3000

# Start server
CMD ["pnpm","start"]