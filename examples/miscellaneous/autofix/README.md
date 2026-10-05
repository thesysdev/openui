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

| File                        | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| `src/lib/autofix.ts`        | `createAutofix` from `@openuidev/server/openai` |
| `src/app/api/chat/route.ts` | OpenAI stream wrapped by Autofix                |
| `src/app/page.tsx`          | AgentInterface + `openAIAdapter()`              |

```bash
pnpm verify   # lint + production build
pnpm deploy   # openui deploy
```
