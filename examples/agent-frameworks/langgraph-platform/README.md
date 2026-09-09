# OpenUI + DeepAgents Chat

A generative-UI chat app where the responses are produced by a
[deepagents](https://www.npmjs.com/package/deepagents) agent and rendered live
with [OpenUI](https://openui.com).

The agent has mock **weather**, **finance**, and **research** tools.
`@openuidev/langchain` transforms its LangGraph protocol stream into AG-UI
events on a custom `openui` channel, so the browser can use OpenUI's AG-UI
stream adapter.

```
browser ──fetch /api/chat──▶ Next.js route ──protocol v2──▶ LangGraph server
   ▲                              │                          (deepagent + tools
   └────── SSE (AG-UI) ◀──────────┘                           + custom:openui)
        parsed by agUIAdapter()
```

## How it connects

| Piece             | File                        | Role                                                                                                                                                                             |
| ----------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend          | `src/app/page.tsx`          | `<AgentInterface llm={fetchLLM({ url: "/api/chat", streamAdapter: agUIAdapter() })}>` using the AG-UI stream protocol.                                                           |
| Proxy             | `src/app/api/chat/route.ts` | Uses `createLangChainStreamResponse` to convert AG-UI messages, start a protocol-v2 run, and relay `custom:openui` as AG-UI SSE. Keeps the API key + deployment URL server-side. |
| Graph             | `src/agent/agent.ts`        | `createDeepAgent` with the generated OpenUI system prompt, the mock tools, and `openUIStreamTransformer`.                                                                        |
| Integration       | `@openuidev/langchain`      | Maps LangGraph protocol `messages` and `tools` into AG-UI events, adds run lifecycle events, starts stateless runs, and relays `custom:openui`.                                  |
| Tools             | `src/agent/tools.ts`        | Mock `get_weather` / `get_stock_price` / `search_web` (no external keys needed).                                                                                                 |
| Component library | `src/library.ts`            | Re-exports `openuiLibrary`. `pnpm generate` writes `src/generated/spec.json`.                                                                    |

The shared integration package uses Web-standard requests, responses, fetch,
and streams. It does not depend on Next.js or DeepAgents.

The local server uses `@langchain/langgraph-cli` 1.4.x because the integration
requires agent-protocol-v2 `custom:*` and root `lifecycle` event channels.

## Getting started (local)

This example runs **two processes**: the LangGraph server (runs the model) and
the Next.js app (serves the UI). The default dev script starts both.

1. Create a `.env` from the template:

   ```bash
   cp .env.example .env
   ```

   ```env
   THESYS_API_KEY=sk-th-...
   LANGGRAPH_API_URL=http://localhost:2024
   LANGGRAPH_ASSISTANT_ID=agent
   ```

2. Start the LangGraph server and Next.js app together:

   ```bash
   pnpm dev
   ```

   This generates the OpenUI prompt once, starts the LangGraph server on
   `:2024`, and starts Next.js on `:3000`.

   If you prefer separate terminals, run:

   ```bash
   pnpm langgraph:dev
   # in another terminal
   pnpm exec next dev
   ```

Open [http://localhost:3000](http://localhost:3000) and try a starter such as
"Weather in Tokyo" or "AAPL stock price".

> `THESYS_API_KEY` is read by the **LangGraph server** (it runs the LLM), so it
> belongs in `.env` next to `langgraph.json`. The Next.js app only needs the
> `LANGGRAPH_*` variables. The example route enables detailed upstream errors
> outside production so a misconfigured graph id is visible during local setup.

## Using LangGraph Cloud / Platform

Deploy the graph (this folder already has a `langgraph.json`) and point the app
at the deployment instead of localhost — no app code changes:

```env
LANGGRAPH_API_URL=https://your-deployment.us.langgraph.app
LANGGRAPH_ASSISTANT_ID=agent        # graph name, or a created assistant id
LANGSMITH_API_KEY=lsv2-...          # auth for the deployment
```

`LANGSMITH_API_KEY` is sent as `x-api-key` from the server side only.
Restart `pnpm dev` after changing `.env`.

## Customizing

- **Change agent behavior:** update the deepagent prompt or tool list in
  `src/agent/agent.ts`.
- **Use real tools:** replace the mock bodies in `src/agent/tools.ts` with real
  API calls.
- **Change what the model can render:** edit `src/library.ts`, then re-run
  `pnpm generate` (the dev scripts do this for you).

## Learn more

- [OpenUI docs](https://openui.com/docs) and the [Agent Interface adapters guide](https://www.openui.com/docs/agent/reference/adapters-and-formats)
- [DeepAgents](https://www.npmjs.com/package/deepagents) and [LangGraph.js docs](https://langchain-ai.github.io/langgraphjs/)

## Verify

```bash
pnpm verify
```
