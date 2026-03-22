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

Build and run with a single command:

```bash
# From the monorepo root
docker build -t openui-chat -f examples/openui-chat/Dockerfile .

# Run the container
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... openui-chat
```

Or from within the example directory:

```bash
cd examples/openui-chat
docker build -t openui-chat -f Dockerfile ../..
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... openui-chat
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `PORT` | Server port (default: `3000`) | No |
| `HOSTNAME` | Server hostname (default: `0.0.0.0`) | No |

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
