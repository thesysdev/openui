# Multi-Agent Chat Example

A multi-agent chatbot built with the [Vercel AI SDK](https://ai-sdk.dev/) and [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview). A main orchestrator agent handles user requests and delegates visual tasks — dashboards, charts, tables, forms — to a specialized **analytics sub-agent** that generates interactive React components via OpenUI in real time.

Features: multi-agent tool delegation, streaming OpenUI rendering, persistent conversation threads (localStorage), collapsible sidebar, and automatic light/dark theme support.

---

## How It Works

The main agent receives user messages and decides how to respond. For conversational requests it replies in plain text. For anything visual — a chart, table, form, dashboard — it delegates to the `analytics_subagent` tool.

The analytics sub-agent runs as an **async generator tool** that streams its output progressively:

1. The main agent calls `analytics_subagent` with a task description.
2. The sub-agent calls `streamText` with its own system prompt (generated from the OpenUI component library) and streams back OpenUI Lang markup chunk by chunk.
3. Each chunk is yielded as `{ openuiSpec, complete: false }` until the stream finishes, then a final `{ openuiSpec, complete: true }`.
4. On the client, `<Renderer />` from `@openuidev/react-lang` parses the streamed markup and renders live React components as tokens arrive.

```
Card([
  CardHeader(title="Monthly Revenue"),
  BarChart(data=[...], title="Jan–Jun 2025")
])
```

The Vercel AI SDK handles the streaming transport on both ends:

- **Backend**: `streamText` calls the LLM, executes tools (including the sub-agent generator), and streams the response via `toUIMessageStreamResponse()`.
- **Frontend**: `useChat` manages message state. `<AssistantMessage />` detects tool parts, and when the `analytics_subagent` output is available, it renders the OpenUI spec through `<Renderer />`.

---

## Architecture

```
┌──────────────────────────────┐       ┌──────────────────────────────────────────────┐
│   Browser                    │ HTTP  │   Next.js API Route (/api/chat)              │
│                              │──────►│                                              │
│  • useChat manages messages  │       │  ┌──────────────────────────────────────┐    │
│  • AssistantMessage detects  │◄──────│  │  Main Orchestrator Agent             │    │
│    tool parts in the stream  │stream │  │  • Receives user messages            │    │
│  • <Renderer /> parses       │       │  │  • Replies in plain text OR          │    │
│    OpenUI from sub-agent     │       │  │  • Delegates to tools:               │    │
│  • ToolCallIndicator shows   │       │  │    ┌──────────────────────────────┐  │    │
│    tool execution status     │       │  │    │ analytics_subagent(generator)│  │    │
│  • Sidebar with thread       │       │  │    │ • Streams OpenUI Lang markup │  │    │
│    history                   │       │  │    │ • Uses own LLM call + system │  │    │
│                              │       │  │    │   prompt from component lib  │  │    │
│                              │       │  │    ├──────────────────────────────┤  │    │
│                              │       │  │    │ get_weather (mock)           │  │    │
│                              │       │  │    │ get_stock_price (mock)       │  │    │
│                              │       │  │    │ calculate (mock)             │  │    │
│                              │       │  │    │ search_web (mock)            │  │    │
│                              │       │  │    └──────────────────────────────┘  │    │
│                              │       │  └──────────────────────────────────────┘    │
└──────────────────────────────┘       └──────────────────────────────────────────────┘
```

### Request / Response Flow

1. User types a message. `useChat` sends `POST /api/chat` with the full conversation history.
2. The API route converts `UIMessage[]` to model messages and calls `streamText` with the orchestrator system prompt, tools, and a max of 5 tool-call steps.
3. The main agent decides whether to respond directly or call a tool.
4. For visual requests, it calls `analytics_subagent` with a detailed task description.
5. The sub-agent streams OpenUI Lang markup via an async generator. Each yielded chunk flows through the Vercel AI SDK's tool-output streaming.
6. On the client, `<AssistantMessage />` detects the `analytics_subagent` tool part and passes the `openuiSpec` from its output to `<Renderer />`.
7. `<Renderer />` progressively renders React components (cards, charts, tables, forms) as tokens arrive.
8. A `<ToolCallIndicator />` shows a loading spinner while the sub-agent is running and a checkmark when done.
9. When the stream ends, messages are persisted to localStorage via `useThreads`.

---

## Project Structure

```
multi-agent-chat/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts         # Orchestrator endpoint — routes to tools/sub-agents
│   │   ├── page.tsx                   # Main chat page — wires useChat + components
│   │   └── layout.tsx                 # Root layout
│   ├── components/
│   │   ├── assistant-message.tsx      # Detects tool parts, renders OpenUI for sub-agent output
│   │   ├── user-message.tsx           # Renders user messages
│   │   ├── chat-input.tsx             # Textarea input with send / stop buttons
│   │   ├── chat-header.tsx            # Top bar with sidebar toggle
│   │   ├── sidebar.tsx                # Thread list with new/switch/delete
│   │   ├── sidebar-toggle.tsx         # Mobile sidebar toggle button
│   │   ├── conversation-starters.tsx  # Suggested prompts on empty chat
│   │   ├── thinking-indicator.tsx     # Animated dots while model is thinking
│   │   └── tool-call-indicator.tsx    # Shows tool execution status (spinner → checkmark)
│   ├── hooks/
│   │   ├── use-system-theme.tsx       # Detects system light/dark preference
│   │   └── use-threads.ts            # Thread CRUD + localStorage persistence
│   ├── lib/
│   │   ├── tools.ts                   # Tool definitions: analytics sub-agent + 4 mock tools
│   │   └── thread-store.ts           # Read/write threads to localStorage
│   ├── library.ts                     # OpenUI library export for prompt generation
│   └── generated/
│       └── system-prompt.txt          # Auto-generated from component library — do not edit
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- An OpenAI API key

### 1. Install dependencies

```bash
cd examples/multi-agent-chat
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Add your key to `.env.local`:

```
OPENAI_API_KEY=sk-...
```

### 3. Start the dev server

```bash
pnpm dev
```

This runs `generate:prompt` first (compiles `src/library.ts` → `src/generated/system-prompt.txt`) then starts the Next.js dev server at `http://localhost:3000`.

---

## What's in This Example

### The Orchestrator (`src/app/api/chat/route.ts`)

The API route uses `streamText` with the following configuration:


| Argument   | Value                | Purpose                                                              |
| ---------- | -------------------- | -------------------------------------------------------------------- |
| `model`    | `openai("gpt-5.4")`  | The LLM for the main orchestrator                                    |
| `system`   | orchestrator prompt  | Instructs the agent to delegate visual tasks to `analytics_subagent` |
| `messages` | conversation history | The full thread from the client                                      |
| `tools`    | 5 tool definitions   | Sub-agent + 4 helper tools                                           |
| `stopWhen` | `stepCountIs(5)`     | Max 5 tool-call steps per turn                                       |


The orchestrator's system prompt is explicit: any request involving charts, dashboards, tables, forms, or visual components must be routed to `analytics_subagent` immediately without preamble.

### The Analytics Sub-Agent (`src/lib/tools.ts`)

The star of the example. Defined as an async generator tool (`execute: async function*`), it:

1. Builds a prompt from the user's task description with strict output constraints (OpenUI only, no HTML wrappers).
2. Calls `streamText` with the auto-generated system prompt that describes every available OpenUI component.
3. Yields partial results as the LLM streams: `{ openuiSpec: "...", complete: false }`.
4. Yields a final result with `complete: true` when the stream ends.
5. Runs `sanitizeOpenUiSpec()` on each chunk to strip markdown fences and HTML wrappers the model may add.

This streaming approach means the user sees UI components building up live, not a blank screen followed by a sudden render.

### Frontend Rendering (`src/components/assistant-message.tsx`)

`<AssistantMessage />` processes each message's parts:

1. **Text parts** are concatenated and rendered as plain text.
2. **Tool parts** are detected by checking `part.type.startsWith("tool-")`.
3. For each tool part, a `<ToolCallIndicator />` shows the tool name with a spinner (running) or checkmark (done).
4. When the `analytics_subagent` tool reaches `state === "output-available"`, the `openuiSpec` from its output is passed to `<Renderer />` which renders the live OpenUI components.

### System Prompt Generation

`src/library.ts` re-exports `openuiChatLibrary` and `openuiChatPromptOptions` from `@openuidev/react-ui/genui-lib`. The OpenUI CLI reads this file and generates `src/generated/system-prompt.txt` — a text file containing every component's name, prop schema, description, and examples. This becomes the analytics sub-agent's system prompt.

Re-run generation any time you change component definitions:

```bash
pnpm generate:prompt
```

### Thread Management (`src/hooks/use-threads.ts`)

Conversations are organized into threads stored in localStorage. Each thread has an `id`, `title` (derived from the first user message), `messages`, and timestamps.


| Function                    | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `createThread()`            | Creates a new empty thread and makes it active                 |
| `switchThread(id)`          | Loads a previous thread's messages into `useChat`              |
| `deleteThread(id)`          | Removes a thread; switches to a new one if it was active       |
| `persistMessages(messages)` | Saves messages to localStorage (without triggering re-renders) |
| `refreshThreads()`          | Reloads the thread list from localStorage into React state     |


### Helper Tools (`src/lib/tools.ts`)

Four mock tools with simulated network delays that return realistic data:


| Tool              | Input                  | Delay  | Description                                             |
| ----------------- | ---------------------- | ------ | ------------------------------------------------------- |
| `get_weather`     | `location` (city name) | 800ms  | Temperature, conditions, humidity, wind, 2-day forecast |
| `get_stock_price` | `symbol` (ticker)      | 600ms  | Price, change, volume, day range                        |
| `calculate`       | `expression` (math)    | 300ms  | Evaluates math expressions safely                       |
| `search_web`      | `query` (search term)  | 1000ms | Returns 3 mock search results                           |


---

## Scripts


| Script                 | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `pnpm dev`             | Generate system prompt, then start the Next.js dev server      |
| `pnpm generate:prompt` | Recompile `src/library.ts` → `src/generated/system-prompt.txt` |
| `pnpm build`           | Build for production                                           |
| `pnpm start`           | Start the production server                                    |


---

## Learn More

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview) — Library, Prompt Generator, Parser, Renderer
- [Vercel AI SDK docs](https://ai-sdk.dev/) — `streamText`, `useChat`, `tool()`
- `[@openuidev/react-lang` package](../../packages/react-lang)

