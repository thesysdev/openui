# Autofix with OpenAI

A standalone Next.js **AgentInterface** example that calls OpenAI directly, then wraps the stream with [`@openuidev/server`](https://www.openui.com/docs/api-reference/server) so invalid OpenUI Lang is repaired before the reply finishes.

Ask for a revenue summary, project status, or fitness card. OpenAI streams OpenUI Lang into the assistant reply. Valid output renders as-is; invalid output is repaired in the same stream. Follow-up prompts use the final UI code as conversation context.

## Getting started

Requires Node.js 20.19+ (or 22.12+) and pnpm, npm, or Bun.

```bash
cd examples/miscellaneous/autofix
pnpm install --ignore-workspace
cp .env.example .env.local
```

Set both server-side keys in `.env.local`:

```dotenv
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4.1-mini
THESYS_API_KEY=your-thesys-key
```

Get the generation key from [OpenAI](https://platform.openai.com/api-keys) and the repair key from [the Thesys console](https://console.thesys.dev/keys). `pnpm generate:apiKey` can also generate the Thesys key. `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`.

```bash
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The shell loads without credentials; submitting a prompt requires both keys. With npm or Bun, use the equivalent `install` and `run dev` commands; `--ignore-workspace` is only needed for pnpm inside this repository.

### Try it

1. Choose **Revenue summary** or ask: “Show September revenue of $48,200, up 12% from August.”
2. Watch the interface appear as OpenAI generates it.
3. If the model output is invalid, Autofix repairs it in the same reply.
4. Ask a follow-up, such as “Change the revenue to $52,000 and add a note about growth.”

The runtime uses real model output. It does not inject mistakes or load saved responses, so a prompt may produce valid output and skip Autofix.

## How it works

```text
Natural-language prompt in AgentInterface
  → Next.js /api/chat
  → OpenAI Chat Completions (stream: true, OPENAI_API_KEY)
  → @openuidev/server Autofix wrapper
      Valid   → Forward the stream as-is
      Invalid → POST /v1/autofix (THESYS_API_KEY), then append the repair
  → openAIAdapter() renders the completed OpenUI Lang
```

OpenAI receives a full OpenUI Lang system prompt from `generateSystemPrompt({ library })`, followed by recent conversation turns. It is called directly, independently of the OpenUI Gateway. The Autofix wrapper validates the completed generation against the same library spec and, when needed, sends a config-message repair request.

The custom library defines `Card(children)`, `Header(title)`, `Text(content)`, and `Metric(label, value, detail?)`. The OpenUI CLI generates `src/generated/spec.json` from `src/library.tsx` before development and builds. Generation, validation, and repair use that same spec; `Renderer` uses the original library.

### Chat and streaming

`AgentInterface` provides conversation starters, in-memory threads, the composer, cancellation, and request errors. Threads reset on refresh.

The route returns OpenAI Chat Completions SSE from `autofix.completions.stream(...).toResponse()`. The client uses `fetchLLM()` with `openAIAdapter()` and `openAIMessageFormat`. Both API keys stay on the server.

Cancellation uses `fetchLLM`'s abort signal and is forwarded to the OpenAI SDK and the Autofix wrapper.

### Backend configuration

`THESYS_API_BASE_URL` optionally overrides the Gateway origin (`https://api.thesys.dev`). `OPENAI_BASE_URL` optionally overrides the OpenAI SDK base URL. These settings remain server-side. This is a local reference app; add your application's authentication and request quotas before exposing its proxy publicly.

OpenAI generation and Autofix repair use separate credentials and billing. Valid output makes no Autofix request.

## Key files

| File                        | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `src/library.tsx`           | Component schemas and renderers                       |
| `src/lib/autofix.ts`        | `createAutofix` from `@openuidev/server/openai`       |
| `src/app/api/chat/route.ts` | OpenAI stream wrapped by `autofix.completions.stream` |
| `src/app/page.tsx`          | AgentInterface shell with `openAIAdapter()`           |

## Verify

```bash
pnpm verify
```

This generates the spec, runs ESLint, and performs a production Next.js build. It requires no API keys and makes no live model calls.

## Extend it

Replace or extend `src/library.tsx` and rerun `pnpm generate`. Both model generation and repair will receive the updated component definitions. Handle runtime and tool failures separately; repairing UI code cannot restore an unavailable external service.
