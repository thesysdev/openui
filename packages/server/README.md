# `@openuidev/server`

Server utilities for OpenUI & OpenUI Gateway.

**Links:** [Package docs](https://openui.com/docs/api-reference/server) | [Autofix API](https://openui.com/docs/gateway/api/autofix) | [GitHub repo](https://github.com/thesysdev/openui)

## Autofix

Validate model output against your OpenUI library and repair invalid UI through the
hosted Autofix API. Import the helper that matches your SDK:

- `@openuidev/server/openai` — Chat Completions, plus conversation history helpers
- `@openuidev/server/vercel` — Vercel AI SDK UI message streams

Use `fix()` for completed text. For streams, use `chat.completions()` (OpenAI) or
`ai()` (Vercel). Pair each with the matching frontend stream adapter.

### Configure

```ts
import { createAutofix } from "@openuidev/server/openai";
import library from "./openui.spec.json";

const autofix = createAutofix({
  apiKey: process.env.THESYS_API_KEY!,
  library,
});
```

Use the spec from `openui generate --spec` for the same library as your renderer,
including its `schema`. Keep the API key on the server.

### Completed output

```ts
const result = await autofix.fix({ generation, messages, signal });

if (result.content !== null) {
  // already_valid or fixed
} else {
  // fix_failed — choose a fallback
  console.warn(result.unfixedErrors);
}
```

`generation` is the completed OpenUI text. Optional `messages` is the conversation
before that generation. Valid output is returned as-is; invalid output is sent to
`POST /v1/autofix`.

### Stream Chat Completions

```ts
import OpenAI from "openai";
import { createAutofix } from "@openuidev/server/openai";
import library from "./openui.spec.json";

const model = new OpenAI();
const autofix = createAutofix({
  apiKey: process.env.THESYS_API_KEY!,
  library,
});

export async function POST(request: Request) {
  const { messages } = await request.json();
  const source = await model.chat.completions.create(
    { model: "YOUR_MODEL", messages, stream: true },
    { signal: request.signal },
  );

  return autofix.chat
    .completions({ stream: source, messages, signal: request.signal })
    .toResponse();
}
```

Pass the native Chat Completions stream. Return SSE for the frontend `openAIAdapter()`.

### Stream with Vercel AI SDK 7

```ts
import { streamText, toUIMessageStream } from "ai";
import { createAutofix } from "@openuidev/server/vercel";
import library from "./openui.spec.json";

const autofix = createAutofix({
  apiKey: process.env.THESYS_API_KEY!,
  library,
});

const result = streamText({
  model: "openai/gpt-4.1-mini",
  system: systemPrompt, // Generated from the same OpenUI component library.
  prompt: "Show a greeting card",
  abortSignal: signal,
});

return autofix
  .ai({
    stream: toUIMessageStream({ stream: result.stream }),
    signal,
  })
  .toResponse();
```

Pass `toUIMessageStream({ stream: result.stream })`, not the raw `result.stream`.
`toResponse()` is the UI message SSE protocol used by `useChat`.

### Consume the stream

```ts
const output = autofix.chat.completions({ stream: source, messages, signal });

for await (const chunk of output.chunks) {
  // Native SDK events, including any appended correction
}
```

Use either `chunks` or `toResponse()` once. A failed repair throws with
`code: "fix_failed"`. Use `fix()` when you need a structured result instead of a
stream.

`apiBaseUrl` overrides the Gateway origin. `fetch` supports custom transports or mocks.

## Conversation history

Persist a Chat Completions turn as Conversations API items. Pass only the new turn —
last user message plus the assembled assistant reply — not the full `messages` array.
Use the master API key.

```ts
import { storeChatCompletionHistory } from "@openuidev/server/openai";

await storeChatCompletionHistory({
  apiKey: process.env.THESYS_API_KEY!,
  conversationId: threadId,
  messages: [
    { role: "user", content: lastUserText },
    { role: "assistant", content: assistantText },
  ],
});
```

Convert without posting:

```ts
import { chatCompletionMessagesToItems } from "@openuidev/server/openai";

chatCompletionMessagesToItems([
  { role: "user", content: "hello" },
  { role: "assistant", content: "hi" },
]);
```
