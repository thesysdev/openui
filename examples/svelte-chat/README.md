# Svelte OpenUI Chat Example

A SvelteKit chat application demonstrating `@openuidev/svelte-lang` with streaming OpenAI responses rendered as interactive UI components.

## Setup

```bash
# From the repo root
pnpm install
pnpm --filter @openuidev/react-lang build
pnpm --filter @openuidev/svelte-lang build
```

Create a `.env` file in this directory:

```
OPENAI_API_KEY=sk-...
```

Run the dev server:

```bash
pnpm --filter svelte-chat dev
```

## Features

- Streaming chat with OpenAI (GPT-4)
- Real-time progressive rendering of OpenUI Lang output
- **shadcn-svelte** UI components (built on Bits UI + Tailwind CSS v4)
- 14 components: Stack, Card, Table, Chart, Form, Input, Button, TextContent, CodeBlock, Callout, Separator, Tabs, Accordion, Steps
- Form state management with field isolation
- Action events (e.g., form submission continues the conversation)
- Prompt examples and rules for reliable LLM output

## UI Framework

This example uses [shadcn-svelte](https://www.shadcn-svelte.com/) for the component renderers. The installed shadcn components are in `src/lib/components/ui/` and include: accordion, alert, badge, button, card, input, separator, and tabs.

To add more shadcn-svelte components:

```bash
cd examples/svelte-chat
npx shadcn-svelte@next add <component-name>
```

## Architecture

```
src/
├── routes/
│   ├── +page.svelte          # Chat UI with message list and input
│   └── api/chat/+server.ts   # OpenAI streaming endpoint
├── lib/
│   ├── library.ts            # Component library definition (Zod schemas)
│   └── components/
│       ├── ui/               # shadcn-svelte base components
│       │   ├── accordion/
│       │   ├── alert/
│       │   ├── badge/
│       │   ├── button/
│       │   ├── card/
│       │   ├── input/
│       │   ├── separator/
│       │   └── tabs/
│       ├── library/           # OpenUI Lang component renderers
│       │   ├── Stack.svelte
│       │   ├── Card.svelte
│       │   ├── Table.svelte
│       │   ├── Chart.svelte
│       │   ├── Form.svelte
│       │   ├── Input.svelte
│       │   ├── Button.svelte
│       │   ├── TextContent.svelte
│       │   ├── CodeBlock.svelte
│       │   ├── Callout.svelte
│       │   ├── Separator.svelte
│       │   ├── Tabs.svelte
│       │   ├── Accordion.svelte
│       │   └── Steps.svelte
│       ├── ChatMessage.svelte # Message bubble with Renderer
│       └── ChatInput.svelte   # Text input with send button
└── app.css                    # Tailwind v4 + shadcn theme
```

### How it works

1. `library.ts` defines components with Zod schemas and Svelte renderers using `defineComponent` and `createLibrary`
2. The chat API endpoint generates a system prompt from the library via `library.prompt()`, then streams OpenAI completions
3. `ChatMessage.svelte` passes the streaming text to `<Renderer>` from `@openuidev/svelte-lang`
4. The Renderer parses OpenUI Lang syntax, resolves component references, and renders the matching Svelte components
5. Interactive components (Form, Input, Button) use the context API for state management and action events

## License

MIT
