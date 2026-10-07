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

`/api/chat` streams OpenAI Chat Completions through `client.openai.completions.autofix.stream({ library: spec, stream, messages, signal }).toResponse()`. The client decodes that SSE with `openAIAdapter()`.

`createClient()` reads `THESYS_API_KEY` from the server environment. The generated library spec is passed to each Autofix operation.

| File                        | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `src/app/api/chat/route.ts` | `createClient()` and the OpenAI Autofix stream     |
| `src/library.tsx`           | Component library used to generate the server spec |
| `src/app/page.tsx`          | AgentInterface + `openAIAdapter()`                 |

```bash
pnpm verify   # lint + production build
pnpm deploy   # openui deploy
```
