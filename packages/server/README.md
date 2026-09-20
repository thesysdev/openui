# `@openuidev/server`

Server utilities for OpenUI & OpenUI Gateway.

## Autofix pipeline

Wrap Chat Completions or Responses streams with local OpenUI validation and hosted
Autofix. Chat Completions is the default; pass `responsesAdapter` for Responses
streams. Each adapter preserves the source protocol. Tool calls, refusals, reasoning, usage, and provider metadata
pass through. For UI answers, the wrapper appends the complete corrected program
as ordinary text deltas before finalizing the output.

The Autofix exports are `createAutofix`, `chatCompletionsAdapter`, and
`responsesAdapter`. Configuration and result types are inferred; the adapter
contract and other helpers stay internal. Use the matching frontend stream
adapter for the chosen protocol.

Streaming corrections require a frontend `lang-core` parser that preserves trailing
statement terminators so the final redefinition is applied.

### Configure once

```ts
import { createAutofix } from "@openuidev/server";
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
import { createAutofix } from "@openuidev/server";
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

  return autofix.stream({ source, messages, signal: request.signal }).toResponse();
}
```

The response is SSE for `openAIAdapter()`, not the NDJSON consumed by
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

With the default Chat Completions adapter, other providers can supply `AsyncIterable<string>`. That iterable must
throw on abnormal termination; normal EOF means the generation is complete.
Pass the same abort signal to your provider and the wrapper.

### Stream Responses

```ts
import { responsesAdapter } from "@openuidev/server";

const source = await model.responses.create(
  { model: "YOUR_MODEL", input, stream: true },
  { signal },
);
const output = autofix.stream({ source, adapter: responsesAdapter, signal });
return output.toResponse();
```

The source and returned `chunks` are native Responses events. `toResponse()`
uses named SSE events for `openAIResponsesAdapter()`; it does not convert to
Chat Completions or add a `[DONE]` marker. Optional `messages` is still repair
context in Chat Completions message format, not a Responses `input` array.

The adapter validates text from the completed message item, without maintaining
a second text buffer. Text completion events wait for the item's `completed` status;
unfinished items, failed responses, and refusals pass through without repair.
Tool and reasoning items remain separate from UI text and are never parsed as UI.

After a repair, the adapter appends a text delta and updates the text-done,
content-part-done, output-item-done, and final response snapshots to match the
accumulated text. Sequence numbers remain increasing after inserted or deferred
events. Original usage is preserved and does not include the separate Autofix
request. Provider-side stored responses remain unchanged; persist the wrapper's
output if you need the repaired content for subsequent turns.

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
const output = autofix.stream({ source, messages, signal });

for await (const chunk of output.chunks) {
  // Forward or accumulate native events, including tool calls and metadata.
}
```

Choose either `chunks` or `toResponse()` once. Streaming exposes no separate
result promise: consume the native events for final content and handle errors
where you consume the stream. For Responses, the final snapshots include any
appended corrections. For Chat Completions, accumulate deltas by completion ID
and choice index. Persist tool calls and other non-text content through your
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
- UI validation is capped at 100,000 characters per choice or Responses text part.
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
