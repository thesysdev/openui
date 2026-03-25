# mastra-chat

An [OpenUI](https://openui.com) example showing how to wire a [Mastra](https://mastra.ai) agent backend to OpenUI's generative UI frontend.

## What this demonstrates

- Using `mastraAdapter` as the `streamProtocol` on OpenUI's `ChatProvider`
- Using `mastraMessageFormat` to keep the chat history compatible with Mastra's expected message shape
- A real Mastra `Agent` with `createTool` tools (weather and stock price) running in a Next.js API route

## Getting started

1. Copy the example environment file and add your OpenAI key:

```bash
cp .env.example .env.local
# then edit .env.local and set OPENAI_API_KEY=sk-...
```

2. Install dependencies from the monorepo root:

```bash
pnpm install
```

3. Run the dev server from this directory:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the chat interface.

## How it works

The frontend (`src/app/page.tsx`) passes `streamProtocol={mastraAdapter()}` and `mastraMessageFormat` to `<FullScreen />`. Mastra handles the agentic loop (including multi-step tool calls) on the server, and the adapter converts the AI SDK SSE stream into OpenUI's internal event format.

To add more tools, define them with `createTool` in `src/app/api/chat/route.ts` and pass them to the `Agent`.

## Learn more

- [OpenUI documentation](https://openui.com/docs)
- [Mastra documentation](https://mastra.ai/docs)
