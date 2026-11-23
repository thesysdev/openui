# Google ADK

An [OpenUI](https://openui.com) example showing how to wire a
[Google Agent Development Kit (ADK)](https://github.com/google/adk-js) agent
(TypeScript) to OpenUI Cloud.

## What this demonstrates

- A Google ADK `Agent` with a `FunctionTool` (weather) running inside a Next.js
  API route via an `InMemorySessionService` + `Runner`
- The model is OpenUI Cloud via Chat Completions (`POST /v1/embed/chat/completions`).
  ADK JS has no first-party OpenAI client, so `adk-llm-bridge`'s `Custom()` adapter
  supplies a `BaseLlm`
- Bridging ADK's `runAsync` event stream into AG-UI SSE (`TEXT_MESSAGE_*`,
  `TOOL_CALL_START`/`ARGS`/`END`/`RESULT`) so OpenUI's `agUIAdapter()` can parse them
- Rendering streamed OpenUI Lang with `<AgentInterface />` and `library` from `@openuidev/intelligent-ui-library`

## Getting started

1. Install dependencies from this example directory:

   ```bash
   pnpm install --ignore-workspace
   ```

2. Mint an OpenUI Cloud key into `.env.local` (or set `THESYS_API_KEY` there):

   ```bash
   pnpm generate:apiKey
   ```

3. Run the dev server from this directory:

   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) and try a starter such as
"What's the weather like in Tokyo right now?".

## How it works

- `src/agent.ts` defines the `get_weather` tool and a `createAgent()` builder.
  The instruction is `cloudInstructions()`, which reads the generated
  Intelligent UI library spec. The model is Cloud's
  Gemini (`google/gemini-3.6-flash-free`).
- `src/app/api/chat/route.ts` runs the agent with a `Runner` and keys ADK
  sessions by chat `threadId` (so multi-turn history is preserved).
  `src/lib/adk-to-agui.ts` maps ADK `functionCall` / `functionResponse` parts
  onto AG-UI tool events (including `TOOL_CALL_RESULT`) and streams assistant
  text as `TEXT_MESSAGE_*` events.
- `src/app/page.tsx` renders `<AgentInterface />` with `fetchLLM` + `agUIAdapter()`.

To add more tools, define them with `FunctionTool` in `src/agent.ts` and pass
them to the `Agent`.

## Component library and theme

Answers use `@openuidev/intelligent-ui-library` (pinned to `0.0.2`), rooted at `Col`. `src/library.ts` re-exports its `library` and extends its `promptOptions` and `additionalRules` with form submission and conditional field rules, preserving the default examples.

`pnpm generate` runs `openui generate src/library.ts --spec --out src/generated/spec.json` before development, builds and verification. `cloudInstructions()` passes the library and prompt options separately to `generateSystemPrompt({ cloud: true, ... })`, preserving the Cloud prompt flow.

The frontend keeps `AgentInterface`, adapters, theming and styles from `@openuidev/react-ui`. The new library's `ThemeProvider` and the chat's `theme` receive the same `useSystemThemeMode()` value, so answers follow the chat in light and dark mode.

Previously saved answers using old components cannot render with this library. Start a new chat to generate answers with `Col`, `Title`, `Text`, `Chart` and the other current components.

## Learn more

- [OpenUI documentation](https://openui.com/docs)
- [Google ADK for TypeScript](https://github.com/google/adk-js)

## Verify

```bash
pnpm verify
```
