# `@openuidev/server`

A configured server client for OpenUI Gateway Autofix and conversation persistence.

**Links:** [Package docs](https://openui.com/docs/api-reference/server) | [Autofix API](https://openui.com/docs/gateway/api/autofix) | [GitHub repo](https://github.com/thesysdev/openui)

## Configure once

```ts
import { createServerClient } from "@openuidev/server/openai";

export const openui = createServerClient();
```

Reads `process.env.THESYS_API_KEY`. Keep the key on the server. Explicit options override the environment:

```ts
const openui = createServerClient({
  apiKey: "your-server-key",
  apiBaseUrl: "https://api.thesys.dev", // Origin, without /v1.
  fetch: customFetch,
});
```

A missing or empty key throws `ServerClientError` with `code: "missing_api_key"` when the client is created. Each operation receives its own library, conversation, and cancellation signal; these are not shared between requests.

| Import                        | Capabilities                                                               |
| ----------------------------- | -------------------------------------------------------------------------- |
| `@openuidev/server/openai`    | `autofix.completions`, `autofix.responses`, `conversations.appendMessages` |
| `@openuidev/server/vercel`    | `autofix.ai`, `autofix.eve`, `conversations.appendMessages`                |
| `@openuidev/server/langchain` | `autofix.langgraph`, `conversations.appendMessages`                        |

## Autofix

Use the spec from `openui generate --spec` for the same library as your renderer. Supply the spec, including its `schema`, per operation.

### Fix completed output

```ts
import library from "./openui.spec.json";
import { openui } from "./server";

const result = await openui.autofix.completions.fix({
  library,
  generation,
  messages,
  signal,
});

if (result.status === "fix_failed") {
  console.warn(result.unfixedErrors);
} else {
  // Render or persist result.content.
}
```

The statuses are `already_valid`, `fixed`, and `fix_failed`. `content` is `null` on repair failure. Optional `messages` supplies repair context in Chat Completions format, before the generated assistant message. `ai.fix` use the same completed-text repair contract.

### Chat Completions stream

```ts
const source = await model.chat.completions.create(
  { model: "gpt-5.5", messages, stream: true },
  { signal: request.signal },
);

return openui.autofix.completions
  .stream({ library, stream: source, messages, signal: request.signal })
  .toResponse();
```

Returns SSE for the frontend `openAIAdapter()`.

### Vercel AI SDK stream

```ts
import { streamText, toUIMessageStream } from "ai";
import { createServerClient } from "@openuidev/server/vercel";

const openui = createServerClient();
const result = streamText({
  model: "openai/gpt-5.5",
  system: systemPrompt,
  prompt: "Show a greeting card",
  abortSignal: signal,
});

return openui.autofix.ai
  .stream({
    library,
    stream: toUIMessageStream({ stream: result.stream }),
    signal,
  })
  .toResponse();
```

Pass AI SDK UI message events, not the raw model event stream. `toResponse()` uses the UI message SSE protocol consumed by `useChat`.

### Consume once

| Member         | Purpose                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| `chunks`       | Native SDK events, including any correction.                                    |
| `toResponse()` | SSE `Response` for the selected protocol.                                       |
| `result`       | Autofix result after consumption, or `null` when repair validation did not run. |

Use either `chunks` or `toResponse()` once. `result` settles after that consumer finishes. Persist `result.content` when present, rather than joined deltas. A failed streamed repair throws `AutofixError` with `code: "fix_failed"` and repair diagnostics.

### Responses, LangGraph, and Eve streams

```ts
// @openuidev/server/openai
openui.autofix.responses.stream({ library, stream: responseEvents, signal });

// @openuidev/server/langchain
openui.autofix.langgraph.stream({ library, stream: graphEvents, signal });

// @openuidev/server/vercel
openui.autofix.eve.stream({ library, stream: eveEvents, signal });
```

Use `.toResponse()` to forward the selected protocol: Responses SSE, named LangGraph SSE, or Eve NDJSON. Streams accept an `AsyncIterable` or `ReadableStream`. Pair Responses with `openAIResponsesAdapter()` and LangGraph with `langGraphAdapter()` on the frontend. Repair runs at successful final text boundaries; tool-bearing, failed, or interrupted turns pass through. Each adapter also exposes `.fix()` for completed text with the same repair contract.

## Conversation persistence

`appendMessages` accepts the native history format for each client. Completions is the OpenAI default; set `format: "responses"` for Responses input/output items. Vercel accepts completed AI SDK `UIMessage[]`; LangChain accepts serialized LangGraph SDK `Message[]`.

Text, user images/files, and function calls/results become Conversations API items in their original order. System/developer instructions are skipped. An unsupported message or incomplete UI part throws `ServerClientError` with `code: "unsupported_message"` before writing any items. Vercel `step-start` and application `data-*` parts are metadata and are skipped; reasoning summaries are stored. LangGraph removal directives and legacy function messages are rejected.

```ts
await openui.conversations.appendMessages({
  conversationId: threadId,
  messages: [
    { role: "user", content: lastUserText },
    { role: "assistant", content: correctedAssistantText },
  ],
  signal,
});
```

```ts
// OpenAI Responses client: append native response.output or input items.
await openui.conversations.appendMessages({
  conversationId: threadId,
  format: "responses",
  messages: response.output,
  signal,
});

// Vercel or LangChain clients: their native completed messages.
await openui.conversations.appendMessages({ conversationId: threadId, messages, signal });
```

The conversation must already exist. Append only the new turn, not the full conversation replay, or items will be duplicated. Writes are not retried automatically. If Responses generation already uses `conversation` and `store: true`, do not append that same turn again.

## Migration

`createAutofix`, `storeChatCompletionHistory`, and `chatCompletionMessagesToItems` remain available and are marked deprecated. Existing published examples can continue using them until they move to a client-capable package release.

- Replace `createAutofix({ apiKey, library })` with `createServerClient({ apiKey })`. Add `library` to each `fix` or `stream` call and use `openui.autofix.completions` or `openui.autofix.ai`.
- Replace `storeChatCompletionHistory({ apiKey, conversationId, messages })` with `openui.conversations.appendMessages({ conversationId, messages })`.

`ServerClientError` exposes `code` and optional HTTP `status`. Autofix keeps its existing `AutofixError` and domain results. Both error types and the client/input types are exported from the relevant entry points.
