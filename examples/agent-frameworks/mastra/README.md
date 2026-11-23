# Mastra

An [OpenUI](https://openui.com) example showing how to wire a [Mastra](https://mastra.ai) agent backend to OpenUI's generative UI frontend using the [AG-UI protocol](https://docs.ag-ui.com).

## What this demonstrates

- Using `agUIAdapter()` as the `streamAdapter` in the `llm` config of OpenUI's `<AgentInterface />` component
- A Mastra `Agent` with `createTool` tools (weather and stock price) running in a Next.js API route
- An [OpenUI Cloud custom gateway](https://mastra.ai/models/gateways/custom-gateways) so Mastra talks Completions at `https://api.thesys.dev/v1/embed`
- Streaming AG-UI protocol events from the server to the client via SSE

## Getting started

1. Install dependencies from this example directory:

```bash
pnpm install --ignore-workspace
```

2. Mint an OpenUI Cloud key into `.env.local` (or set `THESYS_API_KEY` there):

```bash
pnpm generate:apiKey
```

3. Run the dev server from this directory:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the chat interface.

## How it works

The server (`src/app/api/chat/route.ts`) wraps a Mastra `Agent` with `@ag-ui/mastra`'s `MastraAgent`, which emits AG-UI protocol events. These events are serialized as SSE and streamed to the client.

Mastra's built-in model router treats `google/...` as Gemini and strips the provider. `src/openui-cloud-gateway.ts` registers an `openui-cloud` gateway so the agent model `openui-cloud/thesys/google/gemini-3.6-flash-free` is sent to OpenUI Cloud Completions as `google/gemini-3.6-flash-free`. The gateway is registered on the `Mastra` instance in `src/mastra.ts`. The provider id is `thesys` (not `google`) so Mastra does not apply native-Gemini message rewrites on the OpenAI-compatible Cloud path.

The frontend (`src/app/page.tsx`) renders OpenUI's `<AgentInterface />` with `fetchLLM({ streamAdapter: agUIAdapter(), ... })`. Threads and messages persist in browser local storage. The adapter parses the SSE stream into chat events that drive the UI.

To add more tools, define them with `createTool` in `src/tools.ts` and pass them to the `Agent`.

## Component library and theme

Answers use `@openuidev/intelligent-ui-library` (pinned to `0.0.2`), rooted at `Col`. `src/library.ts` re-exports its `library` and extends its `promptOptions` and `additionalRules` with form submission and conditional field rules, preserving the default examples.

`pnpm generate` runs `openui generate src/library.ts --spec --out src/generated/spec.json` before development, builds and verification. `cloudInstructions()` passes the library and prompt options separately to `generateSystemPrompt({ cloud: true, ... })`, preserving the Cloud prompt flow.

The frontend keeps `AgentInterface`, adapters, theming and styles from `@openuidev/react-ui`. The new library's `ThemeProvider` and the chat's `theme` receive the same `useSystemThemeMode()` value, so answers follow the chat in light and dark mode.

Previously saved answers using old components cannot render with this library. Start a new chat to generate answers with `Col`, `Title`, `Text`, `Chart` and the other current components.

## Learn more

- [OpenUI documentation](https://openui.com/docs)
- [Mastra documentation](https://mastra.ai/docs)
- [AG-UI protocol](https://docs.ag-ui.com)

## Verify

```bash
pnpm verify
```
