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

All variants use OpenUI Cloud's Chat Completions endpoint. Application tools
(such as the included weather tool) run in your server or agent framework.
Responses-only provider tools (`web_search`, `image_search`, and MCP declarations)
are not passed to Chat Completions; add application tools for those integrations.

## Conversation storage

The browser connects to OpenUI Cloud through `useOpenuiCloudStorage()` with a
short-lived token from `/api/frontend-token`. The `threadId` is the Cloud
conversation id.

The default and LangGraph routes send the full message history on each Chat
Completions request. After a successful turn, they call
`storeChatCompletionHistory` from `@openuidev/server/openai` with only the latest
user message and the new assistant/tool messages. This preserves reloadable
history without duplicating earlier turns. The default frontend uses
`openAIAdapter()` to read native Chat Completions SSE and loads persisted history
before each request, including tool results that are not part of that stream.
Chat Completions does not persist
conversations automatically through `conversation` or `store: true`.

The Vercel AI SDK and Eve overlays already use Chat Completions, but do not yet
write their completed turns to Cloud storage. Eve uses its own HTTP session
protocol instead of `/api/chat`, with a session cursor in browser `localStorage`.
The selected model is also kept in `localStorage`.

Add a LangGraph checkpointer separately if the graph needs durable execution
state, interrupts, or resumable runs.

## Switching Models

Use the model switcher in the chat header to choose a model for new messages. The starter keeps a
small curated model list in `src/lib/models.tsx` and sends the selected `provider/model` id to
`/api/chat`, which validates it against the same list. The built-in list includes Gemini, GPT,
Claude Sonnet, and Claude Opus options; free Gemini variants are marked with a `Free` badge.

The built-in model ids are available on [models.dev's OpenRouter provider
list](https://models.dev/providers/openrouter/).

## SDK packages

- `@openuidev/server` — `storeChatCompletionHistory()` for saving new Chat
  Completions turns to Cloud conversations.

- `@openuidev/lang-core` — `generateSystemPrompt({ cloud: true })` used by the
  `/api/chat` route.
- `@openuidev/react-ui` — the chat UI runtime and component library
  (`AgentInterface`, `openuiLibrary`, `fetchLLM`, `ModelSwitcher`, storage/stream contracts).

A devtools widget is available automatically in development.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
