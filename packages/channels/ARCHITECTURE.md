# Architecture

## Positioning: the payload layer, not the transport

Multichannel bot frameworks (Vercel's Chat SDK, Bot Framework, Botkit, ...) solve **transport**:
webhooks, auth, event routing, threads, delivery. Their message models are lowest-common-denominator
because hand-written UI must be write-once. This library solves the other half - **the payload**:
a per-platform component vocabulary at full native fidelity, the prompt that teaches an LLM to
compose in it, compilation to the platform's wire format, and the state/interaction semantics that
make the payload live. Generative UI removes the write-once pressure: the model regenerates the UI
per platform from that platform's own prompt, so full fidelity and multichannel are not in tension.

This library therefore never owns webhooks, tokens, or delivery - hosts bring any transport
(plain SDKs like Bolt, or a framework like Chat SDK) and wire it to the engine's `RenderResult`:
the payload plus the contract for interpreting responses to it.

openui-slack turns a natural-language request into an interactive Slack message. It is organized into
three layers plus a chart renderer:

| Layer | Files | Responsibility |
|-------|-------|----------------|
| Core (platform-agnostic) | `src/core/` — `engine.ts`, `walker.ts`, `store.ts`, `types.ts` | Parse OpenUI-lang, resolve state and queries, walk the tree via each component's render function; store interface |
| Shared UI contracts | `src/ui/` — `types.ts`, `charts.tsx` | Platform-neutral UI types (ChartSpec, FieldSpec, FormSpec) and the chart rasterizer |
| Slack library | `src/slack/` — `library.ts`, `modal.ts`, `payload.ts` | The Block Kit component vocabulary (schemas double as the prompt), modal building, payload normalizers |
| WhatsApp library | `src/whatsapp/` — `library.ts`, `payload.ts` | The Cloud API vocabulary, honest to the platform: ≤3-button cards, list menus, coalesced text, multi-message output, no editing (interactions send new messages) |
| Telegram library | `src/telegram/` — `library.ts`, `payload.ts` | Bot API 10.x Rich Messages: one card of typed blocks (headings, tables, quotes, checklists, expandable details, in-card charts) + inline keyboard, edited in place; 64-byte callback encoding |
| Teams library | `src/teams/` — `library.ts`, `payload.ts` | Adaptive Cards 1.5: native Table/FactSet/Columns, INLINE forms (Input.* + batched Action.Submit → applyInteraction patch), edited in place |
| Example host app | `examples/chat-sdk-bot/` + `examples/shared/` | Chat SDK transport (Slack socket mode + WhatsApp webhook), OpenUI Cloud Gateway calls with per-platform prompts, MCP connection, wiring engines + store |

The UI runtime - the OpenUI-lang parser, state store, expression evaluator, and action model - comes
from [`@openuidev/lang-core`](https://www.npmjs.com/package/@openuidev/lang-core). React is used only
in `charts.tsx`, to rasterize chart images.

## Pipeline

```
  @mention  or  reply in a bot thread
        │  (Socket Mode WebSocket)
        ▼
  llm.ts ── OpenUI Gateway(systemPrompt from library.prompt()) ──▶ openui-lang source
        ▼
  core/engine.ts (@openuidev/lang-core)
     parse ─▶ createStore(state) ─▶ evaluateElementProps ─▶ resolved ElementNode tree
        ▼
  core/walker.ts   dispatch each node to its component's render fn (src/slack/library.ts)
                        ├─ output:    Block Kit blocks (charts as native data_visualization)
                        ├─ actionMap: action_id → ActionPlan | bound $variable
                        ├─ charts:    ChartSpecs (for the image fallback / other transports)
                        └─ forms:     form id → FormSpec
        ▼
  host app      chat.postMessage placeholder ─▶ partial renders ─▶ debounced chat.update
                (the card builds up live) ─▶ final render ─▶ store {source, state}
        │
        └── button click ─▶ applyAction(source, state, action_id)
                 run @Set/@Reset ─▶ re-evaluate ─▶ re-walk ─▶ chat.update (in place)
```

## Request flow

1. An `@mention` (starting or joining a thread) or a message in one of the bot's threads arrives
   over the socket (the host app’s transport - Chat SDK in the example). Each thread is a conversation session (`shared/sessions.ts`).
2. `llm.ts` calls OpenUI Cloud Gateway (OpenAI-compatible) with the system prompt generated from the component library plus the
   thread's history (user turns and the openui-lang of earlier replies). The reply is OpenUI-lang
   source for a new card. On Slack the call streams **as Block Kit**: the host posts a placeholder
   message, and as source accumulates it renders the complete-lines prefix and `chat.update`s the
   message with the partial card (debounced to ~1/s), so the UI builds up block by block.
3. `engine.renderState` parses the source, seeds a state store from the program's `$` declarations,
   resolves every prop against that state (`evaluateElementProps`), and walks the resolved tree into
   Block Kit (`core/walker.ts` dispatching to `src/slack/library.ts` render functions).
4. When generation completes, the host runs the full render (live `Query()` data, chart uploads if
   any) and `chat.update`s the same message one last time, then saves `{ source, state }` by
   MessageRef. Charts ride along as native blocks; only downgraded ones are rasterized and uploaded.

## Interaction flow

1. A button click sends a `block_actions` event carrying the button's `action_id`.
2. The host app looks up the saved `{ source, state }` for that message.
3. `engine.applyInteraction` re-parses the source, restores the state, and applies one normalized
   interaction `{ actionId?, value?, patch? }`: `patch` (a batched submit's field values) merges into
   $state first, then `actionId` resolves to a button's `ActionPlan` (run its steps: `@Set` writes
   state, `@Reset` restores initial values), a bound input (set to `value`), or - by form id - a
   form's on-submit action. `applyAction` and `submitForm` are sugar over this primitive; the three
   shapes cover every target platform's event model (per-control events, button presses, and batched
   submits like Teams `Action.Submit` or WhatsApp Flow responses).
4. It re-renders from the mutated state and calls `chat.update` to edit the message in place. The new
   state snapshot is saved.

## Rendering

`core/walker.ts` walks the resolved `ElementNode` tree, dispatching each node to the render function
its component carries (defined in `src/slack/library.ts`). The walk collects side outputs:

- **`actionMap`** - `action_id → ActionPlan` (buttons) or bound `$variable` (inputs).
- **`charts`** - every chart's ChartSpec, recorded under its block id so transports can rasterize
  (the image-based platforms, and Slack's fallback path).
- **`forms`** - `form id → FormSpec`, turned into a modal when the form's trigger is clicked.

## Charts

On Slack, `Chart` renders to a native `data_visualization` block (`src/slack/charts.ts` maps a
ChartSpec onto the documented constraints: 50-char titles, 20-char de-duplicated labels, ≤20 points,
pie slices > 0 and ≤12). Slack allows at most 2 such blocks per message, so `finalize` downgrades
the 3rd+ chart to a placeholder image block; each chart's ChartSpec is still recorded in
`result.charts` under the block's id.

The image path remains for everything else: `src/ui/charts.tsx` renders
[recharts](https://recharts.org) at a fixed size to a static SVG (via `react-dom/server`), draws the
legend into the SVG, and converts it to PNG with
[`@resvg/resvg-js`](https://www.npmjs.com/package/@resvg/resvg-js). The Slack transport
(`examples/shared/slack-cards.ts`) uploads a PNG (unshared) for each placeholder block and swaps it
for a `slack_file` image block, retrying briefly while the fresh upload becomes referenceable; if a
workspace rejects native chart blocks (`invalid_blocks`), it downgrades them all to this path, and
as a last resort sends the card chart-less so the message always lands.

## Slack integration (`createSlackUI`)

`src/slack/ui.ts` is the high-level Slack API, built only from the public pieces below. One
instance owns the prompt, two engines (a real one with the tool provider, a quiet provider-less one
for previews), and the `MessageStore`. It exposes three operations, each over a duck-typed
`WebClient` and Slack's raw payloads, so it works with Bolt, Chat SDK, or anything else:

- `streamCard(client, { channel, thread_ts? }, textStream)` - posts a placeholder, streams previews
  (below), renders the finished program with the real engine, delivers it, and saves
  `{ source, state }` keyed by `{ platform: "slack", conversationId: channel, messageId: ts }`.
- `handleAction(client, block_actions)` - looks the card up by channel + message ts, then either
  opens a form's modal (`form:<id>` action ids, via `trigger_id`) or runs `applyInteraction`,
  delivers, and saves.
- `handleViewSubmission(client, view_submission)` - reads `{ channel, ts, formId }` from the modal's
  `private_metadata`, runs `submitForm` with the field values, delivers, and saves.

`tools: { specs, provider }` wires `Query()`/`Mutation()` into the prompt and the engine from one
option, so they can't drift apart. The default `deliver` is `chat.update` with chart placeholders
dropped; the reference bot overrides it to rasterize and upload them.

## Streaming (Slack)

Cards stream **as Block Kit**, not text: openui-lang is line-oriented and the engine renders
partial programs gracefully (a missing statement just renders nothing; a torn line is cut at the
last newline), so `createCardPreview` (`src/slack/stream.ts`) re-renders the complete-lines prefix
on each model delta and `chat.update`s the placeholder message with the growing card. Updates are debounced - 500ms by default, configurable
per call via `{ interval }` (chat.update is Tier 3, ~50/min; below ~400ms a long generation can hit
the limit). The Slack prompt asks the model to emit `root = Root([...])` first, then components in
display order, so blocks appear top-to-bottom as they are written.

Preview renders use a second engine created **without the tool provider** (and with `quiet: true`),
so `Query()` falls back to its declared defaults instead of hitting MCP on every tick, and
half-written programs don't spam parse warnings. Preview updates skip chart placeholders (no
uploads mid-stream), skip unchanged output, and swallow errors - they are pure best-effort. When
generation completes the real engine renders the finished source (live data, charts, saved state)
and replaces the preview in the same message; on a generation error the placeholder is deleted and
the error is reported in the thread.

## State model

An interactive message stores its OpenUI-lang `source` and current `$state` snapshot in a
caller-provided `MessageStore` keyed by MessageRef (`{platform, conversationId, messageId}`). Each
click re-parses the source, restores the snapshot, applies the action, and re-renders. The default
`MemoryStore` is an in-memory `Map`; the engine itself never stores anything.

## Tools (live data)

If `MCP_URL` is set, the example's `index.ts` connects to that MCP server (`mcp.ts`, bridged over stdio with
`npx mcp-remote`), registers it as the engine's tool provider, and rebuilds the system prompt with the
server's tools. When the model emits `Query("tool", args, defaults)`, the engine evaluates the args,
calls the tool, and exposes the result through `ctx.resolveRef`, so a component can reference it (e.g.
`Section("You have " + issues.total + " issues")`). A query falls back to its declared default if the
call fails or no server is connected. `renderState` and `applyAction` are async because of these calls.

## Component vocabulary

Defined in `src/slack/library.ts`; each entry's schema and description are compiled into the system
prompt, and each entry carries its own Block Kit render function.

| Component | Renders to | Notes |
|-----------|------------|-------|
| `Root([...])` | the message | required root; holds all children |
| `Header(text)` | header block | plain text, ≤150 chars |
| `Section(text, accessory?)` | section (mrkdwn) | Slack markdown; accessory: any control or `Image` |
| `Context(text, images?)` | context block | small muted text, optional inline icons |
| `Divider()` | divider | |
| `Fields([Field(label, value)])` | section with fields | key/value grid, ≤10 |
| `Image(url, alt)` | image block | public URL |
| `Video(url, title, thumbnailUrl, description?)` | video block | embeddable https URL |
| `Chart(type, labels, values, title?, series?, xLabel?, yLabel?)` | data_visualization block | `bar` / `line` / `pie` / `area`, native; ≤2/message, extras uploaded as images |
| `Markdown(text)` / `Table(headers, rows)` / `RichText([Para/List/Quote/Code])` | markdown / table / rich_text blocks | display content |
| `Actions([...controls])` | actions block | ≤25 controls |
| `Button(label, action?, style?, confirm?)` | button | `primary`/`danger`, optional confirm dialog |
| `LinkButton(label, url)` | button with `url` | opens a URL |
| `Select` / `MultiSelect` / `Radio` / `Checkboxes` / `Overflow` | option controls | bound to `$variables`; built from `Option(value, label)` |
| `DatePicker` / `TimePicker` / `DateTimePicker` | pickers | bound to `$variables` |
| `UserSelect` / `MultiUserSelect` / `ChannelSelect` / `MultiChannelSelect` / `ConversationSelect` / `MultiConversationSelect` | entity selects | Slack-native pickers; values are Slack ids |
| `TextBox(label, $var)` | input block in the message | submits on Enter (`dispatch_action`) |
| `Form(title, submit, fields, action?)` | trigger button → modal | fields: `TextInput`/`TextArea`/`NumberInput`/`EmailInput`/`URLInput`/`Select`/`MultiSelect`/`DatePicker`/`TimePicker`/`DateTimePicker` |

Intentionally not covered: `external_select`/`multi_external_select` (require a `block_suggestion`
options endpoint), `file_input` and `rich_text_input` (complex payloads), `workflow_button`, and the
`call`/`file` blocks (special integrations).

OpenUI-lang also provides built-ins: `$state` variables, actions (`Action([@Set(...), @Reset(...)])`),
and data helpers (`@Count`, `@Sum`, `@Avg`, `@Filter`, `@Each`).

## Project layout

```
src/
  core/               platform-agnostic library core
    engine.ts         createEngine(channel): renderState / applyInteraction (+ sugar)
    walker.ts         generic tree walk; dispatches to each component's render fn
    types.ts          machinery types (RenderResult, WalkCtx, ChannelLibrary, MessageStore...)
    store.ts          MemoryStore (default MessageStore implementation)
  ui/                 shared UI contracts (dependency-free types + chart rasterizer)
    types.ts          Block, ChartSpec, FieldSpec, FormSpec
    charts.tsx        recharts -> SVG -> PNG (axes, labels, legend)
  slack/              the Slack platform library
    library.ts        Block Kit component vocabulary + render fns + slackChannel + prompt
    charts.ts         ChartSpec -> native data_visualization block (caps, placeholder helpers)
    ui.ts             createSlackUI: prompt + engines + store; streamCard / handleAction / handleViewSubmission
    stream.ts         createCardPreview: live Block Kit streaming via debounced chat.update
    modal.ts          Form fields -> FieldSpec; FormSpec -> modal view
    payload.ts        block_actions / view_submission -> (actionId, value)
  whatsapp/           the WhatsApp platform library
    library.ts        Cloud API vocabulary (Card/Select/Text/Chart...) + whatsappChannel + prompt
    payload.ts        interactive reply id codec -> (actionId, value)
  teams/              the Teams platform library (Adaptive Cards 1.5)
    library.ts        AC vocabulary (Table/FactSet/Columns/inline Input.*) + teamsChannel + prompt
    payload.ts        Action.Submit payload -> { actionId, patch }
  dev/
    chartverify.ts    render sample charts for visual inspection (no tokens)
test/
  engine.test.ts      reactive loop, error fallback, defensive rendering, prompt invariants
  interaction.test.ts applyInteraction primitive: sugar equivalence, patch-then-plan ordering
  charts.test.ts      rasterizer sanity (PNG magic + size; pixels are eyeballed via npm run chart)
  golden.test.ts      golden regression: every sample program + interaction vs fixtures
  fixtures/           sample programs, scenario builder, golden.json (re-baseline: npm run golden)
examples/
  slack-bolt/         the README's Bolt bots: quickstart.ts (display only), full-workflow.ts (tools, actions, forms)
  chat-sdk-bot/       default host app: Chat SDK transport (multichannel-ready), native payloads
  shared/             llm.ts (OpenUI Gateway + history), mcp.ts, sessions.ts, slack-cards.ts (chart embedding)
```

## Extending

- **Add a component** - define it in `src/slack/library.ts` with `defineBlockComponent` (name, Zod
  props, description, and its own `render` function). No central switch to edit: the walker
  dispatches to each component's render function.
- **Add a chart type** - extend the `switch` in `src/ui/charts.tsx`; `Chart` accepts a free-form
  `type` string.
- **Swap the model** - set `OPENUI_MODEL` to any Gateway model id (`{provider}/{model}`); no code change.
- **Make state durable** - implement the two-method `MessageStore` interface (`src/core/types.ts`)
  over Redis and pass it to `createApp` instead of `MemoryStore`.
- **Add a platform** - build a sibling of `src/slack/`: a component library whose render functions
  emit that platform's native format, a `ChannelLibrary` envelope, and payload normalizers.
