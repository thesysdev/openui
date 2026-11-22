This is an [OpenUI](https://openui.com) Self Hosted Chat project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## OpenUI: guide for coding agents

This project is built with [OpenUI](https://www.openui.com). Before changing it, read the maintained OpenUI skill for coding agents published at [thesysdev/skills](https://raw.githubusercontent.com/thesysdev/skills/refs/heads/main/skills/openui/SKILL.md).

## Setup

Create `.env.local` with your OpenAI credentials:

```bash
OPENAI_API_KEY=...
# Optional:
OPENAI_MODEL=gpt-5.2
OPENAI_BASE_URL=https://api.openai.com/v1
```

All backends use `OPENAI_API_KEY`. Set `OPENAI_BASE_URL` and `OPENAI_MODEL` to use
another OpenAI-compatible provider.

## Getting Started

Install dependencies, then run the development server:

Use Node.js 24 for the Vercel Eve scaffold.

```bash
pnpm install
pnpm dev
```

For an npm project, use `npm install` and `npm run dev` instead.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/api/chat/route.ts` and improving your agent
by adding system prompts or tools. A LangGraph scaffold puts the
implementation in `src/agent.ts` instead.

The generated app includes a `get_weather` tool example. Ask “What’s the weather in Berlin?” to exercise its native tool loop.

## Intelligent UI answers

`src/lib/library.ts` re-exports `library` and `promptOptions` from
`@openuidev/intelligent-ui-library` (pinned to `0.0.2`). Answers start with `Col` and
use components such as `Title`, `Text`, `Table`, `Chart` and `Form`. The starters
exercise tables, interactive charts and forms with this component set.

`pnpm generate` runs `openui generate src/lib/library.ts --spec --out src/generated/spec.json`.
It runs automatically before `pnpm dev`. After changing the library or prompt options,
run it before `pnpm build` too. The checked-in spec supplies the library and prompt
options separately to `generateSystemPrompt({ library, promptOptions })` in every backend.
To add rules, extend the exported `promptOptions` and spread the library's
`additionalRules`; keep its default `examples`.

The chat still uses `AgentInterface`, adapters, theming and styles from
`@openuidev/react-ui`. The new library's `ThemeProvider` wraps the chat and receives
the same `mode`, so answers follow both the system preference and the footer's
light/dark toggle. Previously saved answers using old component names cannot render
with this library; start a new chat.

## Deploy

From the project directory, deploy a preview with the pinned OpenUI CLI:

```bash
pnpm run deploy
pnpm run deploy -- --prod
```

The command deploys to Vercel. Allowlisted keys from `.env` / `.env.local` (including `OPENAI_API_KEY`)
are passed to that deployment unless you use `--skip-env`. Persist them on the Vercel project for later
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

LangGraph is the default backend and uses Chat Completions with your provider.
