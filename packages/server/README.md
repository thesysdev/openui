# `@openuidev/server`

Server utilities for OpenUI & OpenUI Gateway.

**Links:** [Package docs](https://openui.com/docs/api-reference/server) | [Autofix API](https://openui.com/docs/gateway/api/autofix) | [GitHub repo](https://github.com/thesysdev/openui)

## Autofix

Prefer this package over calling the endpoint yourself. Create an `OpenUIClient` and call `openui.chat.createAutofix` for Chat Completions or `openui.ai.createAutofix` for the Vercel AI SDK. Use the spec from `openui generate --spec` for the same library as your renderer. Keep the API key on the server: the client reads `THESYS_API_KEY`.

### Configure once

```ts
import { OpenUIClient } from "@openuidev/server";
import library from "./openui.spec.json";

const openui = new OpenUIClient();

export const autofix = openui.chat.createAutofix({ library });
```

### Fix a completed generation

```ts
import { autofix } from "./lib/autofix";

const result = await autofix.fix({ generation, messages, signal });

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

  return autofix.stream({ stream: source, messages, signal: request.signal }).toResponse();
}
```

Return SSE for the frontend `openAIAdapter()`. `autofix.responses` is not supported yet.

### Wrap a Vercel AI SDK stream

```ts
import { streamText, toUIMessageStream } from "ai";
import { OpenUIClient } from "@openuidev/server";
import library from "./openui.spec.json";

const autofix = new OpenUIClient().ai.createAutofix({ library });

const result = streamText({
  model: "openai/gpt-5.5",
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

Pass `toUIMessageStream({ stream: result.stream })`. `toResponse()` is the UI message SSE protocol used by `useChat`.

### Consume the stream

Use either `chunks` or `toResponse()` once. `result` settles after that consumer finishes.

| Member         | Purpose                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| `chunks`       | Native SDK events, including any correction.                             |
| `toResponse()` | SSE `Response` for the matching frontend.                                |
| `result`       | Settled Autofix result. Persist `content` when present, not joined text. |

`result` is `null` when Autofix did not run. A failed repair throws with `code: "fix_failed"`. Use `fix()` on the same helper when you already have completed text.

Pass `baseUrl` or `fetch` to `new OpenUIClient()` to change the Gateway origin or the transport. Failures throw `AutofixError` with a `code`.

## Conversation history

Store each turn in an OpenUI Cloud conversation, and read the thread back for the next
request, in your SDK's messages. Use the API key on your server. Calls go by id, as your
org, so check a thread id from the browser is the signed-in user's first.

```ts
import { OpenUIClient } from "@openuidev/server";

const openui = new OpenUIClient(); // reads THESYS_API_KEY

// A thread id from the browser isn't proof: check it's the signed-in user's.
const conversation = await openui.conversations.get(threadId);
if (conversation.userId !== userId) throw new Error("Not found");

// The thread so far, oldest first, as Chat Completions messages.
const history = await openui.chat.conversations.items.list(threadId);

// Store only the new turn: earlier messages are already there.
await openui.chat.conversations.items.create(threadId, [
  { role: "user", content: lastUserText },
  { role: "assistant", content: assistantText },
]);
```

`create({ title }, { userId })` names the owner, so their frontend token can read the
conversation too, and `list({ userId })` lists only theirs.

`items.create` resolves with the turn as stored, in the same messages. `openui.langgraph.conversations`
does the same with LangChain messages: `items.create` takes `BaseMessage`s or the plain messages it
returns, and both `items.create` and `items.list` return `{ role, content }` messages that
`graph.invoke({ messages })` takes. Their conversation calls (`list`, `create`, `get`, `update`,
`delete`) are `openui.conversations`' own.

System and developer messages are skipped. A tool call is stored only together with its
result, so a turn stopped mid tool call leaves the thread valid for the next request.
Types come from the optional `openai` and `@langchain/core` peers: install the one you use.

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
