# Shadcn Chat Example

A full-stack generative UI chatbot that demonstrates wiring [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview) to a custom component library built on [shadcn/ui](https://ui.shadcn.com/). Instead of replying with plain text or markdown, the LLM generates structured UI markup that the client renders as shadcn/ui components — cards, tables, charts, forms, dialogs, and more — in real time as tokens stream in.

Features: 45+ custom shadcn/ui components, multi-step tool calling, Server-Sent Events (SSE) streaming, and automatic light/dark theme support.

<video src="../../../docs/public/videos/shadcn-demo-chat.mp4"
    noControls
    playsInline
    muted
    preload="metadata"
    className="w-full rounded-lg m-auto"
    autoPlay
    loop
/>

[View source on GitHub →](https://github.com/thesysdev/openui/tree/main/examples/design-systems/shadcn)

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

On the client, the `<AgentInterface />` component from `@openuidev/react-ui` handles everything — thread history, conversation state, streaming, input, and rendering. You give it an `llm` describing how to call your backend and parse its stream, and a `componentLibrary`. Threads stay in memory (no Cloud storage). It parses Chat Completions SSE with `openAIAdapter()` and renders each OpenUI Lang node using `shadcnChatLibrary` — the custom 45-component library defined in `src/lib/shadcn-genui/`.

---

## Architecture

```
┌────────────────────────────────────┐        ┌────────────────────────────────────┐
│   Browser                          │  HTTP  │   Next.js API Route                │
│                                    │ ──────►│                                    │
│  • <AgentInterface /> manages UI   │        │  • OpenUI Cloud Completions proxy  │
│  • openAIAdapter()                 │◄────── │  • Full thread sent each turn      │
│  • shadcnChatLibrary renders nodes │  SSE   │  • App tools via runChatToolLoop   │
│  • In-memory threads               │        │  • Streams Completions SSE events  │
└────────────────────────────────────┘        └────────────────────────────────────┘
```

### Request / Response Flow

1. User types a message. `<AgentInterface />` calls `llm.send`, which sends `POST /api/chat` with the full thread formatted via `openAIMessageFormat`.
2. The API route loads the generated library spec, wraps it with `generateSystemPrompt({ cloud: true })`, and calls OpenUI Cloud's Chat Completions API with the full message history.
3. If the model calls an app-owned tool, `runChatToolLoop` executes it on this server and continues until the model returns a final answer.
4. The model streams OpenUI Lang as Chat Completions SSE events.
5. On the client, `openAIAdapter()` parses the events and hands the accumulated text to `<AgentInterface />`.
6. The renderer parses OpenUI Lang against `shadcnChatLibrary` and renders each node as a shadcn/ui component in real time.

---

## Project Structure

```
shadcn/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts      # OpenUI Cloud Completions proxy + app tools
│   │   ├── page.tsx               # Single page — mounts <AgentInterface />
│   │   └── layout.tsx             # Root layout with ThemeProvider
│   ├── components/ui/             # Base shadcn/ui primitives (accordion, card, table, etc.)
│   ├── lib/
│   │   └── shadcn-genui/          # Custom OpenUI component library
│   │       ├── index.tsx          # Library export — createLibrary() call
│   │       ├── action.ts          # Button action Zod schemas
│   │       ├── helpers.ts         # Chart data builder utilities
│   │       ├── rules.ts           # Form validation rule schemas
│   │       ├── unions.ts          # Zod union types for component children
│   │       └── components/        # One file per component (45+ total)
│   └── generated/
│       └── spec.json              # Auto-generated library spec — do not edit manually
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm, npm, or Bun
- An OpenUI Cloud API key (https://console.thesys.dev/keys)

### 1. Install dependencies

```bash
cd examples/design-systems/shadcn
pnpm install --ignore-workspace
```

### 2. Configure environment

Create a `.env.local` file in the `examples/design-systems/shadcn/` directory:

```
THESYS_API_KEY=sk-th-...
```

### 3. Start the dev server

```bash
pnpm dev
```

This runs `generate` first (compiles the component library → `src/generated/spec.json`) then starts the Next.js dev server at `http://localhost:3000`.

---

## What's in This Example

### System Prompt Generation

The `src/lib/shadcn-genui/index.tsx` file defines the entire component library using `createLibrary()`. At dev time, the OpenUI CLI reads this library and writes `src/generated/spec.json`. Cloud's `generateSystemPrompt({ cloud: true, library })` turns that spec into the managed system prompt.

Re-run generation any time you change component definitions:

```bash
pnpm generate
```

### `src/app/api/chat/route.ts` — Backend

The route proxies OpenUI Cloud's Chat Completions API. Completions is message-based, so the full thread is sent every turn. App-owned tools run in `runChatToolLoop`.

The response is streamed as **Chat Completions SSE** for `openAIAdapter()`.

### `src/app/page.tsx` — Frontend

The entire chat interface is the `<AgentInterface />` component from `@openuidev/react-ui`. You configure it with:

| Prop               | Value                      | Purpose                                                                   |
| ------------------ | -------------------------- | ------------------------------------------------------------------------- |
| `llm`              | `{ send, streamProtocol }` | How to call your backend (`send`) and parse its stream (`streamProtocol`) |
| `componentLibrary` | `shadcnChatLibrary`        | Which components to render OpenUI Lang nodes with                         |

`llm` is created with `fetchLLM({ streamAdapter: openAIAdapter(), messageFormat: openAIMessageFormat })`. Threads stay in memory — there is no `storage` prop.

```tsx
<AgentInterface
  llm={llm}
  componentLibrary={shadcnChatLibrary}
/>
```

The page also passes 7 built-in `starters` (each a `{ displayText, prompt }` pair) to showcase the component library:

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

All three tools are mock implementations with simulated network delays. They return realistic-looking data so the LLM can generate rich UI responses.

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
| `pnpm generate` | Recompile `shadcn-genui` → `src/generated/spec.json` |
| `pnpm build`           | Build for production                                         |
| `pnpm start`           | Start the production server                                  |

---

## Learn More

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview) — Library, Prompt Generator, Parser, Renderer
- [Defining Components](https://www.openui.com/docs/openui-lang/defining-components) — `defineComponent` and `createLibrary` API
- [shadcn/ui](https://ui.shadcn.com/) — the underlying component system
- [`@openuidev/react-lang` package](../../../packages/react-lang)

## Verify

```bash
pnpm verify
```
