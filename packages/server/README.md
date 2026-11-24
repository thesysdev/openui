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
    { model: "gpt-5.5", messages, stream: true },
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
import { streamText, toUIMessageStream } from "ai";
import { createAutofix } from "@openuidev/server/vercel";
import library from "./openui.spec.json";

const autofix = createAutofix({
  apiKey: process.env.THESYS_API_KEY!,
  library,
});

const result = streamText({
  model: "openai/gpt-5.5",
  system: systemPrompt, // Generated from the same OpenUI component library.
  prompt: "Show a greeting card",
  abortSignal: signal,
});

return autofix.ai
  .stream({
    stream: toUIMessageStream({ stream: result.stream }),
    signal,
  })
  .toResponse();
```

Pass `toUIMessageStream({ stream: result.stream })`. `toResponse()` is the UI message SSE protocol used by `useChat`.

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

A tool call is stored only together with its result, in the tool messages right after
it. A turn stopped mid tool call is saved without that call, so the thread stays valid
for the next request.

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

### LangGraph

Import `storeLangGraphHistory` from `@openuidev/server/langgraph`. Pass completed
`BaseMessage` instances from `@langchain/core/messages`, the message types used
by LangGraph. This entry point requires the optional `@langchain/core` peer
dependency; other server entry points do not.

```ts
import { storeLangGraphHistory } from "@openuidev/server/langgraph";

await storeLangGraphHistory({
  apiKey: process.env.THESYS_API_KEY!,
  conversationId: threadId,
  messages: newTurnMessages,
});
```

Store only the new turn, including tool calls and results. Passing the full
replayed history or individual streaming chunks creates duplicate items.
The conversation must already exist. System/developer instructions are skipped;
text and user `image_url` blocks are supported. Use `langGraphMessagesToItems`
for conversion without a network request. `apiBaseUrl` and `fetch` work as in
`storeChatCompletionHistory`; storage failures reject the returned promise.

## Showing a dashboard while it builds

`dashboards.create` and `dashboards.edit` resolve after the model's tool rounds, when the
dashboard starts generating: typically 20-45 s, while the model calls your data tools and checks
its scripts. If your agent framework streams tool output, pass `{ stream: true }` to get two
messages instead of one: "Started…" right away, as soon as the dashboard has an id, so the
renderer can show it building, and a last one once it is saved or failed ("Created…",
"Edited…" or "Couldn't…"). Each carries the dashboard's reference, so give each to the
renderer; the last is what your model should read.

```ts
// For example, an AI SDK tool whose execute streams its output.
async *execute({ title, prompt }) {
  for await (const message of dashboards.create({ title, prompt }, { userId }, { stream: true })) {
    yield message;
  }
}
```

`{ stream: true }` is how you learn that a build failed. A plain `edit` returns once the edit
starts and won't report a later failure.

Both forms need a route timeout long enough for the tool rounds, and with `stream: true` the
call lasts until the dashboard is saved, often a minute or more. On serverless hosts, set it (for
example `export const maxDuration = 300` on Vercel).

The model may call your data tools for up to 20 rounds before it must write the dashboard. Set
`maxToolRounds` in `defineDashboard` to change that. With `0` the model calls none of your tools
directly; it still saves and runs its data scripts, which call them.
