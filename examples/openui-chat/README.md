This is an [OpenUI](https://openui.com) Agent Chat project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/api/route.ts` and improving your agent
by adding system prompts or tools.

## Docker

Build and run the chat example in a container — no local setup required.

### Quick Start

From the **repository root**:

```bash
docker build -t openui-chat -f examples/openui-chat/Dockerfile .
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... openui-chat
```

Then open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | Your OpenAI API key |
| `PORT` | ❌ | `3000` | Port the server listens on |

### Docker Compose

```yaml
services:
  openui-chat:
    build:
      context: ../..          # repo root
      dockerfile: examples/openui-chat/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

```bash
# From examples/openui-chat/
OPENAI_API_KEY=sk-... docker compose up --build
```

### Image Details

- **Base:** `node:22-alpine` (production stage ~180 MB)
- **Build:** Multi-stage (deps → build → standalone runner)
- **Output:** Next.js standalone mode for minimal image size
- **User:** Runs as non-root `nextjs` user (UID 1001)

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
