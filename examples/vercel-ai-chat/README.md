# Vercel AI Chat Example

A full-stack generative UI chatbot built with the [Vercel AI SDK](https://ai-sdk.dev/) and [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview). Instead of replying with plain text or markdown, the LLM generates structured UI markup that the client renders as interactive React components — cards, tables, charts, forms, and more — in real time as tokens stream in.

Features: multi-step tool calling, persistent conversation threads (localStorage), collapsible sidebar, and automatic light/dark theme support.

<video src="../../docs/public/videos/vercel-ai-chat.mp4"
    noControls
    playsInline
    muted
    preload="metadata"
    className="w-full rounded-lg m-auto"
    autoPlay
    loop
/>

[View source on GitHub →](https://github.com/thesysdev/openui/tree/main/examples/vercel-ai-chat)

---

## How It Works

The LLM is prompted with a system prompt that describes a set of UI components — their names, props, and when to use them. Instead of writing prose, the model responds in **OpenUI Lang**: a declarative markup syntax that maps directly to React components. For example:

```
Card([
  CardHeader(title="Weather in Tokyo"),
  BarChart(data=[...], title="Temperature this week")
])
```

On the client, `<Renderer />` from `@openuidev/react-lang` parses this markup token-by-token as it streams in and renders it as real React components. The user sees UI building up live — not a wall of text.

The Vercel AI SDK handles the streaming transport on both ends:
- **Backend**: `streamText` calls the LLM, executes tools, and streams the response.
- **Frontend**: `useChat` manages message state, accumulates the streamed text, and triggers re-renders.

---

## Architecture

```
┌────────────────────────────────────┐        ┌────────────────────────────────────┐
│   Browser                          │  HTTP  │   Next.js API Route                │
│                                    │ ──────►│                                    │
│  • useChat manages message state   │        │  • Loads system-prompt.txt         │
│  • <Renderer /> parses OpenUI Lang │◄────── │  • Calls LLM with streamText       │
│  • openuiChatLibrary renders UI    │ stream │  • Executes tools server-side      │
│  • Sidebar with thread history     │        │  • Returns toUIMessageStreamResponse│
└────────────────────────────────────┘        └────────────────────────────────────┘
```

### Request / Response Flow

1. User types a message. `useChat` sends `POST /api/chat` with the full conversation history.
2. The API route reads `system-prompt.txt`, calls `streamText` with the model, system prompt, messages, and tool definitions.
3. If the LLM calls a tool, the Vercel AI SDK executes it server-side and feeds the result back into the model. This loop runs up to 5 steps (`stopWhen: stepCountIs(5)`).
4. The LLM generates a final OpenUI Lang response and it streams back via `toUIMessageStreamResponse()`.
5. `useChat` accumulates the streaming text and passes it to `<AssistantMessage />`.
6. `<AssistantMessage />` feeds the accumulated text into `<Renderer response={text} library={openuiChatLibrary} isStreaming={isStreaming} />`.
7. `<Renderer />` parses the markup progressively and renders live React components as each token arrives.
8. When the stream ends, `isStreaming` is set to `false`. The message is saved to localStorage via `useThreads`.

---

## Project Structure

```
vercel-ai-chat/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts      # Streaming chat endpoint (Vercel AI SDK)
│   │   ├── page.tsx               # Main chat page — wires useChat + components
│   │   └── layout.tsx             # Root layout with ThemeProvider
│   ├── components/
│   │   ├── assistant-message.tsx  # Renders <Renderer /> for each AI reply
│   │   ├── user-message.tsx       # Renders user messages
│   │   ├── chat-input.tsx         # Textarea input with send / stop buttons
│   │   ├── chat-header.tsx        # Top bar with sidebar toggle
│   │   ├── sidebar.tsx            # Thread list with new/switch/delete
│   │   ├── sidebar-toggle.tsx     # Mobile sidebar toggle button
│   │   ├── conversation-starters.tsx  # Suggested prompts on empty chat
│   │   ├── thinking-indicator.tsx # Animated dots while model is thinking
│   │   └── tool-call-indicator.tsx    # Shows which tool is running
│   ├── hooks/
│   │   ├── use-system-theme.tsx   # Detects system light/dark preference
│   │   └── use-threads.ts         # Thread CRUD + localStorage persistence
│   ├── lib/
│   │   ├── tools.ts               # Four mock tool definitions (Vercel AI SDK format)
│   │   └── thread-store.ts        # Read/write threads to localStorage
│   ├── library.ts                 # OpenUI library export for prompt generation
│   └── generated/
│       └── system-prompt.txt      # Auto-generated — do not edit manually
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
cd examples/vercel-ai-chat
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

### System Prompt Generation

`src/library.ts` re-exports `openuiChatLibrary` (as `library`) and `openuiChatPromptOptions` (as `promptOptions`) from `@openuidev/react-ui/genui-lib`. At dev time, the OpenUI CLI reads this file and generates `src/generated/system-prompt.txt` — a text file containing every component's name, prop schema, description, and usage examples. This is what the LLM receives as the system prompt, teaching it which components exist and how to use them.

Re-run generation any time you change component definitions:

```bash
pnpm generate:prompt
```

### `src/app/api/chat/route.ts` — Backend

The API route uses the Vercel AI SDK's `streamText` with five arguments:

| Argument | Value | Purpose |
| -------- | ----- | ------- |
| `model` | `openai("gpt-5.4")` | The LLM to call |
| `system` | contents of `system-prompt.txt` | Teaches the model OpenUI Lang and the available components |
| `messages` | conversation history from client | The full thread so far |
| `tools` | four tool definitions | Functions the LLM can call mid-generation |
| `stopWhen` | `stepCountIs(5)` | Stops the tool-call loop after 5 steps maximum |

`convertToModelMessages` bridges the Vercel AI SDK's `UIMessage` client format to the `ModelMessage` server format. `toUIMessageStreamResponse()` serializes the stream in the format `useChat` on the client expects.

### `src/components/assistant-message.tsx` — Frontend Renderer

Each assistant message is rendered by `<AssistantMessage />`, which:

1. Finds all `text` parts in the message (filtering out tool-call parts).
2. Concatenates them into `textContent`.
3. Passes it to `<Renderer />`:

```tsx
<Renderer
  response={textContent}
  library={openuiChatLibrary}
  isStreaming={isStreaming}
  onAction={handleAction}
/>
```

The `onAction` handler listens for `BuiltinActionType.ContinueConversation` events — fired when the user clicks a follow-up button inside a rendered card — and calls `onSend(event.humanFriendlyMessage)` to feed it back into the conversation.

### `src/hooks/use-threads.ts` — Thread Management

Conversations are organized into threads. Each thread has an `id`, `title` (derived from the first user message), `messages`, and timestamps. Threads are stored in localStorage under the key `vercel-ai-chat-threads`.

The hook exposes:

| Function | Description |
| -------- | ----------- |
| `createThread()` | Creates a new empty thread and makes it active |
| `switchThread(id)` | Loads a previous thread's messages into `useChat` |
| `deleteThread(id)` | Removes a thread; switches to a new one if it was active |
| `persistMessages(messages)` | Saves the current `useChat` messages to localStorage |

### `src/lib/tools.ts` — Mock Tools

All four tools are mock implementations with simulated network delays. They return realistic-looking data so the LLM can generate rich UI responses.

#### `get_weather`

Returns current conditions and a two-day forecast for a city.

- **Input**: `location` (string) — city name
- **Simulated delay**: 800ms
- **Returns**:

| Field | Example |
| ----- | ------- |
| `temperature_celsius` | `22` |
| `temperature_fahrenheit` | `72` |
| `condition` | `"Sunny"` |
| `humidity_percent` | `65` |
| `wind_speed_kmh` | `12` |
| `forecast` | `[{ day, high, low, condition }, ...]` (2 days) |

Hardcoded temperatures for: Tokyo (22°C), San Francisco (18°C), London (14°C), New York (25°C), Paris (19°C), Sydney (27°C), Mumbai (33°C), Berlin (16°C). Any other city gets a random temperature between 5–35°C.

#### `get_stock_price`

Returns current price data for a stock ticker.

- **Input**: `symbol` (string) — e.g. `AAPL`
- **Simulated delay**: 600ms
- **Returns**:

| Field | Example |
| ----- | ------- |
| `price` | `190.12` |
| `change` | `+0.28` |
| `change_percent` | `+0.15%` |
| `volume` | `"42.3M"` |
| `day_high` | `191.50` |
| `day_low` | `188.90` |

Hardcoded prices for: AAPL ($189.84), GOOGL ($141.80), TSLA ($248.42), MSFT ($378.91), AMZN ($178.25), NVDA ($875.28), META ($485.58). Other tickers get a random price.

#### `calculate`

Evaluates a math expression safely.

- **Input**: `expression` (string) — e.g. `"2 * (3 + 4)"` or `"Math.sqrt(144)"`
- **Simulated delay**: 300ms
- **Supports**: `+`, `-`, `*`, `/`, `()`, `%`, `Math.sqrt`, `pow`, `abs`, `ceil`, `floor`, `round`
- **Returns**: `{ expression, result }` or `{ expression, error }` on invalid input

#### `search_web`

Returns mock search results for any query.

- **Input**: `query` (string) — the search term
- **Simulated delay**: 1000ms
- **Returns**: an array of 3 results, each with `title` and `snippet` templated from the query string

---

## Scripts

| Script | Description |
| ------ | ----------- |
| `pnpm dev` | Generate system prompt, then start the Next.js dev server |
| `pnpm generate:prompt` | Recompile `src/library.ts` → `src/generated/system-prompt.txt` |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |

---

## Learn More

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview) — Library, Prompt Generator, Parser, Renderer
- [Vercel AI SDK docs](https://ai-sdk.dev/) — `streamText`, `useChat`, `tool()`
- [`@openuidev/react-lang` package](../../packages/react-lang)
