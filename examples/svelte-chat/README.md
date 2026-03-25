# OpenUI Svelte Chat

A chat application built with [SvelteKit](https://svelte.dev/docs/kit), [Vercel AI SDK](https://ai-sdk.dev), and [`@openuidev/svelte-lang`](../../packages/svelte-lang/) — demonstrating how to render structured LLM output as live Svelte components.

## How it works

1. **User sends a message** via the chat input
2. **Server streams a response** using the Vercel AI SDK with OpenAI, guided by a system prompt written in openui-lang syntax
3. **`@openuidev/svelte-lang` Renderer** parses the streaming openui-lang text and renders it as Svelte components in real time
4. **Tool calls** (weather, stocks, math, web search) are displayed inline with status indicators

## Setup

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/)
- An OpenAI API key

### Install dependencies

From the monorepo root:

```bash
pnpm install
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

### Run

```bash
pnpm --filter svelte-chat dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project structure

```
src/
├── routes/
│   ├── +page.svelte           # Chat UI with AI SDK Chat class + OpenUI Renderer
│   ├── +layout.svelte         # Root layout (imports Tailwind)
│   ├── +layout.ts             # Disables SSR (client-side rendering)
│   └── api/chat/+server.ts    # AI SDK streaming endpoint
├── lib/
│   ├── library.ts             # OpenUI component definitions (Stack, Card, TextContent, Button)
│   ├── tools.ts               # AI tool definitions (weather, stocks, math, search)
│   └── components/            # Svelte component renderers
│       ├── Stack.svelte
│       ├── Card.svelte
│       ├── TextContent.svelte
│       └── Button.svelte
└── generated/
    └── system-prompt.txt       # LLM system prompt describing the openui-lang syntax
```

## Adding components

1. Create a Svelte component in `src/lib/components/`
2. Define it with `defineComponent()` in `src/lib/library.ts`
3. Add its signature to `src/generated/system-prompt.txt`

See the [`@openuidev/svelte-lang` README](../../packages/svelte-lang/README.md) for the full API.
