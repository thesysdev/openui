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

OpenUI Cloud is the durable conversation store in every Cloud
variant. The browser connects directly through `useOpenuiCloudStorage()` with a
short-lived token from `/api/frontend-token`.

- Default and LangGraph routes use Responses with `conversation: threadId` and
  `store: true`.
- Vercel AI SDK uses Chat Completions and awaits `storeChatCompletionHistory`
  before sending the UI stream's final finish event. Only the latest user message and the new assistant/tool messages
  are appended. Save failures become stream errors.
- Eve sends the Cloud conversation id in `x-openui-conversation-id`. Its channel
  checks the demo user/app scope and places the id in session attributes. The
  `agent/hooks/persist-chat-completion.ts` hook collects each turn's messages and
  tool results and saves them on `turn.completed`. Failed/cancelled turns are
  discarded. Eve hooks observe already-recorded events, so a save failure is
  logged server-side; it does not undo Eve's completed event.

Both Chat Completions variants use `src/lib/chat-completion-history.ts`. Never
pass previously stored turns to the append helper: retries are not idempotent.
Reload Cloud history before retrying an ambiguous save failure. The API key stays
on the server. Generation still needs its own context: AI SDK receives the replay
from the UI; Eve keeps its own session context. Cloud persistence does not restore
an expired or missing Eve session automatically.

Browser `localStorage` holds only the selected model and, for Eve, the session
cursor. The Eve channel accepts text messages; attachments are disabled. The AI
SDK route supports text and images.

These templates share a demo identity. When adding authentication, derive the user
from your server session in both `/api/frontend-token` and
`assertConversationAccess`, and replace Eve's anonymous channel authentication.

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
