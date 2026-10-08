This is an [OpenUI](https://openui.com) Cloud project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## Setup

The CLI writes `.env` for you. If you cloned the generated project elsewhere,
run `pnpm generate:apiKey` to mint `THESYS_API_KEY`, then add `DEMO_USER_ID`
and `APP_ID`.

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/api/chat/route.ts` and improving your agent
by adding system prompts or tools. A LangGraph scaffold puts the implementation in
`src/agent.ts` instead.

## Deploy

From the project directory, deploy a preview with the pinned OpenUI CLI:

```bash
pnpm run deploy
pnpm run deploy -- --prod
```

When the project uses npm, replace `pnpm run` with `npm run` in both commands. The command deploys
to Vercel. Allowlisted keys from `.env` / `.env.local` (including `THESYS_API_KEY`) are
passed to that deployment unless you use `--skip-env`. Persist them on the Vercel project for later
deploys.

## Framework deployments

The Vercel AI SDK scaffold is a standard Next.js app: `streamText()` owns the
agent loop and UIMessage stream, so the whole project can be deployed to Vercel.

LangGraph is the default backend. LangGraph and Vercel AI SDK use OpenUI Cloud
Chat Completions and execute application tools inside the framework. These
starters do not attach Responses-only provider tools.

## Conversation storage

The browser creates and reads conversations through `useOpenuiCloudStorage()`
with a short-lived token from `/api/frontend-token`. The LangGraph route uses
`storeLangGraphHistory` from `@openuidev/server/langgraph` to persist the new user
message before generation. After a successful run, its `afterAgent` middleware
stores the new assistant messages, tool calls, and tool results before the stream
ends. Replayed history is excluded. If generation is stopped or fails, the user
message remains saved; unfinished output is not saved.

The model route still sends full history to stateless Chat Completions. The
browser storage adapter does not write messages, so turns are not saved twice.
Vercel AI SDK and Eve use their own generation paths; this LangGraph persistence
hook does not apply to those overlays.

Add a LangGraph checkpointer only for graph-specific durable state, interrupts,
or resumable runs.

## Switching Models

Use the model switcher in the chat header to choose a model for new messages. The starter keeps a
small curated model list in `src/lib/models.tsx` and sends the selected `provider/model` id to
`/api/chat`, which validates it against the same list. The built-in list includes Gemini, GPT,
Claude Sonnet, and Claude Opus options; free Gemini variants are marked with a `Free` badge.

The built-in model ids are available on [models.dev's OpenRouter provider
list](https://models.dev/providers/openrouter/).

## SDK packages

- `@openuidev/lang-core` — `generateSystemPrompt({ cloud: true })` used by the
  `/api/chat` route.
- `@openuidev/react-ui` — the chat UI runtime and component library
  (`AgentInterface`, `openuiLibrary`, `fetchLLM`, `ModelSwitcher`, storage/stream contracts).

A devtools widget is available automatically in development.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
