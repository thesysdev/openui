# @openuidev/channels

> Generative UI for chat platforms — natively-rendered, interactive messages for Slack, Microsoft Teams, Telegram, and WhatsApp.

[![npm version](https://img.shields.io/npm/v/%40openuidev%2Fchannels.svg)](https://www.npmjs.com/package/@openuidev/channels)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)

Ask in plain English; the bot answers with a **native, interactive card** — field grids, buttons
that actually do things, live charts — instead of a wall of markdown. On Slack the card **streams
as Block Kit** while the model writes it, and clicking a button updates it **in place**, with no
model call per click.

```
@openui-agent  a bar chart of tasks by status: 5 todo, 3 in progress, 8 done
   ↳ (in the thread)  now show only todo and done, as a pie chart
   ↳ (in the thread)  a form to add a new task
```

## Installation

```bash
npm install @openuidev/channels ai @ai-sdk/openai-compatible
```

The examples call the model through [OpenUI Cloud Gateway](https://www.openui.com/docs/gateway) with
the [AI SDK](https://ai-sdk.dev). Create a key with `npx @openuidev/cli@latest generate-api-key` and
keep it server-side as `THESYS_API_KEY`.

## Quickstart

A Slack bot that answers every mention with a streamed card ([Bolt](https://tools.slack.dev/bolt-js),
Socket Mode):

```ts
import { App } from "@slack/bolt";
import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createSlackUI } from "@openuidev/channels/slack";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});
const gateway = createOpenAICompatible({
  name: "openui",
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});
const ui = createSlackUI();

app.event("app_mention", async ({ event, client }) => {
  const { textStream } = streamText({
    model: gateway("openai/gpt-5.5"),
    system: ui.prompt,
    prompt: event.text,
  });
  await ui.streamCard(client, { channel: event.channel, thread_ts: event.ts }, textStream);
});

await app.start();
```

`streamCard` posts a placeholder in the thread, updates it with the partial card as the model
writes, and swaps in the finished card. That's the whole bot — but its buttons don't do anything
yet. For that, read on.

## How it works

The model replies with a program. Here is one that uses everything — state, actions, a query, and
a mutation:

```
root = Root([header, summary, filters, newIssue])
$state = "open"
$title = ""
issues = Query("list_issues", { state: $state }, { total: 0 })
create = Mutation("create_issue", { title: $title })
header = Header("Issues")
summary = Section("You have *" + issues.total + "* " + $state + " issues")
filters = Actions([Button("Open", Action([@Set($state, "open")])), Button("Closed", Action([@Set($state, "closed")]))])
newIssue = Form("New issue", "Create", [TextInput("Title", $title)], Action([@Run(create), @Reset($title)]))
```

**Actions and state.** `$variables` are the card's state. Buttons carry actions — `@Set` writes a
variable, `@Reset` restores its initial value, `@Run` executes a mutation — and inputs (selects,
date pickers, text boxes, form fields) are bound to variables directly. When a user clicks, the
library re-runs the *same program* against the updated state and edits the card in place. The
model is not called again: interactions are deterministic and instant. To make that possible, the
program and its current state are saved per message in a `MessageStore` you control.

**Queries and mutations.** `Query()` and `Mutation()` call **your tools** — plain functions, or
any MCP server. The library runs them, not the model:

- `Query(tool, args, defaults)` runs every time the card renders: when it is first posted and after
  every interaction. Change `$state` above and `list_issues` runs again with the new filter. If no
  tools are configured or a call fails, the query evaluates to its `defaults`, so the card always
  renders.
- `Mutation(tool, args)` runs only when an action triggers it with `@Run`, e.g. a button or a
  form's submit. The card re-renders afterwards, so queries pick up the change.

Tools are opt-in. Without them, the prompt doesn't mention `Query`/`Mutation` and cards are pure
UI + state, which is all most bots need.

## Full workflow

Interactive cards backed by real data: tools for `Query`/`Mutation`, button and input handling,
form modals, and a thread conversation that remembers earlier turns.

```ts
import { App } from "@slack/bolt";
import { streamText, type ModelMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { MemoryStore } from "@openuidev/channels";
import { createSlackUI } from "@openuidev/channels/slack";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});
const gateway = createOpenAICompatible({
  name: "openui",
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

// 1. Tools: what Query() and Mutation() can call. Any MCP server works the same way -
//    map its listTools() to `specs` and callTool() to `provider`.
const issues = [{ title: "Fix login", state: "open" }];
const tools = {
  specs: [
    {
      name: "list_issues",
      description: "Count issues in a given state",
      inputSchema: { type: "object", properties: { state: { type: "string", enum: ["open", "closed"] } } },
      outputSchema: { type: "object", properties: { total: { type: "number" } } },
    },
    {
      name: "create_issue",
      description: "Create an open issue",
      inputSchema: { type: "object", properties: { title: { type: "string" } }, required: ["title"] },
    },
  ],
  provider: {
    async callTool(name: string, args: any) {
      if (name === "list_issues") return { total: issues.filter((i) => i.state === (args.state ?? "open")).length };
      if (name === "create_issue") {
        issues.push({ title: String(args.title), state: "open" });
        return { ok: true };
      }
      throw new Error(`unknown tool: ${name}`);
    },
  },
};

// 2. One UI instance: prompt, rendering, and the per-message state store.
//    MemoryStore is fine for development; implement MessageStore ({ get, save })
//    over Redis or a database so buttons keep working across restarts.
const ui = createSlackUI({ tools, store: new MemoryStore() });

// 3. Conversation: each thread keeps its history, and earlier cards go back to
//    the model as the programs they were generated from.
const threads = new Map<string, ModelMessage[]>();

app.event("app_mention", async ({ event, client }) => {
  const threadTs = event.thread_ts ?? event.ts;
  const history = threads.get(threadTs) ?? [];
  history.push({ role: "user", content: event.text });

  const { textStream } = streamText({
    model: gateway("openai/gpt-5.5"),
    system: ui.prompt,
    messages: history,
  });
  const card = await ui.streamCard(client, { channel: event.channel, thread_ts: threadTs }, textStream);

  history.push({ role: "assistant", content: card.source });
  threads.set(threadTs, history);
});

// 4. Interactions: clicks and input changes re-render the card in place;
//    form buttons open a modal, and submitting it runs the form's action.
app.action(/.*/, async ({ ack, body, client }) => {
  await ack();
  await ui.handleAction(client, body);
});

app.view("openui_form", async ({ ack, body, client }) => {
  await ack();
  await ui.handleViewSubmission(client, body);
});

await app.start();
```

Ask it for "a dashboard of my issues with open/closed filters and a form to file a new one" and
the model writes a program like the one in [How it works](#how-it-works): the filters re-run
`list_issues`, and the form calls `create_issue`, then the count updates.

While a card streams, queries show their defaults; they run once the program is complete.

### With Vercel's Chat SDK

[Chat SDK](https://vercel.com/chat) handles transport instead of Bolt. Its Slack adapter exposes
the same `WebClient`, and `event.raw` is the same Slack payload, so only the handler wiring
changes:

```ts
import { Chat } from "chat";
import { createSlackAdapter } from "@chat-adapter/slack";

const slack = createSlackAdapter({ mode: "socket" }); // reads SLACK_BOT_TOKEN / SLACK_APP_TOKEN
const chat = new Chat({ userName: "openui-agent", adapters: { slack } });

chat.onNewMention(async (thread, message) => {
  await thread.subscribe();
  const { channel, threadTs } = slack.decodeThreadId(thread.id);
  const { textStream } = streamText({ model: gateway("openai/gpt-5.5"), system: ui.prompt, prompt: message.text });
  await ui.streamCard(slack.client, { channel, thread_ts: threadTs }, textStream);
});

chat.onAction((event) => ui.handleAction(slack.client, event.raw));
chat.onModalSubmit("openui_form", (event) => ui.handleViewSubmission(slack.client, event.raw));

await chat.initialize();
```

## Platforms

`@openuidev/channels` is the payload layer: it never owns webhooks or tokens, so it works with any
transport — Bolt, Vercel's Chat SDK, Bot Framework, or raw HTTP.

| Subpath | Platform | Renders to | Highlights |
|---|---|---|---|
| `/slack` | Slack | Block Kit | Native charts, Block Kit streaming, modals, entity selects, edit-in-place |
| `/teams` | Microsoft Teams | Adaptive Cards 1.5 | Native tables/FactSets/columns, inline forms, edit-in-place |
| `/telegram` | Telegram | Bot API Rich Messages | Tables, checklists, in-card charts, inline keyboard, edit-in-place |
| `/whatsapp` | WhatsApp Cloud API | Interactive messages | Button cards, list menus, chart images |

## API

### `createSlackUI(options?)`

| Option | Default | |
|---|---|---|
| `tools` | none | `{ specs, provider }` — enables `Query()`/`Mutation()` in both the prompt and the renderer |
| `store` | `new MemoryStore()` | Where each card's program and state are saved (`MessageStore`: `get`, `save`) |
| `interval` | `500` | Minimum ms between streamed preview updates (`chat.update` is Tier 3, ~50/min) |
| `rules` | none | Extra lines appended to the system prompt (house style, tool conventions) |
| `deliver` | `chat.update` | `({ client, channel, ts, result }) => Promise<void>` — replaces how a finished card is written, e.g. to upload charts as images |

Returns:

| Member | |
|---|---|
| `prompt` | The system prompt for the model |
| `streamCard(client, { channel, thread_ts? }, textStream)` | Posts and streams a card; resolves to `{ ts, source, output, state }` |
| `handleAction(client, payload)` | Handles a raw `block_actions` payload |
| `handleViewSubmission(client, payload)` | Handles a raw `view_submission` payload from a form modal |

`client` is any Slack `WebClient` (Bolt's `client`, Chat SDK's `slack.client`, or
`new WebClient(token)`); `textStream` is any `AsyncIterable<string>` of text deltas. Form modals
use the callback id `"openui_form"`, also exported as `FORM_CALLBACK_ID`.

### Lower level

`createSlackUI` is built from public pieces you can use directly for full control — your own
storage layout, delivery, or a different platform:

```ts
import { createEngine } from "@openuidev/channels";
import { slackChannel, buildSystemPrompt, createCardPreview } from "@openuidev/channels/slack";

const engine = createEngine(slackChannel, { toolProvider });
const result = await engine.renderState(source);                    // program -> Block Kit + state
const next = await engine.applyInteraction(source, result.state, {   // a click -> re-render
  actionId, value,
});
```

The Teams, Telegram, and WhatsApp subpaths export the same `*Channel` + `buildSystemPrompt` pair
for `createEngine`.

## Charts

The model emits `Chart(type, labels, values, title?, series?, xLabel?, yLabel?)` with `bar`,
`line`, `pie`, or `area`. Slack renders them natively as interactive `data_visualization` blocks
(up to 2 per message). Teams, Telegram, and WhatsApp receive PNGs from the opt-in rasterizer at
`@openuidev/channels/ui/charts`, which needs the optional peer dependencies `react`, `react-dom`,
`recharts`, and `@resvg/resvg-js`.

## Development

From the monorepo root, `pnpm --filter @openuidev/channels <script>`:

```bash
pnpm test         # engine, interaction, chart, streaming, golden-fixture, and schema tests (offline)
pnpm run golden   # re-baseline src/__tests__/fixtures/golden.json after an intended output change
pnpm run build    # tsdown -> dist (ESM + CJS + d.ts)
pnpm run ci       # lint, format, test, and test typecheck
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the layers, rendering pipeline, and state model.

## License

[MIT](LICENSE)
