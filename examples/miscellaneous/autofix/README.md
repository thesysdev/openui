# Autofix with OpenAI

A standalone Next.js **AgentInterface** example that calls OpenAI directly to generate an interface, then uses the [OpenUI Autofix API](https://www.openui.com/docs/gateway/api/autofix) only when the completed output fails validation.

Ask for a revenue summary, project status, or fitness card. OpenAI streams OpenUI Lang into the assistant reply. Valid output renders without a repair request; invalid output is repaired and replaces the preview in that same reply. Follow-up prompts use the final UI code as conversation context.

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
3. Check the final status: **Valid UI · Autofix skipped**, **Repaired automatically**, or **Repair incomplete**.
4. Ask a follow-up, such as “Change the revenue to $52,000 and add a note about growth.”
5. Expand the original output, final code, or repair diagnostics to inspect what happened.

The runtime uses real model output. It does not inject mistakes or load saved responses, so a prompt may produce valid output and skip Autofix. Deterministic broken generations live only in the test fixtures.

## How it works

```text
Natural-language prompt in AgentInterface
  → Next.js /api/chat
  → OpenAI Chat Completions (stream: true, OPENAI_API_KEY)
  → Stream OpenUI Lang into the assistant preview
  → Validate the completed generation against the component library
      Valid   → Finalize the reply; skip Autofix
      Invalid → POST /v1/autofix (stream: false, THESYS_API_KEY)
                  Success → Validate and replace the preview in the same reply
                  Failure → Preserve original code and show diagnostics
```

OpenAI receives a full OpenUI Lang system prompt from `generateSystemPrompt({ library })`, followed by recent conversation turns. It is called directly, independently of the OpenUI Gateway. Autofix receives a config message from `generateSystemPrompt({ cloud: true, library })`, the same recent conversation, and the original generated code as the final assistant turn. No top-level `library` field is sent.

The custom library defines `Card(children)`, `Header(title)`, `Text(content)`, and `Metric(label, value, detail?)`. The OpenUI CLI generates `src/generated/spec.json` from `src/library.tsx` before development, tests, and builds. Generation, validation, and repair use that same spec; `Renderer` uses the original library.

Validation happens after the model finishes: incomplete references while streaming are expected. It checks parser diagnostics, unresolved references, orphaned statements, and the root. A disconnected generation stream is an error, not an invitation to repair partial output. A successful repair is validated again before rendering. `fix_failed` preserves the original source and never renders a null result as a success.

### Chat and streaming

`AgentInterface` provides conversation starters, in-memory threads, the composer, cancellation, and request errors. Threads reset on refresh. Completed assistant turns contribute their final code to subsequent requests; reports and diagnostics are never sent as model context. Interrupted replies are excluded. A failed repair contributes its original generation so the user can ask a follow-up.

The server maps generation and repair progress to standard AG-UI events over Server-Sent Events (SSE). The client uses `fetchLLM()` for requests and `agUIAdapter()` for stream decoding, with a small wrapper that checks cancellation and rejects streams missing their final message-end event. The custom message format forwards only conversation text and final UI code to the model.

Message content carries the repair report so the custom assistant renderer can switch from the streaming preview to the final result in the same reply. This payload is specific to the example: AgentInterface's text stream appends content, so the report handles complete replacement and diagnostics. Autofix itself is a single non-streaming request.

The browser sends conversation messages and the standard AG-UI run fields. Both API keys stay on the server. The server imposes a 150-second timeout, caps generation at 100,000 characters, and retains up to 20 recent whole context turns totaling 8,000 characters. The latest user prompt must fit within 8,000 characters. Older turns are removed as needed to fit both providers' shared context budget, excluding the system/config prompt.

Cancellation uses `fetchLLM`'s abort signal and is forwarded to the OpenAI SDK and Autofix fetch. The client also checks that signal before publishing buffered events, preventing stale results after cancellation. Remote cancellation and billing depend on each service; aborting the browser request does not guarantee that all remote work stops.

### Backend configuration

`AUTOFIX_API_URL` optionally overrides `https://api.thesys.dev/v1/autofix` for a development backend that supports the config-message contract. `OPENAI_BASE_URL` optionally overrides the OpenAI SDK base URL. These settings remain server-side. This is a local reference app; add your application's authentication and request quotas before exposing its proxy publicly.

OpenAI generation and Autofix repair use separate credentials and billing. Valid output makes no Autofix request. The API's `already_valid` result is also handled if its validation differs from the local parser.

## Key files

| File                                | Purpose                                                                |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `src/library.tsx`                   | Component schemas and renderers                                        |
| `src/lib/provider.ts`               | Direct OpenAI generation and full library prompt                       |
| `src/lib/generate.ts`               | Stream, validate, repair if needed, and validate the result            |
| `src/lib/autofix.ts`                | Config-message construction and Autofix transport                      |
| `src/lib/validation.ts`             | Parser diagnostics and structural checks                               |
| `src/lib/contract.ts`               | Message schemas, response validation, and context limits               |
| `src/app/api/chat/route.ts`         | Server credentials, cancellation, timeout, and event stream            |
| `src/app/page.tsx`                  | AgentInterface shell and natural-language starters                     |
| `src/lib/autofix-chat.ts`           | Built-in transport/adapter setup, cancellation guards, and history     |
| `src/lib/chat-stream.ts`            | Map generation/repair progress to standard AG-UI events                |
| `src/components/repair-message.tsx` | Streaming preview, final replacement, and diagnostics                  |
| `tests/`                            | Provider/repair orchestration, parser, transport, and rendering checks |

## Verify

```bash
pnpm verify
```

This generates the spec, runs ESLint and local tests, and performs a production Next.js build. It requires no API keys and makes no live model calls. Tests use the real SDK, parser, and renderer with stubbed network responses. `pnpm test` runs just the tests.

## Extend it

Replace or extend `src/library.tsx` and rerun `pnpm generate`. Both model generation and repair will receive the updated component definitions. Handle runtime and tool failures separately; repairing UI code cannot restore an unavailable external service.
