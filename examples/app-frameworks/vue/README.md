# OpenUI Vue Chat

A chat application built with [Nuxt 3](https://nuxt.com), [Vercel AI SDK](https://ai-sdk.dev), and [`@openuidev/vue-lang`](../../../packages/vue-lang/) — demonstrating how to render structured LLM output as live Vue components.

## How it works

1. **User sends a message** via the chat input
2. **Server streams a response** using the Vercel AI SDK with OpenAI, guided by a system prompt written in openui-lang syntax
3. **`@openuidev/vue-lang` Renderer** parses the streaming openui-lang text and renders it as Vue components in real time
4. **Tool calls** (weather, stocks, math, web search) are displayed inline with status indicators

## Setup

### Prerequisites

- Node.js 18+
- pnpm, npm, or Bun
- An OpenUI Cloud API key (https://console.thesys.dev/keys)

### Install dependencies

From this example directory:

```bash
pnpm install --ignore-workspace
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenUI Cloud API key:

```
THESYS_API_KEY=sk-th-...
```

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app.vue                        # Root component (renders NuxtPage)
nuxt.config.ts                 # Nuxt config (ssr: false, Tailwind CSS, Nitro bundling)
pages/
└── index.vue                  # Chat UI with AI SDK Chat class + OpenUI Renderer
components/
├── ChatHeader.vue             # Top bar with title
├── ChatInput.vue              # Message input + send/stop buttons
├── UserMessage.vue            # Renders user message parts
├── AssistantMessage.vue       # Renders assistant message with OpenUI Renderer
├── LoadingIndicator.vue       # Animated loading dots
├── WelcomeScreen.vue          # Start page with example prompts
└── openui/                    # Vue component renderers for openui-lang output
    ├── Stack.vue
    ├── Card.vue
    ├── TextContent.vue
    ├── Button.vue
    └── Chart.vue
lib/
├── define-library.ts          # Shared schemas (server cannot import .vue files)
├── library.ts                 # Vue renderers wired onto those schemas
└── tools.ts                   # AI tool definitions (weather, stocks, math, search)
server/
└── api/chat.post.ts           # AI SDK streaming endpoint
assets/
└── app.css                    # Tailwind CSS entry point
```

## Adding components

1. Create a Vue component in `components/openui/`
2. Register it in `lib/define-library.ts` and wire the Vue file in `lib/library.ts`
3. Restart the dev server so the chat route picks up the new spec

See the [`@openuidev/vue-lang` README](../../../packages/vue-lang/README.md) for the full API.

## Verify

```bash
pnpm verify
```
