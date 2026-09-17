This is an [OpenUI](https://openui.com) Self Hosted Chat project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## Setup

Create `.env.local` with your OpenAI credentials:

```bash
OPENAI_API_KEY=...
# Optional:
OPENAI_MODEL=gpt-5.2
```

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/api/chat/route.ts` and improving your agent
by adding system prompts or tools. A LangGraph scaffold puts the
implementation in `src/agent/agent.ts` instead.

If you selected LangGraph, the Vercel AI SDK, or Vercel Eve, the generated app includes a `get_weather`
example. Ask “What’s the weather in Berlin?” to exercise its native tool loop.

## Deploy

From the project directory:

```bash
npx @openuidev/cli@latest deploy
npx @openuidev/cli@latest deploy --prod
```

Deploys to Vercel. Allowlisted keys from `.env` / `.env.local` (including `OPENAI_API_KEY`) are
passed to that deployment unless you use `--skip-env`. Persist them on the Vercel project for later
deploys.

## Framework deployments

The Vercel AI SDK scaffold runs its backend inside the Next.js API route, so the
frontend and backend can be deployed together as one Next.js project.

## Conversation storage

This starter does not configure durable conversation storage. `AgentInterface`
keeps messages in memory for the current page session and sends that history to
`/api/chat`; refreshing the page loses it. To persist conversations, pass a storage
implementation to `AgentInterface` and back it with your own database. Add a
LangGraph checkpointer separately only for graph-specific durable state.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
