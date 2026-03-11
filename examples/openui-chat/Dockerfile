FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

# copy whole repo
COPY . .

# install workspace deps
RUN pnpm install

# move to example app
WORKDIR /app/examples/openui-chat

# build the app
RUN pnpm build


FROM node:20-alpine

WORKDIR /app

RUN corepack enable
ENV NODE_ENV=production

COPY --from=builder /app ./

WORKDIR /app/examples/openui-chat

EXPOSE 3000

CMD ["pnpm","start"]
