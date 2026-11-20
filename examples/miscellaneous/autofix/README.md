# Autofix with OpenAI

Calls OpenAI directly and wraps the stream with [`@openuidev/server`](https://www.openui.com/docs/api-reference/server) so invalid OpenUI Lang is repaired before the reply finishes.

## Getting started

```bash
cd examples/miscellaneous/autofix
pnpm install --ignore-workspace
cp .env.example .env.local
```

Set `OPENAI_API_KEY` and `THESYS_API_KEY` in `.env.local`, then run `pnpm dev` and open [localhost:3000](http://localhost:3000).

## How it works

`/api/chat` streams OpenAI Chat Completions through `autofix.completions.stream().toResponse()`. The client decodes that SSE with `openAIAdapter()`.

| File                        | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `src/library.tsx`           | Intelligent UI library and prompt options for spec generation           |
| `src/app/api/chat/route.ts` | Local system prompt and OpenAI stream wrapped by Autofix                |
| `src/app/page.tsx`          | AgentInterface + `openAIAdapter()` with matching answer and chat themes |

## Component library and theme

Answers use `@openuidev/intelligent-ui-library` (pinned to `0.0.2`), rooted at `Col`. `src/library.tsx` re-exports its `library` and extends its `promptOptions` and `additionalRules` with form submission and conditional field rules, preserving the default examples.

`pnpm generate` runs `openui generate src/library.tsx --spec --out src/generated/spec.json` before development, builds and verification. `src/app/api/chat/route.ts` passes the library and prompt options separately to `generateSystemPrompt` in local mode; OpenAI generates the answer and OpenUI Autofix repairs invalid output.

The frontend keeps `AgentInterface`, adapters, theming and styles from `@openuidev/react-ui`. The new library's `ThemeProvider` and the chat's `theme` receive the same `useSystemThemeMode()` value, so answers follow the chat in light and dark mode.

Previously saved answers using old components cannot render with this library. Start a new chat to generate answers with `Col`, `Title`, `Text`, `Chart` and the other current components.

```bash
pnpm verify   # lint + production build
pnpm deploy   # openui deploy
```
