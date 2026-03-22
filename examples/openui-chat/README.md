This is an [OpenUI](https://openui.com) Agent Chat project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## Getting Started

### Development

First, run the development server (from the monorepo root):

```bash
pnpm install
pnpm --filter openui-chat dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker

Build and run the example with a single command:

```bash
# Build from the monorepo root
docker build -f examples/openui-chat/Dockerfile -t openui-chat .

# Run (requires OPENAI_API_KEY)
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... openui-chat
```

#### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `PORT` | No | Server port (default: `3000`) |
| `HOSTNAME` | No | Server hostname (default: `0.0.0.0`) |

You can start editing the page by modifying `src/app/api/route.ts` and improving your agent
by adding system prompts or tools.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
