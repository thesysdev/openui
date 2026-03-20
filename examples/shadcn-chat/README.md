# Shadcn Chat Example

A full-stack generative UI chatbot that demonstrates wiring [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview) to a custom component library built on [shadcn/ui](https://ui.shadcn.com/). Instead of replying with plain text or markdown, the LLM generates structured UI markup that the client renders as shadcn/ui components — cards, tables, charts, forms, dialogs, and more — in real time as tokens stream in.

Features: 45+ custom shadcn/ui components, multi-step tool calling, Server-Sent Events (SSE) streaming, and automatic light/dark theme support.

<video src="../../docs/public/videos/shadcn-demo-chat.mp4"
    noControls
    playsInline
    muted
    preload="metadata"
    className="w-full rounded-lg m-auto"
    autoPlay
    loop
/>

[View source on GitHub →](https://github.com/thesysdev/openui/tree/main/examples/shadcn-chat)

---

## How It Works

The LLM is prompted with a system prompt that describes every available shadcn/ui component — its name, props, and when to use it. Instead of writing prose, the model responds in **OpenUI Lang**: a declarative markup syntax that maps directly to React components. For example:

```
Card([
  CardHeader(title="Q1 Sales Report"),
  Table(columns=["Product", "Revenue"], rows=[...]),
  BarChart(data=[...], title="Monthly Trend")
])
```

On the client, the `<FullScreen />` component from `@openuidev/react-ui` handles everything — conversation state, streaming, input, and rendering. It parses the incoming SSE stream with `openAIAdapter()` and renders each OpenUI Lang node using `shadcnChatLibrary` — the custom 45-component library defined in `src/lib/shadcn-genui/`.

---

## Architecture

```
┌────────────────────────────────────┐        ┌────────────────────────────────────┐
│   Browser                          │  HTTP  │   Next.js API Route                │
│                                    │ ──────►│                                    │
│  • <FullScreen /> manages UI       │        │  • Loads system-prompt.txt         │
│  • openAIAdapter() parses SSE      │◄────── │  • Calls LLM with runTools         │
│  • shadcnChatLibrary renders nodes │  SSE   │  • Executes tools server-side      │
│  • Conversation starters included  │        │  • Streams response as SSE events  │
└────────────────────────────────────┘        └────────────────────────────────────┘
```

### Request / Response Flow

1. User types a message. `<FullScreen />` calls `processMessage`, which sends `POST /api/chat` with the conversation history formatted via `openAIMessageFormat.toApi()`.
2. The API route reads `system-prompt.txt`, instantiates an OpenAI client, and calls `runTools` — the OpenAI SDK's built-in multi-step tool execution loop.
3. If the LLM calls a tool, `runTools` executes it server-side and feeds the result back into the model automatically, emitting SSE events for the tool call and result.
4. The LLM generates a final OpenUI Lang response. Text deltas are streamed as SSE `chunk` events. The stream ends with `data: [DONE]`.
5. On the client, `openAIAdapter()` parses the SSE events and hands the accumulated text to `<FullScreen />`'s internal renderer.
6. The renderer passes the text to `<Renderer response={text} library={shadcnChatLibrary} />`, which parses the OpenUI Lang markup and renders each node as a shadcn/ui component in real time.

---

## Project Structure

```
shadcn-chat/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts      # Streaming chat endpoint (OpenAI SDK + SSE)
│   │   ├── page.tsx               # Single page — mounts <FullScreen />
│   │   └── layout.tsx             # Root layout with ThemeProvider
│   ├── components/ui/             # Base shadcn/ui primitives (accordion, card, table, etc.)
│   ├── hooks/
│   │   └── use-system-theme.tsx   # Detects and provides system light/dark preference
│   ├── lib/
│   │   └── shadcn-genui/          # Custom OpenUI component library
│   │       ├── index.tsx          # Library export — createLibrary() call
│   │       ├── action.ts          # Button action Zod schemas
│   │       ├── helpers.ts         # Chart data builder utilities
│   │       ├── rules.ts           # Form validation rule schemas
│   │       ├── unions.ts          # Zod union types for component children
│   │       └── components/        # One file per component (45+ total)
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
cd examples/shadcn-chat
pnpm install
```

### 2. Configure environment

Create a `.env.local` file in the `examples/shadcn-chat/` directory:

```
OPENAI_API_KEY=sk-...
```

### 3. Start the dev server

```bash
pnpm dev
```

This runs `generate:prompt` first (compiles the component library → `src/generated/system-prompt.txt`) then starts the Next.js dev server at `http://localhost:3000`.

---

## What's in This Example

### System Prompt Generation

The `src/lib/shadcn-genui/index.tsx` file defines the entire component library using `createLibrary()`. At dev time, the OpenUI CLI reads this library and generates `src/generated/system-prompt.txt` — a text file containing every component's name, prop schema, description, and usage examples. This is what the LLM receives as its system prompt.

Re-run generation any time you change component definitions:

```bash
pnpm generate:prompt
```

### `src/app/api/chat/route.ts` — Backend

The route uses `client.chat.completions.runTools()` from the OpenAI SDK, which handles the full agentic loop: if the LLM calls a tool, the SDK executes it and feeds the result back automatically until the model produces a final text response.

The response is streamed as **Server-Sent Events (SSE)**. Three types of SSE events are emitted:

| Event type       | When emitted              | What it carries                               |
| ---------------- | ------------------------- | --------------------------------------------- |
| Tool call start  | LLM invokes a tool        | Tool name and ID                              |
| Tool call result | Tool execution completes  | Enriched JSON with `_request` and `_response` |
| Text chunk       | LLM generates text tokens | The OpenUI Lang markup delta                  |

Messages are cleaned before sending to the API: `tool` role messages are stripped, and `tool_calls` are removed from assistant messages (since `runTools` reruns the agentic loop server-side on each request).

### `src/app/page.tsx` — Frontend

The entire chat interface is the `<FullScreen />` component from `@openuidev/react-ui`. You configure it with three things:

| Prop               | Value                     | Purpose                                           |
| ------------------ | ------------------------- | ------------------------------------------------- |
| `processMessage`   | `fetch("/api/chat", ...)` | How to call your backend                          |
| `streamProtocol`   | `openAIAdapter()`         | How to parse the SSE stream                       |
| `componentLibrary` | `shadcnChatLibrary`       | Which components to render OpenUI Lang nodes with |

`openAIAdapter()` is imported from `@openuidev/react-headless`. It knows how to parse the OpenAI-style SSE format emitted by this route. `openAIMessageFormat.toApi()` converts the internal message objects into the format the OpenAI API expects.

The page also includes 7 built-in conversation starters to showcase the component library:

| Starter           | What it demonstrates                                                       |
| ----------------- | -------------------------------------------------------------------------- |
| Startup dashboard | Tabs, BarChart, LineChart, PieChart, Table, Progress, Tags                 |
| Travel planner    | CalendarBlock, Accordion, Tags, Form (Select, Slider, Checkboxes)          |
| Market watch      | Tool calling (get_stock_price), Table, Alert, DrawerBlock, BarChart        |
| Event RSVP        | Form (Input, Select, RadioGroup, DatePicker, Slider, Checkboxes, Switches) |
| Team standup      | Progress, Table, Alert, Accordion, DialogBlock, PieChart                   |
| Recipe card       | Tabs, Accordion, PieChart, Button, DialogBlock                             |
| Chart showcase    | All 6 chart types: Bar, Line, Area, Pie, Radar, Scatter + RadialChart      |

### `src/lib/shadcn-genui/` — Custom Component Library

Each component is defined with `defineComponent()` from `@openuidev/react-lang`, which takes:

- `name` — the OpenUI Lang node name the LLM will emit
- `props` — a Zod schema that validates and types the node's props as they stream in
- `description` — included in the system prompt so the LLM knows when and how to use the component
- `component` — the React render function; `renderNode()` recursively renders child nodes

The full library (`shadcnChatLibrary`) is assembled with `createLibrary({ root: "Card", components: [...] })`.

#### Component Groups

| Group                | Components                                                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content**          | `Card`, `CardHeader`, `TextContent`, `MarkDownRenderer`, `Alert`, `Badge`, `Avatar`, `CodeBlock`, `Image`, `Progress`, `Separator`                                                           |
| **Tables**           | `Table`, `Col`                                                                                                                                                                               |
| **Charts (2D)**      | `BarChart`, `LineChart`, `AreaChart`, `RadarChart`, `Series`                                                                                                                                 |
| **Charts (1D)**      | `PieChart`, `RadialChart`, `Slice`                                                                                                                                                           |
| **Charts (Scatter)** | `ScatterChart`, `ScatterSeries`, `Point`                                                                                                                                                     |
| **Forms**            | `Form`, `FormControl`, `Label`, `Input`, `TextArea`, `Select`, `SelectItem`, `DatePicker`, `Slider`, `CheckBoxGroup`, `CheckBoxItem`, `RadioGroup`, `RadioItem`, `SwitchGroup`, `SwitchItem` |
| **Buttons**          | `Button`, `Buttons`                                                                                                                                                                          |
| **Follow-ups**       | `FollowUpBlock`, `FollowUpItem`                                                                                                                                                              |
| **Layout**           | `Tabs`, `TabItem`, `Accordion`, `AccordionItemDef`, `Carousel`                                                                                                                               |
| **Data Display**     | `TagBlock`, `Tag`                                                                                                                                                                            |
| **Typography**       | `Heading`, `Blockquote`, `InlineCode`                                                                                                                                                        |
| **Navigation**       | `PaginationBlock`                                                                                                                                                                            |
| **Overlays**         | `DialogBlock`, `AlertDialogBlock`, `DrawerBlock`                                                                                                                                             |
| **Calendar**         | `CalendarBlock`                                                                                                                                                                              |

### Mock Tools

All four tools are mock implementations with simulated network delays. They return realistic-looking data so the LLM can generate rich UI responses.

#### `get_weather`

Returns current conditions and a two-day forecast for a city.

- **Input**: `location` (string) — city name
- **Simulated delay**: 800ms
- **Returns**:

| Field                    | Example                                     |
| ------------------------ | ------------------------------------------- |
| `temperature_celsius`    | `22`                                        |
| `temperature_fahrenheit` | `72`                                        |
| `condition`              | `"Sunny"`                                   |
| `humidity_percent`       | `65`                                        |
| `wind_speed_kmh`         | `12`                                        |
| `forecast`               | 2-day array with `high`, `low`, `condition` |

Hardcoded temperatures for: Tokyo (22°C), San Francisco (18°C), London (14°C), New York (25°C), Paris (19°C), Sydney (27°C), Mumbai (33°C), Berlin (16°C). Other cities get a random value.

#### `get_stock_price`

Returns current price data for a stock ticker.

- **Input**: `symbol` (string) — e.g. `AAPL`
- **Simulated delay**: 600ms
- **Returns**:

| Field            | Example   |
| ---------------- | --------- |
| `price`          | `190.12`  |
| `change`         | `+0.28`   |
| `change_percent` | `+0.15%`  |
| `volume`         | `"42.3M"` |
| `day_high`       | `191.50`  |
| `day_low`        | `188.90`  |

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

| Script                 | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `pnpm dev`             | Generate system prompt, then start the Next.js dev server    |
| `pnpm generate:prompt` | Recompile `shadcn-genui` → `src/generated/system-prompt.txt` |
| `pnpm build`           | Build for production                                         |
| `pnpm start`           | Start the production server                                  |

---

## Learn More

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview) — Library, Prompt Generator, Parser, Renderer
- [Defining Components](https://www.openui.com/docs/openui-lang/defining-components) — `defineComponent` and `createLibrary` API
- [shadcn/ui](https://ui.shadcn.com/) — the underlying component system
- [`@openuidev/react-lang` package](../../packages/react-lang)
