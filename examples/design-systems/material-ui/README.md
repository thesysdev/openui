# Material UI Chat Example

A full-stack generative UI chatbot that wires [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview) to a custom component library built on [Material UI](https://mui.com/material-ui/). Instead of replying with plain text, the LLM generates structured UI markup that the client renders as MUI components — cards, tables, charts, forms, tabs, accordions, alerts, lists, and more — in real time as tokens stream in.

This is the MUI counterpart to the [`shadcn`](../shadcn) example. It shows how to map OpenUI Lang nodes onto an existing design system (MUI components + theme), including light/dark mode.

## How It Works

The LLM is given a system prompt that describes every available Material UI component — its name, props, and when to use it. Instead of prose, the model responds in **OpenUI Lang**, a declarative markup that maps directly to React components:

```
root = Card([header, tbl])
header = CardHeader("Q1 Sales")
tbl = Table([Col("Product"), Col("Revenue", "number")], [["Widget", 1200]])
```

On the client, `<AgentInterface />` from `@openuidev/react-ui` provides the chat interface. It uses `openAIAdapter()` for Chat Completions SSE. Threads stay in memory (no Cloud storage). `muiChatLibrary` renders each OpenUI Lang node.

```tsx
<AgentInterface llm={llm} componentLibrary={muiChatLibrary} />
```

## Architecture

```
┌────────────────────────────────────┐        ┌────────────────────────────────────┐
│   Browser                          │  HTTP  │   Next.js API Route                │
│                                    │ ──────►│                                    │
│  • <AgentInterface /> manages UI   │        │  • Loads spec.json                 │
│  • openAIAdapter()                 │◄────── │  • OpenUI Cloud Completions proxy  │
│  • muiChatLibrary renders nodes    │  SSE   │  • App tools via runChatToolLoop   │
│  • MUI ThemeProvider + CssBaseline │        │  • Streams Completions SSE events  │
└────────────────────────────────────┘        └────────────────────────────────────┘
```

1. The user types a message. `<AgentInterface />` invokes `llm.send()`, which `POST`s to `/api/chat` with the full thread formatted via `openAIMessageFormat`.
2. The API route loads the generated library spec, calls OpenUI Cloud's Chat Completions API, and runs app-owned tools with `runChatToolLoop`.
3. Tool calls run server-side; results are appended as `role: "tool"` messages and the loop continues until the model answers.
4. The model streams OpenUI Lang as Chat Completions SSE events.
5. The client parses the events with `openAIAdapter()` and renders each node as a Material UI component as it streams in.

## Project Structure

```
material-ui/
├── src/
│   ├── library.ts                 # Entry the OpenUI CLI reads to generate the prompt
│   ├── app/
│   │   ├── api/chat/route.ts      # OpenUI Cloud Completions proxy + app tools
│   │   ├── page.tsx               # Mounts <AgentInterface /> + color-mode toggle
│   │   ├── layout.tsx             # Root layout with ColorModeProvider
│   │   └── globals.css            # Minimal full-height reset
│   ├── hooks/
│   │   └── use-system-theme.tsx   # MUI ThemeProvider + light/dark color mode
│   ├── lib/
│   │   └── mui-genui/             # Custom OpenUI component library (Material UI)
│   │       ├── index.tsx          # Library export — createLibrary() call
│   │       ├── theme.ts           # MUI theme factory + chart palette
│   │       ├── action.ts          # Button action Zod schemas
│   │       ├── helpers.ts         # Chart data builders for @mui/x-charts
│   │       ├── rules.ts           # Form validation rule schemas
│   │       ├── unions.ts          # Zod union types for component children
│   │       └── components/        # One file per component (MUI wrappers)
│   └── generated/
│       └── spec.json              # Auto-generated library spec — do not edit manually
└── package.json
```

## Components

The library exposes a representative subset of Material UI components mapped to OpenUI Lang:

| Category   | Components                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------- |
| Content    | `CardHeader`, `TextContent`, `Heading`, `Alert`, `List` / `ListItem`, `Separator`, `Progress` |
| Tables     | `Table` / `Col`                                                                               |
| Charts     | `BarChart`, `LineChart`, `PieChart` (via `@mui/x-charts`) with `Series` / `Slice`             |
| Forms      | `Form`, `FormControl`, `Input`, `Select` / `SelectItem`, `SwitchGroup` / `SwitchItem`         |
| Buttons    | `Button`, `Buttons`                                                                           |
| Layout     | `Tabs` / `TabItem`, `Accordion` / `AccordionItem`                                             |
| Follow-ups | `FollowUpBlock` / `FollowUpItem`                                                              |

Each component is defined with `defineComponent({ name, props, description, component })` where `props` is a Zod schema. The schema and description are serialized into `src/generated/spec.json` by `pnpm generate` (the OpenUI CLI reads `src/library.ts`), and `component` renders the node with Material UI primitives.

## Theming

The app wraps everything in MUI's `ThemeProvider` + `CssBaseline` via `ColorModeProvider` (`src/hooks/use-system-theme.tsx`). It follows the OS color scheme by default and exposes a manual light/dark toggle (top-right of the screen). All generated components — and the chat surface — re-theme automatically. Customize `createAppTheme()` in `src/lib/mui-genui/theme.ts`.

## Getting Started

### Prerequisites

- Node.js 20.x
- pnpm, npm, or Bun
- An OpenUI Cloud API key (https://console.thesys.dev/keys)

### Setup

Enter this standalone example and install its dependencies:

```bash
cd examples/design-systems/material-ui
pnpm install --ignore-workspace
```

Provide your API key:

```bash
pnpm generate:apiKey
```

### Develop

```bash
pnpm dev
```

`pnpm dev` first runs `generate` to (re)write `src/generated/spec.json` from the library, then starts Next.js on http://localhost:3000.

### Regenerate the system prompt

Whenever you add or change a component, regenerate the spec:

```bash
pnpm generate
```

### Build

```bash
pnpm build
```

## Adding a Component

1. Create `src/lib/mui-genui/components/<name>.tsx` and export a `defineComponent({ ... })`.
2. If it can appear inside other containers, add its `.ref` to `ContentChildUnion` in `unions.ts`.
3. Register it in the `components` array (and a `componentGroups` entry) in `index.tsx`.
4. Run `pnpm generate` so the LLM learns about it.

## Verify

```bash
pnpm verify
```
