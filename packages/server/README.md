# `@openuidev/server`

Server utilities for OpenUI & OpenUI Gateway.

**Links:** [Package docs](https://openui.com/docs/api-reference/server) | [Autofix API](https://openui.com/docs/gateway/api/autofix) | [GitHub repo](https://github.com/thesysdev/openui)

## Autofix

Prefer this package over calling the endpoint yourself. Import `createAutofix` from `@openuidev/server/openai` for Chat Completions or `@openuidev/server/vercel` for the Vercel AI SDK. Use the spec from `openui generate --spec` for the same library as your renderer. Keep the API key on the server.

### Configure once

```ts
import { createAutofix } from "@openuidev/server/openai";
import library from "./openui.spec.json";

export const autofix = createAutofix({
  apiKey: process.env.THESYS_API_KEY!,
  library,
});
```

### Fix a completed generation

```ts
import { autofix } from "./lib/autofix";

const result = await autofix.completions.fix({ generation, messages, signal });

if (result.status === "fix_failed") {
  console.warn(result.unfixedErrors);
} else {
  // Render or persist result.content.
}
```

`generation` is the completed OpenUI text. Optional `messages` is the conversation before that generation.

### Wrap a Chat Completions stream

```ts
import OpenAI from "openai";
import { autofix } from "../../../lib/autofix";

const model = new OpenAI();

export async function POST(request: Request) {
  const { messages } = await request.json();
  const source = await model.chat.completions.create(
    { model: "openai/gpt-5.5", messages, stream: true },
    { signal: request.signal },
  );

  return autofix.completions
    .stream({ stream: source, messages, signal: request.signal })
    .toResponse();
}
```

Return SSE for the frontend `openAIAdapter()`. `autofix.responses` is not supported yet.

### Wrap a Vercel AI SDK stream

```ts
import { convertToModelMessages, streamText, toUIMessageStream, type UIMessageChunk } from "ai";
import { createAutofix } from "@openuidev/server/vercel";
import library from "./openui.spec.json";

const autofix = createAutofix({
  apiKey: process.env.THESYS_API_KEY!,
  library,
});

export async function POST(request: Request) {
  const { messages } = await request.json();
  const result = streamText({
    model: "openai/gpt-5.5",
    system: systemPrompt, // Generated from the same OpenUI component library.
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
  });

  return autofix.ai
    .stream({
      stream: iterateUIMessageStream(toUIMessageStream({ stream: result.stream })),
      signal: request.signal,
    })
    .toResponse();
}

async function* iterateUIMessageStream(
  stream: ReadableStream<UIMessageChunk>,
): AsyncGenerator<UIMessageChunk> {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
```

Build the UI message stream with `toUIMessageStream({ stream: result.stream })`. It returns a `ReadableStream`, and `ai.stream()` takes an `AsyncIterable`, so iterate it with a helper like `iterateUIMessageStream`. `toResponse()` is the UI message SSE protocol read by `useChat` and `vercelAIAdapter()`.

### Consume the stream

Use either `chunks` or `toResponse()` once. `result` settles after that consumer finishes.

| Member         | Purpose                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| `chunks`       | Native SDK events, including any correction.                             |
| `toResponse()` | SSE `Response` for the matching frontend.                                |
| `result`       | Settled Autofix result. Persist `content` when present, not joined text. |

`result` is `null` when Autofix did not run. A failed repair throws with `code: "fix_failed"`. Use `fix()` on the same helper when you already have completed text.

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
