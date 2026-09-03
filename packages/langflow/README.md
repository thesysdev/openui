# `@openuidev/langflow`

Server-side integration primitives for connecting an
[OpenUI](https://www.openui.com/) Agent Interface to a
[Langflow](https://github.com/langflow-ai/langflow) workflow.

The package uses Langflow's public Workflow API v2 and its native AG-UI stream:

```text
OpenUI AgentInterface
  -> your server route
  -> @openuidev/langflow
  -> POST Langflow /api/v2/workflows (stream_protocol: "agui")
  -> Langflow flow, model, tools, and session memory
  -> native AG-UI SSE
  -> OpenUI agUIAdapter(), parser, and renderer
```

Langflow owns the workflow graph, model calls, tools, and session memory. OpenUI
owns the chat shell, OpenUI Lang parser and renderer, streaming UI state, theme,
follow-ups, and form actions. The adapter maps the OpenUI `threadId` to Langflow's
`session_id` and turns the latest user/action turn into `input_value`.

## Install

```bash
npm install @openuidev/langflow @openuidev/react-ui
```

The package requires a Langflow server that exposes `POST /api/v2/workflows` and
supports `stream_protocol: "agui"`. It was tested with Langflow/LFX 1.11.4.

## Add a server route

`createLangflowStreamResponse` accepts and returns Web-standard request types, so
it works in Next.js, Remix, Hono, and other compatible server runtimes:

```ts
import { createLangflowStreamResponse } from "@openuidev/langflow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return createLangflowStreamResponse(request, {
    apiUrl: process.env.LANGFLOW_API_URL ?? "http://localhost:7860",
    apiKey: process.env.LANGFLOW_API_KEY,
    flowId: process.env.LANGFLOW_FLOW_ID!,
    debug: process.env.NODE_ENV !== "production",
  });
}
```

The route expects the standard body posted by OpenUI's `fetchLLM`, including
`{ threadId, messages }`. Credentials remain in the server route and are never
sent to the browser.

`threadId` is client input. In a multi-user application, authenticate the route
and use `prepareSessionId` to authorize or scope it before it reaches Langflow:

```ts
const user = await requireUser(request);

return createLangflowStreamResponse(request, {
  apiUrl: process.env.LANGFLOW_API_URL!,
  apiKey: process.env.LANGFLOW_API_KEY,
  flowId: process.env.LANGFLOW_FLOW_ID!,
  prepareSessionId: ({ threadId }) => `${user.id}:${threadId}`,
});
```

OpenUI follow-ups and form submissions encode a human-readable action plus action
context in the newest user message. The helper removes the transport markers and
preserves the action label and edited form state in Langflow's `input_value`.

Use `prepareInput` to add application context without trusting client fields as
Langflow configuration:

```ts
return createLangflowStreamResponse(request, {
  apiUrl: process.env.LANGFLOW_API_URL!,
  apiKey: process.env.LANGFLOW_API_KEY,
  flowId: process.env.LANGFLOW_FLOW_ID!,
  prepareInput: ({ inputValue, requestBody }) =>
    `[tenant=${String(requestBody.tenant)}] ${inputValue}`,
});
```

## Connect Agent Interface

Langflow already emits AG-UI, so use OpenUI's maintained `agUIAdapter()` directly:

```tsx
"use client";

import { AgentInterface, agUIAdapter, fetchLLM } from "@openuidev/react-ui";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: agUIAdapter(),
});

export function Chat() {
  return <AgentInterface llm={llm} />;
}
```

Keep `AgentInterface`'s theme provider enabled, and render with the same OpenUI
component library whose generated system prompt is attached to the Langflow
Agent component.

## Configure the Langflow flow

A minimal chat flow is:

```text
Chat Input -> Agent -> Chat Output
```

Set the Agent's system prompt to the prompt generated from the exact
`openuiChatLibrary` version rendered by the frontend. The flow must stream the
model's OpenUI Lang text rather than wrapping it in Markdown.

## Lower-level workflow API

Use `streamLangflowWorkflow` when the application already owns request parsing:

```ts
import { streamLangflowWorkflow } from "@openuidev/langflow";

const response = await streamLangflowWorkflow({
  apiUrl: "http://localhost:7860",
  apiKey: process.env.LANGFLOW_API_KEY,
  flowId: process.env.LANGFLOW_FLOW_ID!,
  inputValue: "Show quarterly revenue as a labeled bar chart",
  sessionId: "thread-123",
  signal: request.signal,
});
```

The helper fixes `mode` to `"stream"` and `stream_protocol` to `"agui"`. It also
supports Langflow `tweaks`, live-canvas `data`, uploaded `files`, and partial-run
component ids.

## API

- `createLangflowStreamResponse(request, options)` - complete Agent Interface to
  Langflow route helper.
- `streamLangflowWorkflow(options)` - lower-level Workflow API v2 streaming call.
- `toLangflowInput(messages)` - pure newest-turn and OpenUI action/form normalizer.
- `LangflowRequestError` - upstream HTTP failure with optional development detail.
- `CreateLangflowStreamResponseOptions`, `PrepareLangflowInputContext`,
  `PrepareLangflowSessionContext`, `StreamLangflowWorkflowOptions`, and
  `LangflowWorkflowOverrides` - exported TypeScript types.

See the
[`@openuidev/langflow` API reference](https://www.openui.com/docs/api-reference/langflow)
for the complete option and export reference.
