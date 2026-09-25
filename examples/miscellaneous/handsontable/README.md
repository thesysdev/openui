# Handsontable + OpenUI Chat

An AI-powered spreadsheet app that pairs a full-featured [Handsontable](https://handsontable.com/) grid with an [OpenUI](https://openui.com) chat panel. Ask the AI to analyze, visualize, or modify your data — changes sync to the live spreadsheet in real time.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Handsontable](https://img.shields.io/badge/Handsontable-17-blue)
![OpenUI](https://img.shields.io/badge/OpenUI-0.11-purple)

## Features

- **Live spreadsheet** — Handsontable grid with Excel-like editing, 386+ formula functions (via HyperFormula), context menus, column resizing, and CSV export
- **AI chat panel** — OpenUI chat panel that understands the spreadsheet context and responds with rich UI (charts, tables, markdown)
- **Bidirectional sync** — AI tool calls mutate the server-side table store, then push updates back to the grid via a `SpreadsheetTable` component
- **Formula-aware row operations** — Adding or deleting rows automatically shifts cell references in formulas (mirrors Excel/Sheets behavior)
- **Aggregate recalculation** — Total/Average/Sum/Count/Max/Min rows auto-update their formula ranges after structural changes
- **Dark theme** — Fully dark UI for both the spreadsheet and chat panel

## Architecture

```
┌─────────────────────────────────┐  ┌──────────────────────────┐
│         Spreadsheet Panel       │  │       Chat Panel          │
│  PersistentSpreadsheet.tsx      │  │  Custom chat + Renderer   │
│  (Handsontable + HyperFormula)  │  │  spreadsheet-library.tsx  │
└──────────────┬──────────────────┘  └────────────┬─────────────┘
               │                                  │
               │  POST /api/table                 │  POST /api/chat (SSE)
               │  (user edits → server store)     │  (messages → Cloud Completions → tools)
               ▼                                  ▼
        ┌─────────────────────────────────────────────┐
        │              Server (Next.js API Routes)     │
        │  tableStore.ts — in-memory table state       │
        │  tools.ts — 8 spreadsheet tools for the LLM  │
        │  messageStore.ts — conversation history       │
        └─────────────────────────────────────────────┘
```

**Data flow:**

1. User types a message in the chat panel
2. The message hits `POST /api/chat`, which streams an OpenUI Cloud completion with tool calls
3. Tools (`get_table_data`, `update_cells`, `add_rows`, `delete_rows`, `set_formula`, `query_table`, `add_column`, `recalculate_aggregates`) read/write the in-memory `tableStore`
4. After write operations, the LLM emits a `SpreadsheetTable` component in its OpenUI Lang response
5. The `useSpreadsheetSync` hook picks up the new data and pushes it into Handsontable via React context
6. User edits in the grid sync back to the server via `POST /api/table`

## Available AI Tools

| Tool                     | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `get_table_data`         | Read current table data, headers, and dimensions           |
| `update_cells`           | Update one or more cells (values or formulas)              |
| `add_rows`               | Insert rows at a position (formulas auto-shift)            |
| `delete_rows`            | Remove rows by index (formulas auto-shrink)                |
| `set_formula`            | Set an Excel-like formula in a cell                        |
| `query_table`            | Filter rows by column value with comparison operators      |
| `add_column`             | Add a new column with a header name                        |
| `recalculate_aggregates` | Rewrite Total/Average/Sum rows to cover current data range |

## Getting Started

### Prerequisites

- Node.js 18+
- An [OpenUI Cloud API key](https://console.thesys.dev/keys)

### Setup

```bash
cd examples/miscellaneous/handsontable

# Copy the environment template and add your API key
cp env.example .env
# Edit .env and set THESYS_API_KEY=sk-th-...

# Install dependencies
pnpm install --ignore-workspace

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the spreadsheet with the AI chat panel.

### Environment Variables

| Variable         | Required | Default   | Description                       |
| ---------------- | -------- | --------- | --------------------------------- |
| `THESYS_API_KEY` | Yes      | —         | Your OpenUI Cloud API key               |

## Project Structure

```
hands-on-table-chat/
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Main layout: spreadsheet + chat panels
│   │   ├── layout.tsx                 # Root layout with metadata
│   │   ├── globals.css                # Dark theme styles for grid + chat
│   │   ├── PersistentSpreadsheet.tsx  # Handsontable wrapper with HyperFormula
│   │   ├── TableContext.tsx           # React context for shared table state
│   │   ├── useSpreadsheetSync.ts     # Hook to push AI data into the grid
│   │   └── api/
│   │       ├── chat/
│   │       │   ├── route.ts           # POST endpoint — Cloud Completions + tool loop
│   │       │   ├── tools.ts           # 8 spreadsheet tools for the LLM
│   │       │   ├── tableStore.ts      # In-memory table state + formula shifting
│   │       │   └── messageStore.ts    # Conversation history store
│   │       └── table/
│   │           └── route.ts           # GET/POST for client ↔ server table sync
│   ├── generated/
│   │   └── spec.json                  # Auto-generated library spec
│   └── lib/
│       └── spreadsheet-library.tsx    # OpenUI component library with SpreadsheetTable
├── .env.example                       # Environment variable template
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

## Key Dependencies

| Package                                                                                    | Purpose                                            |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| [`handsontable`](https://handsontable.com/)                                                | Excel-like data grid                               |
| [`@handsontable/react-wrapper`](https://www.npmjs.com/package/@handsontable/react-wrapper) | React bindings for Handsontable                    |
| [`hyperformula`](https://hyperformula.handsontable.com/)                                   | Formula engine (386+ Excel-compatible functions)   |
| [`@openuidev/react-ui`](https://openui.com/docs)                                           | OpenUI chat panel                                  |
| [`@openuidev/react-headless`](https://openui.com/docs)                                     | OpenUI adapter and message formatting              |
| [`@openuidev/react-lang`](https://openui.com/docs)                                         | OpenUI Lang component library DSL                  |
| [`openai`](https://www.npmjs.com/package/openai)                                           | OpenAI SDK pointed at OpenUI Cloud Completions     |
| [`next`](https://nextjs.org/)                                                              | React framework with API routes and SSE streaming. |

## Try These Prompts

- **"Chart revenue by quarter"** — generates a bar chart from the spreadsheet data
- **"Add Vision Pro to the lineup"** — inserts a new product row with formulas
- **"Add a profit margin column"** — adds a calculated column
- **"Revenue breakdown by category"** — pie chart of annual revenue by category
- **"Compare Q1 vs Q4 growth"** — table with percentage growth calculations

## Learn More

- [OpenUI Documentation](https://openui.com/docs)
- [Handsontable Documentation](https://handsontable.com/docs)
- [OpenUI GitHub](https://github.com/thesysdev/openui)

## Verify

```bash
pnpm verify
```
