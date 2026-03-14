# OpenUI React Native Example

A full-stack example that demonstrates using `@openuidev/react-lang` in a React Native (Expo) app with a Next.js API backend. The LLM streams responses in [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview) and the mobile client renders them as native components in real time.

## Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────┐
│   React Native (Expo) app   │  HTTP  │   Next.js backend (API)  │
│                             │ ──────►│                          │
│  • Chat UI                  │        │  • /api/chat  (POST)     │
│  • <Renderer /> parsing     │◄────── │  • Streams OpenUI Lang   │
│    streamed OpenUI Lang      │  stream│    from GPT              │
│  • Native chart components  │        │  • CORS enabled          │
└─────────────────────────────┘        └──────────────────────────┘
```

## Project Structure

```
openui-react-native/
├── package.json              # Root workspace scripts
└── backend/                  # Next.js API server
    ├── src/
    │   ├── library.ts        # Component library definition (Node-compatible)
    │   ├── system-prompt.txt # Auto-generated from library.ts
    │   └── app/api/chat/
    │       └── route.ts      # Streaming chat endpoint
    └── env.example
```

> The React Native app lives in a sibling `react-native-openui/` directory (not checked in here). The root `package.json` wires both together as a pnpm workspace.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- An OpenAI API key

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure the backend

```bash
cp backend/env.example backend/.env.local
```

Add your key to `backend/.env.local`:

```
OPENAI_API_KEY=sk-...
```

### 3. Generate the system prompt

The [Prompt Generator](https://www.openui.com/docs/openui-lang/overview) compiles `library.ts` into `system-prompt.txt` — containing component signatures, syntax rules, and streaming guidelines for the LLM:

```bash
pnpm generate:prompt
```

### 4. Start the backend

```bash
pnpm dev:backend
```

The API will be available at `http://localhost:3000`.

### 5. Start the mobile app

```bash
pnpm dev:mobile
```

## What's in This Example

### `backend/src/library.ts`

Defines the custom component library using [`defineComponent`](https://www.openui.com/docs/openui-lang/overview) and `createLibrary`. This is a **Node-compatible** version (renderers set to `null`) used only by the CLI to generate the system prompt — the backend never renders components itself.

The library exposes five components:

| Component   | Description                                                |
| ----------- | ---------------------------------------------------------- |
| `Card`      | Root container — every response is wrapped in one          |
| `Text`      | Text with optional `heading`, `body`, or `caption` variant |
| `BarChart`  | Vertical bar chart for comparing discrete categories       |
| `LineChart` | Line chart for trends over time                            |
| `PieChart`  | Pie chart for part-to-whole proportions                    |

### `backend/src/app/api/chat/route.ts`

A Next.js Route Handler that:

1. Loads `system-prompt.txt` at startup
2. Forwards the conversation to the OpenAI streaming API
3. Returns raw `text/plain` chunks — intentionally simpler than SSE so React Native can consume the stream directly without a browser `EventSource`

### React Native app (`react-native-openui/`)

Uses the [`<Renderer />`](https://www.openui.com/docs/openui-lang/overview) component from `@openuidev/react-lang` to progressively parse and render the streamed OpenUI Lang output as native components.

## Scripts

| Script                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `pnpm dev:backend`     | Start the Next.js API server                     |
| `pnpm dev:mobile`      | Start the Expo dev server                        |
| `pnpm generate:prompt` | Regenerate `system-prompt.txt` from `library.ts` |

## Learn More

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview) — core building blocks: Library, Prompt Generator, Parser, Renderer
- [`@openuidev/react-lang` package](../../packages/react-lang)
