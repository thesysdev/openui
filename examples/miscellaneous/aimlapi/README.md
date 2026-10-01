# AI/ML API

An [OpenUI](https://openui.com) example that runs `<AgentInterface />` on [AI/ML API](https://aimlapi.com) — an OpenAI-compatible gateway to 1,000+ models under one key — through the [Vercel AI SDK](https://ai-sdk.dev/), with no OpenUI Gateway in between.

## What this demonstrates

- A direct model provider: `createOpenAICompatible()` pointed at `https://api.aimlapi.com/v1`, so the same app can switch between `openai/gpt-5`, `anthropic/claude-sonnet-5`, `google/gemini-3.6-flash`, `deepseek/deepseek-v4-flash` … by changing one env var
- Compiling the `openuiLibrary` system prompt locally with `generateSystemPrompt()` instead of relying on Cloud Completions
- The same `vercelAIAdapter()` / `vercelAIMessageFormat` client wiring as the Vercel AI SDK example, plus the same server-side tools

## Getting started

1. Create an API key at [aimlapi.com/app/keys](https://aimlapi.com/app/keys) and put it in `.env.local`:

```bash
cp .env.example .env.local
# then edit AIMLAPI_API_KEY (and AIMLAPI_MODEL if you want another model)
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

`src/lib/aimlapi.ts` builds the provider with `createOpenAICompatible({ baseURL: "https://api.aimlapi.com/v1", apiKey })`. The route (`src/app/api/chat/route.ts`) calls `streamText` with `aimlapi.chatModel(AIMLAPI_MODEL)`, the locally generated system prompt from `src/lib/openui-prompt.ts`, and the tools in `src/lib/tools.ts`, and returns `toUIMessageStreamResponse()`.

Because there is no Gateway, invalid OpenUI Lang is not corrected server-side; the renderer's own recovery handles it. Pick a model that follows structured instructions well — the default `openai/gpt-5` does. Model ids are `vendor/model` exactly as listed at [aimlapi.com/models](https://aimlapi.com/models).

The provider sends two `X-AIMLAPI-*` headers so the gateway can tell OpenUI traffic apart; they only mean something on `api.aimlapi.com`.

## Learn more

- [OpenUI documentation](https://openui.com/docs)
- [AI/ML API documentation](https://docs.aimlapi.com)
- [Vercel AI SDK docs](https://ai-sdk.dev/)

## Verify

```bash
pnpm verify
```
