# OpenUI + Vercel Eve Harness

A generative-UI chat application backed by a [Vercel Eve](https://github.com/vercel/eve)
agent. Eve keeps its native session and resumable-streaming protocol. OpenUI's
`eveAdapter()` from `@openuidev/react-headless` maps Eve's NDJSON stream to AG-UI.

## Notes for coding agents

This project uses the eve framework. Before writing code, read the relevant guide in `node_modules/eve/docs/`.

The hand-written `ChatLLM` in `src/eve-chat.ts` is an intentional exception to the repo's fetchLLM-first convention: there is no HTTP chat endpoint here. Its `send` drives Eve's native session protocol (`POST /eve/v1/session`, resumable NDJSON event stream) and synthesizes the AG-UI SSE stream client-side from Eve session events, so `fetchLLM` does not apply — do not migrate it. Normal HTTP chat backends should use `fetchLLM` from `@openuidev/react-ui` instead of hand-writing a `ChatLLM`.

## Prerequisites

- Node.js 24
- pnpm, npm, or Bun
- An API key for [OpenUI Cloud](https://console.thesys.dev/keys)

## Run locally

1. Enter the standalone example and install its dependencies:

   ```bash
   cd examples/agent-frameworks/vercel-eve
   pnpm install --ignore-workspace
   ```

2. Copy the example environment file and add your provider configuration:

   ```bash
   cp .env.example .env
   ```

   Set `THESYS_API_KEY` in `.env`. The Eve agent calls OpenUI Cloud Chat Completions as its model provider. Ask "What's the weather in Berlin?" to exercise the included Eve tool.

3. Start the Next.js application and embedded Eve development server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and start a conversation.

## How it works

```text
Browser / OpenUI FullScreen
  │
  ├─ POST /eve/v1/session or /eve/v1/session/:id
  ├─ GET  /eve/v1/session/:id/stream?startIndex=N
  │
  ▼
Eve HTTP channel ──► Eve agent ──► model + tools
  │
  ▼
Eve session events ──► eveAdapter() ──► OpenUI renderer
```

- `src/app/page.tsx` renders OpenUI's `<AgentInterface />` with `openuiLibrary`.
- `src/eve-chat.ts` delivers turns through Eve's HTTP session protocol, returns the raw NDJSON
  stream, and persists session cursors per OpenUI thread. `eveAdapter()` maps that stream to AG-UI.
- `agent/instructions/openui.ts` injects the generated OpenUI Lang prompt when an Eve session
  starts. `agent/instructions/identity.md` is the agent's standing identity.
- `agent/tools/get_weather.ts` is an example Eve tool (Open-Meteo). Eve's built-in
  `ask_question` is disabled so clarifying questions stay in chat text.
- `src/thread-store.ts` stores thread metadata, transcripts, continuation tokens, and stream
  positions in browser `localStorage`.

## Configuration

| Environment variable | Default                                          | Purpose                                        |
| -------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `THESYS_API_KEY`     | —                                                | OpenUI Cloud API key.                          |
| `OPENUI_MODEL`       | `google/gemini-3.6-flash-free`                   | Cloud model id for Eve's Chat Completions call. |

## Eve commands

The normal development command is `pnpm dev`. The package also exposes Eve directly:

```bash
pnpm eve:dev
pnpm eve:build
pnpm eve:start
```

For a production-style run, build both and start both. `pnpm start` runs the Eve server on port 4274 and Next.js together, because Eve's Next.js plugin forwards to that server in production:

```bash
pnpm build
pnpm start
```

## Project layout

```text
examples/agent-frameworks/vercel-eve/
|- agent/agent.ts                    # Eve model (Cloud Completions) and build config
|- agent/channels/eve.ts             # Eve HTTP session channel
|- agent/instructions/identity.md    # Standing agent identity
|- agent/instructions/openui.ts      # Generated OpenUI Lang instructions
|- agent/tools/get_weather.ts        # Example Eve tool
|- agent/tools/ask_question.ts       # Disables Eve's built-in ask_question
|- src/library.ts                    # openuiLibrary re-export for `openui generate --spec`
|- src/lib/cloud-prompt.ts           # Reads spec.json into generateSystemPrompt({ cloud: true, library })
|- src/app/page.tsx                  # OpenUI AgentInterface chat
|- src/eve-chat.ts                   # Eve session transport, eveAdapter, persistence
|- src/thread-store.ts               # Browser thread and transcript storage
|- next.config.ts                    # Installs Eve through withEve()
```

## Security

The example uses Eve's `none()` channel authentication for local development. Do not expose it
publicly in that form. Configure an authenticated Eve channel, restrict network access, and apply
the provider and tool permissions appropriate for your deployment.

## Verify

```bash
pnpm verify
```
