# shadcn-chat

An AI chat interface built with [OpenUI](https://github.com/AThesys/openui), [Next.js](https://nextjs.org/), and [shadcn/ui](https://ui.shadcn.com/) components. The LLM responds with a declarative UI language (openui-lang) that renders rich, interactive UI components in real time.

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (this project is part of a pnpm monorepo)
- An **OpenRouter API key** — get one at [openrouter.ai](https://openrouter.ai/)

## Setup

### 1. Install dependencies

From the **repository root** (not this folder):

```bash
pnpm install
```

This installs all workspace packages including the local `@openuidev/react-headless`, `@openuidev/react-lang`, and `@openuidev/react-ui` dependencies.

### 2. Set up environment variables

Create a `.env.local` file in this directory:

```bash
cp /dev/null examples/shadcn-chat/.env.local
```

Add your OpenRouter API key:

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3. Run the dev server

```bash
pnpm dev
```

This will:
1. Auto-generate the system prompt from the component library (`pnpm generate:prompt`)
2. Start the Next.js dev server at [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Generate system prompt + start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm generate:prompt` | Regenerate the system prompt from component definitions |

## Project Structure

```
shadcn-chat/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts    # Chat API endpoint (OpenRouter + tool calling)
│   │   ├── page.tsx             # Main chat UI page
│   │   └── globals.css          # Global styles
│   ├── components/ui/           # shadcn/ui base components (37 components)
│   ├── lib/shadcn-genui/        # openui-lang component definitions
│   │   ├── components/          # Component implementations (Table, Tabs, Charts, etc.)
│   │   ├── unions.ts            # Union type definitions for content children
│   │   └── rules.ts             # Component rules and constraints
│   └── generated/
│       └── system-prompt.txt    # Auto-generated LLM system prompt
├── scripts/
│   └── generate-prompt.mjs      # Prompt generation script
├── package.json
└── tsconfig.json
```

## How It Works

1. The user types a message in the chat interface
2. The message is sent to `/api/chat`, which calls OpenRouter (GPT model) with a system prompt describing the openui-lang syntax
3. The LLM responds with openui-lang code (e.g., `root = Card([title, table])`)
4. The response streams back via SSE and is parsed in real time by `@openuidev/react-lang`
5. Each parsed node renders as a shadcn/ui component from `src/lib/shadcn-genui/`

The system prompt (`src/generated/system-prompt.txt`) is auto-generated from the component definitions, so the LLM always knows the available components and their signatures.

## Built-in Tools

The chat API includes mock tool implementations:

- **get_weather** — Returns weather data for a city
- **get_stock_price** — Returns stock price for a ticker symbol
- **calculate** — Evaluates math expressions
- **search_web** — Returns mock search results
