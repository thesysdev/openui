# Vercel AI SDK

An [OpenUI](https://openui.com) example showing how to wire a [Vercel AI SDK](https://ai-sdk.dev/) `streamText` backend to OpenUI's `<AgentInterface />`.

## What this demonstrates

- Using `vercelAIAdapter()` and `vercelAIMessageFormat` with OpenUI's `<AgentInterface />`
- A Next.js route that calls `streamText` against OpenUI Cloud Completions (`openai.chat(...)`)
- Server-side tools (`get_weather`, `get_stock_price`, `search_web`) via the AI SDK `tool()` helper, looping up to 5 steps

## Getting started

1. Mint an OpenUI Cloud key into `.env.local`:

```bash
pnpm generate:apiKey
```

2. Install dependencies from this example directory:

```bash
pnpm install --ignore-workspace
```

3. Run the dev server from this directory:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the chat interface.

## How it works

The server (`src/app/api/chat/route.ts`) uses `streamText` with Cloud Completions (`POST /v1/embed/chat/completions`), `cloudInstructions()` (generated `openuiLibrary` spec), and the tools in `src/lib/tools.ts`. It returns `toUIMessageStreamResponse()` — the Vercel AI SDK's native UIMessage stream.

The frontend (`src/app/page.tsx`) renders `<AgentInterface />` with `fetchLLM({ streamAdapter: vercelAIAdapter(), messageFormat: vercelAIMessageFormat })`. Storage is omitted, so AgentInterface uses its built-in in-memory default (wiped on reload).

To add more tools, define them with `tool()` in `src/lib/tools.ts` and pass them to `streamText`.

## Learn more

- [OpenUI documentation](https://openui.com/docs)
- [Vercel AI SDK docs](https://ai-sdk.dev/)

## Verify

```bash
pnpm verify
```
