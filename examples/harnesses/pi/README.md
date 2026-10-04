# OpenUI + Pi Agent Harness

A generative-UI frontend where you chat with the **Pi coding agent** and get **generative UI**
answers — live React components instead of plain markdown — rendered with
[OpenUI](https://openui.com).

The App-Router route `src/app/api/chat/route.ts` _is_ the backend bridge to the Pi SDK
([`@earendil-works/pi-coding-agent`](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)),
so there's no second server and no CORS. Unlike the other examples, the "agent" here is a real
coding agent with `read` / `bash` / `edit` / `write` tools that act on a workspace you choose at
launch — see **Security** below.

## How it works

```
 Browser (src/app/page.tsx)
   AgentInterface   ──POST /api/chat ({ messages, threadId })──►  route.ts (runtime=nodejs)
   + openuiLibrary                                                              │
   renderer  ◄──NDJSON OpenAI chunks (delta.content = OpenUI Lang)───────────────┤
                                                                           ▼
                                                          src/lib/pi-session.ts
                                                          Map<threadId, AgentSession>
                                                                           │
                                          createAgentSession({
                                            model: OpenUI Cloud Completions,
                                            appendSystemPrompt: cloudInstructions()
                                          })
                                                                           │
                                          session.subscribe() → text/thinking/tool events
                                          session.prompt(lastUserText)     ▼
                                                            Pi SDK (read/bash/edit/write)
                                                            operating on the server cwd
```

- **Transport:** the frontend's `openAIReadableStreamAdapter()` parses **NDJSON** OpenAI
  `chat.completion.chunk`s (one JSON object per line). The route translates pi's `text_delta`
  events into `delta.content`, and pi's reasoning + tool executions into `delta.tool_calls`.
- **System prompt:** `pnpm generate` writes `src/generated/spec.json` from `openuiLibrary`.
  `cloudInstructions()` reads that spec and passes it to `generateSystemPrompt({ cloud: true, library })`
  from `@openuidev/lang-core`, so the Cloud prompt matches `openuiLibrary` on the client.
- **Model:** Pi calls OpenUI Cloud Chat Completions (`https://api.thesys.dev/v1/embed`) with
  `THESYS_API_KEY`. The default model is `google/gemini-3.6-flash-free`.
- **Sessions:** each chat thread (a stable `threadId` from `fetchLLM`) maps to
  one persistent Pi `AgentSession`, so multi-turn context is preserved.

## Prerequisites

All you need is an **[OpenUI Cloud](https://console.thesys.dev/keys)** API key. You do **not**
need the Pi CLI installed — this app embeds the Pi SDK and points it at Cloud Completions.

Copy `.env.example` to `.env` and set `THESYS_API_KEY`. Optional: `OPENUI_MODEL` (default
`google/gemini-3.6-flash-free`).

## Run

Enter this standalone example and install its dependencies:

```bash
cd examples/harnesses/pi
pnpm install --ignore-workspace
```

Then, from this example, set your Cloud key and point the agent at a project to work on:

```bash
cp .env.example .env   # set THESYS_API_KEY

# Point the agent at the project you want it to work on:
pnpm dev -- /path/to/your/project
```

`pnpm dev` (no path) prompts you for the workspace; `PI_AGENT_CWD=/path pnpm dev` sets it without a
prompt. The launcher prints the resolved workspace before the server starts. (`build` doesn't need
a workspace — the agent only runs at request time, i.e. under `dev`/`start`.)

Then open the printed URL (default http://localhost:3000). Try:

- "Show me a card summarizing the files in this directory" → renders live OpenUI components.
- "Read package.json and list its scripts" → pi's `read` tool runs (you'll see a tool card).

Production:

```bash
pnpm build && pnpm start
```

## Configuration

| Env var          | Default                         | Purpose                                              |
| ---------------- | ------------------------------- | ---------------------------------------------------- |
| `THESYS_API_KEY` | —                               | OpenUI Cloud API key                                 |
| `OPENUI_MODEL`   | `google/gemini-3.6-flash-free`  | Cloud model id Pi sends to Completions               |
| `PI_AGENT_CWD`   | `process.cwd()`                 | Workspace directory the coding agent reads/writes in |
| `PI_WEB_TOOLS`   | `full`                          | Set to `read-only` to disable `bash`/`edit`/`write`  |
| `PORT`           | `3000`                          | Dev/prod server port                                 |

## Thinking states

The model's reasoning (a streaming "Thinking" card) and each tool run (`read`/`bash`/`edit`/`write`
with its input) are forwarded as `tool_calls` and render in OpenUI's collapsible "behind the
scenes" section, like the Pi CLI. The "Thinking" card only appears when your model emits
reasoning. Tool _results_ (command output) aren't shown yet — OpenUI's streaming path renders
tool calls but not inline results; surfacing those needs a custom adapter/renderer.

## Why `--webpack`

The Pi SDK is an **ESM-only** package (its `exports` map has no `require` entry) and a Node-only
chain that spawns bash, uses `import.meta`, and reads its own prompt/skill/theme files from disk —
it must run as a real Node module at runtime, never bundled. `src/lib/pi-session.ts` loads it via
a native dynamic `import()`, and `next.config.ts` marks it as an external so the bundler keeps it
that way. The dev/build scripts use `--webpack` because this external setup is the most reliable;
you can experiment with the default Turbopack + `serverExternalPackages` if you prefer.

## Notes & limitations

- **One turn at a time per conversation.** A second request on a conversation whose turn is still
  streaming gets a "please wait" notice rather than interrupting the in-flight turn.
- **In-memory, single-instance sessions.** They're pinned to `globalThis` (so they survive dev
  hot-reload) but reset on a full restart and aren't shared across server processes.

## Security

**This endpoint runs a real coding agent and is unauthenticated.** By default the agent has the
full toolset (`read`, `bash`, `edit`, `write`) and tools execute with **no human approval** (the
interactive approval prompt only exists in the Pi TUI). It runs with the launching user's
permissions on `PI_AGENT_CWD`, and `bash` is **not** confined to that directory. Treat the
ability to reach this port as remote code execution.

- **Local, single-user use** (the default) is equivalent to running the Pi CLI yourself — fine.
- **Any networked / shared / multi-user exposure requires protection.** At minimum:
  - set `PI_WEB_TOOLS=read-only` to disable `bash`/`edit`/`write`;
  - put it behind authentication / a reverse proxy and bind to loopback
    (`next start -H 127.0.0.1`) instead of the default `0.0.0.0`;
  - run the agent in an OS-level sandbox/container with dropped privileges and no network.

`PI_AGENT_CWD` is a discovery root, **not** a security boundary — `bash` can escape it.

## Verify

```bash
pnpm verify
```
