# `@openuidev/langchain`

Supported LangChain and LangGraph integration primitives for streaming OpenUI
generative interfaces over AG-UI.

The package connects three pieces:

1. A LangGraph stream transformer converts protocol-v2 `messages` and `tools`
   events to AG-UI events on the remote `custom:openui` channel.
2. A server helper starts a stateless LangGraph run, adds strict AG-UI run
   lifecycle events, and relays that channel as Server-Sent Events.
3. OpenUI's `agUIAdapter()` consumes the response without LangChain-specific
   frontend code.

The APIs use Web-standard `Request`, `Response`, `fetch`, and `ReadableStream`.
They do not depend on Next.js or DeepAgents.

## Install

```bash
npm install @openuidev/langchain
```

The server helpers communicate with LangGraph over HTTP and do not load the
LangGraph runtime. Install `@langchain/langgraph` only in applications that use
the agent-side transformer:

```bash
npm install @openuidev/langchain @langchain/langgraph
```

`@langchain/langgraph` is an optional peer dependency. The supported range is
declared in this package's `peerDependencies` so applications retain control of
their LangGraph version.

The server helpers require an agent-protocol-v2 server that supports both the
`custom:*` and root `lifecycle` event channels. The tested local-server baseline
is `@langchain/langgraph-cli` 1.4.x; older servers that reject the `lifecycle`
channel are not supported.

## Add the agent transformer

The transformer works with any agent that accepts LangGraph
`streamTransformers`. Here is the minimal DeepAgents setup:

```ts
import { openUIStreamTransformer } from "@openuidev/langchain/transformer";
import { createDeepAgent } from "deepagents";

export const graph = createDeepAgent({
  model: "openai:gpt-5.5",
  tools: [getWeather, getStockPrice, searchWeb],
  systemPrompt: SYSTEM_PROMPT,
  streamTransformers: [openUIStreamTransformer],
});
```

`openUIStreamTransformer()` converts assistant text, tool-call deltas, tool
results, and run errors into AG-UI events. LangGraph forwards those events
remotely under the `custom:openui` channel.

## Add a server route

`createLangChainStreamResponse` accepts any Web-standard `Request`, so it can be
returned directly from Next.js and other compatible route handlers:

```ts
import { createLangChainStreamResponse } from "@openuidev/langchain";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return createLangChainStreamResponse(request, {
    apiUrl: process.env.LANGGRAPH_API_URL ?? "http://localhost:2024",
    assistantId: process.env.LANGGRAPH_ASSISTANT_ID ?? "agent",
    apiKey: process.env.LANGSMITH_API_KEY,
    debug: process.env.NODE_ENV !== "production",
  });
}
```

Use `prepareInput` when the graph needs additional fields from the browser
request, such as a provider-managed conversation id or model selection:

```ts
return createLangChainStreamResponse(request, {
  apiUrl: process.env.LANGGRAPH_API_URL ?? "http://localhost:2024",
  assistantId: "agent",
  prepareInput: ({ messages, requestBody }) => ({
    messages: messages.slice(-1),
    conversationId: requestBody.threadId,
    model: requestBody.model,
  }),
});
```

The route expects a non-empty `{ messages: Message[] }` body in AG-UI format and
returns a JSON `400` response for malformed input. It converts text and
multimodal user content to LangChain messages. Complete assistant tool-call and
tool-result pairs are preserved; only incomplete calls and orphaned results are
removed before starting the stateless run.

Each call uses a temporary LangGraph thread and makes a bounded cleanup attempt
before closing a normally completed response. Pass `cleanupThread: false` when
the thread must remain available for local debugging. On serverless platforms,
pass the platform's `waitUntil`-style registration function through the
`waitUntil` option so cleanup can survive a client disconnect. Upstream response
bodies and registered graph ids are redacted from stream errors by default;
pass `debug: true` only in a trusted development environment to include them.

## Connect OpenUI

The route returns AG-UI SSE with `RUN_STARTED` and `RUN_FINISHED`/`RUN_ERROR`
lifecycle events, so the browser only needs OpenUI's AG-UI adapter:

```tsx
import { AgentInterface, agUIAdapter, fetchLLM } from "@openuidev/react-ui";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: agUIAdapter(),
});

export function Chat() {
  return <AgentInterface llm={llm} />;
}
```

## Lower-level streaming

Use `streamOpenUI` when a route needs to build the LangGraph input itself:

```ts
import { streamOpenUI } from "@openuidev/langchain";

const body = streamOpenUI({
  apiUrl: "http://localhost:2024",
  assistantId: "agent",
  input: { messages: [{ type: "human", content: "Hello" }] },
  signal: request.signal,
});

return new Response(body, {
  headers: { "Content-Type": "text/event-stream" },
});
```

Cancelling the returned stream or aborting the supplied signal aborts both
upstream LangGraph requests.

## API

- `openUIStreamTransformer()` from `@openuidev/langchain/transformer` —
  LangGraph stream-transformer factory that publishes message and tool events
  on `custom:openui`.
- `createLangChainStreamResponse(request, options)` — complete AG-UI request to
  LangGraph response path for stateless chat routes.
- `streamOpenUI(options)` — lower-level protocol-v2 runner and custom-channel
  relay.
- `CreateLangChainStreamResponseOptions`, `PrepareLangChainRunInputContext`,
  `StreamOpenUIOptions`, and `LangChainInputMessage` — exported TypeScript
  types.

See the repository's
[`examples/agent-frameworks/langgraph-platform`](https://github.com/thesysdev/openui/tree/main/examples/agent-frameworks/langgraph-platform)
for a complete local and LangGraph Platform example.
