# Vercel AI SDK

An [OpenUI](https://openui.com) example showing how to wire a [Vercel AI SDK](https://ai-sdk.dev/) `streamText` backend to OpenUI's `<AgentInterface />`.

## What this demonstrates

- Using `vercelAIAdapter()` and `vercelAIMessageFormat` with OpenUI's `<AgentInterface />`
- A Next.js route that calls `streamText` against OpenUI Cloud Completions (`openai.chat(...)`)
- Answers composed with `@openuidev/intelligent-ui-library`, rooted at `Col`, with light/dark mode matching the chat
- Server-side tools (`get_weather`, `get_stock_price`, `search_web`) via the AI SDK `tool()` helper, looping up to 5 steps

## Getting started

1. Install dependencies from this example directory:

```bash
pnpm install --ignore-workspace
```

2. Mint an OpenUI Cloud key into `.env.local` (or set `THESYS_API_KEY` there yourself):

```bash
pnpm generate:apiKey
```

3. Run the dev server from this directory:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the chat interface.

## How it works

The library module (`src/library.ts`) re-exports `library` from `@openuidev/intelligent-ui-library` and extends its `promptOptions` and `additionalRules` with form submission and conditional field rules. The default examples are preserved.

Before development, builds and verification, `pnpm generate` runs `openui generate src/library.ts --spec --out src/generated/spec.json`. `cloudInstructions()` loads that spec and passes the library and prompt options separately to `generateSystemPrompt({ cloud: true, ... })`.

The server (`src/app/api/chat/route.ts`) uses `streamText` with Cloud Completions (`POST /v1/embed/chat/completions`), `cloudInstructions()`, and the tools in `src/lib/tools.ts`. It returns `toUIMessageStreamResponse()` — the Vercel AI SDK's native UIMessage stream. The only required environment variable is `THESYS_API_KEY`; no `OPENAI_API_KEY` is needed.

The frontend (`src/app/page.tsx`) keeps `<AgentInterface />`, `fetchLLM`, the Vercel AI adapters and styles from `@openuidev/react-ui`. It passes the new `library` as `componentLibrary` and wraps the chat in the new library's `ThemeProvider`. Both providers receive the same `useSystemThemeMode()` value, so answers follow changes to the system's light/dark preference. Threads and messages persist in browser local storage.

Previously saved answers using the old components cannot render with this library. Start a new chat to generate answers using `Col`, `Title`, `Text`, `Chart` and the other current components.

To add more tools, define them with `tool()` in `src/lib/tools.ts` and pass them to `streamText`.

## Learn more

- [OpenUI documentation](https://openui.com/docs)
- [Vercel AI SDK docs](https://ai-sdk.dev/)

## Verify

```bash
pnpm verify
```
