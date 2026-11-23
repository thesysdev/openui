This is an [OpenUI](https://openui.com) Cloud project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## OpenUI: guide for coding agents

This project is built with [OpenUI](https://www.openui.com). Before changing it, read the maintained OpenUI skill for coding agents published at [thesysdev/skills](https://raw.githubusercontent.com/thesysdev/skills/refs/heads/main/skills/openui/SKILL.md).

## Setup

The CLI writes `.env` for you. If you cloned the generated project elsewhere,
run `pnpm generate:apiKey` to mint `THESYS_API_KEY`, then add `DEMO_USER_ID`
and `APP_ID`. All backends use `THESYS_API_KEY`; no `OPENAI_API_KEY` is needed.

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
by adding system prompts or tools. A LangGraph scaffold puts the implementation in
`src/agent.ts` instead.

## Intelligent UI answers

`src/lib/library.ts` re-exports `library` and `promptOptions` from
`@openuidev/intelligent-ui-library` (pinned to `0.0.2`). Answers start with `Col` and
use components such as `Title`, `Text`, `Table`, `Chart` and `Form`. The starters
exercise tables, interactive charts and forms with this component set.

`pnpm generate` runs `openui generate src/lib/library.ts --spec --out src/generated/spec.json`.
It runs automatically before `pnpm dev`. After changing the library or prompt options,
run it before `pnpm build` too. The checked-in spec supplies the library and prompt
options separately to `generateSystemPrompt({ cloud: true, library, promptOptions })` in every backend.
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
with a short-lived token from `/api/frontend-token`. The LangGraph `afterAgent` middleware uses
`storeLangGraphHistory` from `@openuidev/server/langgraph` once after a successful
run to save the complete new turn: user message, assistant messages, tool calls,
and tool results. Persistence finishes before the stream ends. Replayed history
is excluded; failed or stopped runs are not persisted.

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
- `@openuidev/intelligent-ui-library` — the answer components, prompt options and answer theme.
- `@openuidev/react-ui` — the chat UI runtime
  (`AgentInterface`, `fetchLLM`, `ModelSwitcher`, storage/stream contracts).

A devtools widget is available automatically in development.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
