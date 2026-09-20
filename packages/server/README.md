# `@openuidev/server`

Server utilities for OpenUI & OpenUI Gateway.

## Autofix pipeline

Wrap your model's Chat Completions stream with local OpenUI validation and hosted
Autofix. Tool calls, refusals, usage, and provider metadata pass through. For UI
answers, the wrapper appends the complete corrected OpenUI program as ordinary
Chat Completions text deltas. An existing `openAIAdapter()` and OpenUI renderer
can consume the response; no replacement event or new frontend adapter is needed.

The only Autofix public export is `createAutofix`. Configuration,
input, and result types are inferred from these functions; helper types and the
error implementation are internal.

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

### Stream an OpenAI-compatible model

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
stop markers pass through without correction. These outcomes are reported as
`skipped`, not errors. The wrapper uses a syntax heuristic to identify UI output;
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

Other providers can supply `AsyncIterable<string>` directly. That iterable must
throw on abnormal termination; normal EOF means the generation is complete.
Pass the same abort signal to your provider and the wrapper.

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
computing a statement diff. It withholds the SSE stop marker and `[DONE]` until
repair finishes. Users see provisional output while generation and repair run;
there is no custom "repairing" event.

### Consuming and persisting the final result

```ts
const output = autofix.stream({ source, messages, signal });

for await (const chunk of output.chunks) {
  // Forward the complete chunk, including tool calls and metadata.
}

const outcomes = await output.result;
for (const outcome of outcomes) {
  if (outcome.status === "fixed" || outcome.status === "already_valid") {
    // Persist outcome.content: original text plus any appended corrected program.
    // outcome.id and outcome.index identify the completion and choice.
  }
}
```

Choose either `chunks` or `toResponse()` once. `result` returns an array of outcomes
and settles as that stream
is consumed; awaiting it before consumption does not start generation. With
`toResponse()`, observe `result` separately and use your server runtime's lifecycle
support if persistence must finish after the response. The outcome content matches
the accumulated stream. A `fixed` status describes validation of the corrected
program on its own; the concatenated program is not separately validated.
The result is not a reconstructed conversation; persist
tool calls and other non-text content from the preserved chunks using your existing logic.

### Failures and limits

- An exhausted repair includes an outcome with `status: "fix_failed"` and
  `content: null` in `result`; the chunk iterator throws an error. Read the structured
  diagnostics from that outcome.
  The HTTP stream errors and does not send a successful stop marker. Already
  delivered provisional text remains; the application chooses its error UI.
- HTTP, malformed response, generation, and cancellation failures reject `result`
  and fail the stream. There are no automatic network retries or paid repair retries.
- Text accumulation is capped at 100,000 characters per choice. Larger outputs
  still pass through unchanged and are reported as `skipped` / `too_large`, with
  `content: null` rather than a truncated copy. The wrapper consumes the source once,
  respects consumer backpressure, and stops waiting when cancelled. Upstream
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
