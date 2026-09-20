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
`src/agent/agent.ts` instead.

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

In both variants, your framework executes application tools. OpenUI Cloud
provides managed conversation storage and executes its provider tools: web
search, image search, and configured MCP servers.

## Conversation storage

All variants load history through `useOpenuiCloudStorage()` and `/api/frontend-token`.
Default and LangGraph use Responses with `store: true`; Vercel AI SDK and Eve
append new turns with `storeChatCompletionHistory`.

AI SDK saves before finishing the stream and reports save errors to the UI.
Eve saves on `turn.completed` and logs save errors server-side. Failed or cancelled
turns are skipped. Cloud history does not restore a missing Eve session.

Append only new messages. Reload history before retrying an uncertain save to
avoid duplicates. For production, replace the demo identity in the token route
and `assertConversationAccess`, and replace Eve's anonymous authentication.

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
