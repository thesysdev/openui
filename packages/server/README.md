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

## Script execution

`executeScript` drives an execution engine until it completes, dispatching requested tools between steps. It does not depend on Chat Completions, OpenUI bundles, HTTP, or JSON serialization.

```ts
import { executeScript } from "@openuidev/server";

const result = await executeScript({
  signal: request.signal,
  execute: async ({ state, results }, signal) => {
    // Your adapter starts or resumes the engine and normalizes its response.
    const step = await engine.resume({ state, results, signal });
    if (step.complete) {
      return { status: "complete", result: step.value };
    }
    return {
      status: "tools",
      state: step.state,
      calls: step.tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        input: tool.input,
      })),
    };
  },
  callTool: async (name, input, signal) => {
    if (!Object.hasOwn(tools, name)) throw new Error(`Unknown tool: ${name}`);
    return tools[name](input, signal);
  },
});
```

The execution callback receives `{ results: [] }` initially. On continuation it receives the engine's opaque `state` and tool results as `{ id, result }` or `{ id, error }`. Inputs, results, and errors remain JavaScript values. State and the final result are generic types, so state can be an object, a token, or another engine-owned value. The adapter owns serialization, protocol mapping, credentials, and execution errors (throw to stop the loop).

The helper allows eight continuation rounds and sixteen tool calls, with a 60-second overall deadline (`timeoutMs` overrides it). Duplicate call IDs are rejected before dispatching a batch. Calls run sequentially.

Both callbacks receive a signal combining caller cancellation with the deadline. Forward it to cancellable work. Cancellation cannot undo completed side effects or force-stop callbacks that ignore the signal. The helper never aborts the caller's controller.

For OpenUI's stateless endpoint, keep the complete bundle, script name, and arguments in the adapter's closure. Map its `tool_calls` response into `{ status: "tools", state, calls }`, and map helper results back to its `tool_results` request. A different engine can use the same helper with its own adapter.
