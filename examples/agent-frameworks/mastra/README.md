# Mastra

An [OpenUI](https://openui.com) example showing how to wire a [Mastra](https://mastra.ai) agent backend to OpenUI's generative UI frontend using the [AG-UI protocol](https://docs.ag-ui.com).

## What this demonstrates

- Using `agUIAdapter()` as the `streamProtocol` in the `llm` config of OpenUI's `<AgentInterface />` component
- A Mastra `Agent` with `createTool` tools (weather and stock price) running in a Next.js API route
- An [OpenUI Cloud custom gateway](https://mastra.ai/models/gateways/custom-gateways) so Mastra talks Completions at `https://api.thesys.dev/v1/embed`
- Streaming AG-UI protocol events from the server to the client via SSE

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

The server (`src/app/api/chat/route.ts`) wraps a Mastra `Agent` with `@ag-ui/mastra`'s `MastraAgent`, which emits AG-UI protocol events. These events are serialized as SSE and streamed to the client.

Mastra's built-in model router treats `google/...` as Gemini and strips the provider. `src/openui-cloud-gateway.ts` registers an `openui-cloud` gateway so the agent model `openui-cloud/thesys/google/gemini-3.6-flash-free` is sent to OpenUI Cloud Completions as `google/gemini-3.6-flash-free`. The gateway is registered on the `Mastra` instance in `src/mastra.ts`. The provider id is `thesys` (not `google`) so Mastra does not apply native-Gemini message rewrites on the OpenAI-compatible Cloud path.

The frontend (`src/app/page.tsx`) renders OpenUI's `<AgentInterface />` (the artifact chat interface with thread history), passing it an `llm` whose `streamProtocol` is `agUIAdapter()` from `@openuidev/react-ui`. Storage is optional — `AgentInterface` defaults to in-memory storage (wiped on reload) — so no `storage` prop is needed. The adapter parses the SSE stream into internal chat events that drive the UI.

To add more tools, define them with `createTool` in `src/tools.ts` and pass them to the `Agent`.

## Learn more

- [OpenUI documentation](https://openui.com/docs)
- [Mastra documentation](https://mastra.ai/docs)
- [AG-UI protocol](https://docs.ag-ui.com)

## Verify

```bash
pnpm verify
```
