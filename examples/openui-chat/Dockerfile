FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install

WORKDIR /app/examples/openui-chat
RUN pnpm build


FROM node:20-alpine

WORKDIR /app

RUN corepack enable
ENV NODE_ENV=production

COPY --from=builder /app ./

WORKDIR /app/examples/openui-chat

EXPOSE 3000

CMD ["pnpm","start"]