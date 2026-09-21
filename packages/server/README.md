# `@openuidev/server`

Server utilities for OpenUI & OpenUI Gateway.

## Autofix pipeline

Wrap Chat Completions or Vercel AI SDK streams with local OpenUI validation and hosted
Autofix. Select your SDK through the import path:

- `@openuidev/server/openai` exports `createAutofix` for Chat Completions.
- `@openuidev/server/vercel` exports `createAutofix` for AI SDK UI message streams.

Both expose the same methods and preserve their SDK's stream protocol. Tool calls,
refusals, reasoning, usage, and provider metadata pass through. For UI answers, the
wrapper appends the complete corrected program as ordinary text deltas before
finalizing the output. Configuration and result types are inferred; protocol
handling stays internal. The root `@openuidev/server` export contains the conversation
history helpers. Use the matching frontend stream adapter for the chosen SDK.

Streaming corrections require a frontend `lang-core` parser that preserves trailing
statement terminators so the final redefinition is applied.

### Configure once

```ts
import { createAutofix } from "@openuidev/server/openai";
import library from "./openui.spec.json";

const autofix = createAutofix({
  apiKey: process.env.THESYS_API_KEY!,
  library,
});
```

Use the spec produced by `openui generate --spec` for the same library used by
your renderer. Include the spec's `schema` for local validation. Keep the API key on the server.
Treat the library as immutable after configuration; the helper keeps its reference.

### Completed output

```ts
const result = await autofix.fix({ generation, messages, signal });

if (result.content !== null) {
  // already_valid or fixed: render/persist result.content.
} else {
  // fix_failed: choose your application's fallback.
  console.warn(result.unfixedErrors);
}
```

Valid output returns unchanged without making a network request. Invalid output
is sent to `POST /v1/autofix`. The API validates the repaired program; the wrapper
uses its returned status and diagnostics without parsing the repaired program again.
The Gateway owns its repair attempts; the wrapper makes one request. `messages`
is the conversation before the generated assistant message, which is appended
automatically. Only recent text context is sent, capped at 20 turns / 8,000 characters.

The helper returns `{ status, original, content, fixedErrors, unfixedErrors }`.
These fields map the API's content and `fix_summary`; the raw Chat Completion
envelope and repair usage are not returned.

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

  return autofix.stream({ stream: source, messages, signal: request.signal }).toResponse();
}
```

The response is SSE for the frontend `openAIAdapter()`, not the NDJSON consumed by
`openAIReadableStreamAdapter()`. Pass the SDK stream directly. The wrapper preserves
tool-call IDs, names, argument fragments, finish reasons, reasoning extensions,
usage trailers, and other metadata. It does not execute tools or manage the agent
loop, but it can wrap every model call in that loop.

Validation applies only to text that looks like OpenUI (an assignment statement
or an explicit OpenUI code fence), on a normal `stop`, with no tool call or refusal
in that choice. Tool turns, refusals, plain prose, truncated responses, and missing
stop markers pass through without correction. The wrapper uses a syntax heuristic to identify UI output;
`fix()` remains available when the caller explicitly knows a string is UI.

The wrapper accumulates the original text and validates it with `createParser()`
at completion. A separate server-side streaming parser is not required. The
frontend uses its streaming parser to render incoming text. Already-valid UI
finishes without an Autofix request.

State is tracked independently for each completion ID and choice index, so a
tool-call step cannot contaminate a subsequent UI answer. Original chunks are
unchanged except that a UI stop is deferred until validation/repair finishes.
Inserted corrections keep the completion ID, choice index, and model, and never
duplicate the original usage or logprobs.

The `/openai` helper accepts native Chat Completions chunks (`AsyncIterable<ChatCompletionChunk>`).
Pass the same abort signal to your provider and the wrapper.

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
  .stream({
    stream: toUIMessageStream({ stream: result.stream }),
    signal,
  })
  .toResponse();
```

Both subpaths expose the same `fix({ generation, messages, signal })` and
`stream({ stream, messages, signal })` methods. `generation` is a completed text
string: use `result.choices[0].message.content` for OpenAI or `result.text` for Vercel.

Use AI SDK 7's native UI message stream. `chunks` contains `UIMessageChunk` events;
`toResponse()` returns the UI message SSE protocol used by `useChat`, including
its protocol header and `[DONE]` marker. Raw text streams and `result.stream`
without `toUIMessageStream()` are not inputs to the Vercel helper.

Text deltas, reasoning, tools, sources, custom data, and metadata pass through.
The adapter holds text endings and step endings until the next step or the final
finish event. Only completed UI text in the final step, without tool events and
with `finishReason: "stop"`, is validated. Invalid UI triggers Autofix; the complete
corrected program is appended as a `text-delta` with the same text ID before its
`text-end`. Earlier steps, truncated output, errors, aborts, and streams without
a normal finish pass through without repair. Keep the default `sendFinish: true`.

Optional `messages` remains repair context in Chat Completions message format;
it does not accept AI SDK UI messages. AI SDK callbacks and result promises before
the wrapper contain the original generation; persist the wrapped output when you
need repairs in conversation history.

### How the corrected program reaches the renderer

Original text:

```text
root = Card([heading])
heading = UnknownComponent("Hello")
```

Additional text sent after repair:

```text
root = Card([heading])
heading = TextContent("Hello")
```

The parser uses the later completed definitions. Autofix returns a complete fixed
program; the wrapper appends that program with separating newlines, without
computing a statement diff. It defers the affected protocol completion events until repair finishes. Users see provisional output while generation and repair run;
there is no custom "repairing" event.

### Consume the stream

```ts
const output = autofix.stream({ stream: source, messages, signal });

for await (const chunk of output.chunks) {
  // Forward or accumulate native events, including tool calls and metadata.
}
```

Choose either `chunks` or `toResponse()` once. Streaming exposes no separate
result promise: consume the native events for final content and handle errors
where you consume the stream. For Chat Completions, accumulate deltas by completion ID
and choice index. For AI SDK UI messages, accumulate `text-delta` events by text ID
or use the SDK's UI message reader. Persist tool calls and other non-text content through your
existing conversation handling.

Use `.fix()` when you need a structured validation and repair result for a
completed program.

### Failures and limits

- An exhausted repair throws an error with `code: "fix_failed"`; its `result`
  contains the API's repair diagnostics. The HTTP stream errors and does not send
  a successful stop marker. Already delivered provisional text remains; the
  application chooses its error UI.
- HTTP, malformed response, generation, and cancellation failures fail the stream.
  There are no automatic network retries or paid repair retries.
- UI validation is capped at 100,000 characters per Chat Completions choice or AI SDK text block.
  Larger outputs pass through without validation. The wrapper consumes the source
  once, respects backpressure, and stops waiting when cancelled. Upstream
  cancellation also depends on your provider honoring the supplied signal.
- Appending the fixed program relies on parser statement redefinition. It cannot
  remove old statements or guarantee recovery from incomplete syntax, and replaying
  state or `Query`/`Mutation` declarations may have runtime effects. Use `fix()` and
  replace buffered output when the correction must replace the entire program.
- Whole-program validity is defined by the configured OpenUI parser/schema; it
  does not establish runtime or semantic correctness.

`apiBaseUrl` overrides the Gateway origin, and `fetch` supports custom transports
or local mocks. No live model call is needed to exercise the wrapper with a mock.

## Conversation history

```bash
npm install @openuidev/server
```

Persist a Chat Completions turn as Conversations API items. Chat Completions has no `conversation` + `store: true`. Use the master API key (Cloud rejects frontend tokens on create). Pass only the new turn — last user message plus the assembled assistant reply — not the client’s full `messages` array.

```ts
import { storeChatCompletionHistory } from "@openuidev/server";

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
import { chatCompletionMessagesToItems } from "@openuidev/server";

chatCompletionMessagesToItems([
  { role: "user", content: "hello" },
  { role: "assistant", content: "hi" },
]);
```
