# OpenUI + Grok Build Harness

An [OpenUI](https://openui.com) coding-agent demo backed by
[Grok Build](https://github.com/xai-org/grok-build). The app uses OpenUI's
`<AgentInterface />` for the chat surface and Grok Build's official Agent Client Protocol (ACP)
stdio mode for persistent coding sessions, live reasoning, tool activity, and cancellation.

## What this demonstrates

- A current OpenUI `<AgentInterface />` wired with `fetchLLM({ streamAdapter: agUIAdapter() })` and `openuiLibrary` from `@openuidev/react-ui`.
- One long-lived `grok agent --no-leader stdio` process hosting an isolated Grok session for each
  OpenUI thread.
- ACP text, reasoning, and tool-call updates translated to AG-UI SSE events.
- Blocking Grok Q&A and plan-approval requests rendered as browser dialogs, with responses sent
  back over ACP so the same agent turn can continue.
- Retry-safe OpenUI output buffering: valid candidates are checkpointed across retries, the final
  candidate is validated against the generated component schema, then revealed in paced chunks.
- One bounded, parser-guided correction turn when Grok's final OpenUI has syntax errors or unresolved
  references. Invalid source is never exposed as the main assistant response.
- The generated OpenUI component-library prompt injected as Grok session `rules`, preserving Grok
  Build's native coding-agent instructions and tools.
- Browser thread metadata and transcripts stored in `localStorage`, with the same UUID used for the
  persisted Grok session.

## Prerequisites

- Node.js 22 and pnpm, npm, or Bun
- The latest stable `grok` CLI on `PATH`
- A Grok login or `XAI_API_KEY`

Install Grok Build by following the
[official installation instructions](https://github.com/xai-org/grok-build#installing-the-released-binary),
then authenticate:

```bash
grok login
grok --version
```

For a non-interactive environment, set `XAI_API_KEY` instead.

## Run locally

Enter this standalone example and install its dependencies:

```bash
cd examples/harnesses/grok-build
pnpm install --ignore-workspace
```

Then start the example and choose the project Grok Build should work in:

```bash
cp .env.example .env.local
pnpm dev -- /absolute/path/to/your/project
```

Running `pnpm dev` without a path prompts for the workspace in an interactive terminal. You can
also set `GROK_BUILD_CWD=/absolute/path` in `.env.local` or the shell to skip the prompt. The
launcher validates the directory and prints the resolved workspace before starting Next.js.

Open [http://localhost:3000](http://localhost:3000) after the server starts.

## How it works

```text
Browser / OpenUI AgentInterface
  |  localStorage threads + transcript
  |  POST /api/chat { threadId, messages }
  |  GET/POST /api/interactions (questions + plan decisions)
  v
Next.js route
  |  latest user turn
  v
Grok ACP client ──► grok agent --always-approve --no-leader stdio
  |                    |  one persisted session per OpenUI thread UUID
  |                    |  repository tools + model
  |                    v
  |◄── ACP session/update: thought, text, tool_call, tool_call_update
  v
ACP-to-AG-UI bridge ──► SSE ──► AgentInterface + OpenUI renderer
```

The server starts one ACP process lazily and authenticates using the method advertised by the
installed Grok Build CLI. A new OpenUI thread creates a Grok session with the same UUID. Restored
browser threads use `session/load`, so Grok's on-disk conversation state survives a Next.js restart.
If a restored browser transcript no longer has a matching Grok session on disk, the route fails
explicitly instead of silently continuing with empty model context.

The system prompt and validation schema come from a generated `openuiLibrary` spec.
`pnpm generate` writes `src/generated/spec.json` from `src/library.ts`. `generateSystemPrompt()`
from `@openuidev/lang-core` compiles that spec locally — Grok Build is still the model (xAI), so
the Cloud sentinel is not used. The prompt is attached to `session/new` as ACP `_meta.rules`; it
teaches Grok to produce the OpenUI Lang understood by `openuiLibrary`. The schema lets the server
verify that the final candidate has a renderable `Stack` root before any assistant text reaches
the browser.

The event bridge maps Grok ACP updates as follows:

```text
agent_thought_chunk  -> Thinking tool card
tool_call            -> TOOL_CALL_START + TOOL_CALL_ARGS
tool_call_update     -> TOOL_CALL_END + TOOL_CALL_RESULT
agent_message_chunk  -> latest OpenUI candidate buffer
retry_state          -> checkpoint valid output + rotate Thinking state
prompt response      -> validate, optionally correct once, then paced TEXT_MESSAGE_CONTENT + END
```

Grok's `x.ai/ask_user_question` and `x.ai/exit_plan_mode` extension requests block the current ACP
turn until the user responds. The server registers each request in a short-lived in-memory broker;
the active browser thread polls `/api/interactions`, presents either the structured question form or
plan review, and posts the selected outcome. Cancelling the browser turn resolves any outstanding
interaction with a safe fallback so the ACP process cannot remain parked indefinitely.

Grok Build may emit progress prose and multiple full answers during one ACP prompt when an xAI
request is retried. AG-UI text deltas are append-only, so sending those candidates immediately
would concatenate them into invalid OpenUI Lang. This harness keeps only the latest line-start
`root = ...` candidate. If no valid candidate can be recovered, the harness asks Grok for one
parser-guided correction without tools. If that still fails, it renders a concise valid warning card
instead of exposing raw OpenUI or surfacing a renderer `parse-failed` warning.

OpenUI delivery rules are attached when a Grok session is created. Start a new browser thread after
changing the component library or prompt options so the corresponding Grok session gets the new
rules.

The browser transcript persists user and assistant text, matching the lightweight Eve example.
Reasoning and tool cards are streamed live but are not restored after a page reload. Deleting an
OpenUI browser thread removes its local transcript; it does not delete Grok Build's on-disk session.

Normal tool permissions are auto-approved when `GROK_BUILD_ALWAYS_APPROVE=true`. This is separate
from conversational questions and plan approval: those always require an explicit answer in the
browser dialog.

## Configuration

| Environment variable          | Default                | Purpose                                             |
| ----------------------------- | ---------------------- | --------------------------------------------------- |
| `XAI_API_KEY`                 | existing `grok login`  | Non-interactive Grok authentication                 |
| `GROK_BUILD_BIN`              | `grok`                 | Grok Build executable                               |
| `GROK_BUILD_CWD`              | launch prompt / cwd    | Workspace the coding agent can inspect and modify   |
| `GROK_BUILD_MODEL`            | CLI-configured default | Optional model override                             |
| `GROK_BUILD_REASONING_EFFORT` | CLI-configured default | Optional reasoning-effort override                  |
| `GROK_BUILD_ALWAYS_APPROVE`   | `true`                 | Auto-approve Grok tool execution in the web harness |

## Project layout

```text
examples/harnesses/grok-build/
|- scripts/launch.mjs               # Launch-time workspace selector + validation
|- src/app/page.tsx                 # OpenUI AgentInterface
|- src/app/api/chat/route.ts        # AG-UI SSE route
|- src/app/api/interactions/route.ts # Pending-interaction read/response route
|- src/components/grok-build-interaction-dialog.tsx # Question + plan UI
|- src/hooks/use-grok-build-interaction.ts # Active-thread interaction polling
|- src/lib/grok-build-acp.ts        # Grok ACP process, auth, sessions, prompts, cancellation
|- src/lib/grok-build-interactions.ts # ACP reverse-request broker and validation
|- src/lib/grok-build-stream.ts     # ACP session updates to AG-UI events
|- src/lib/openui-prompt.ts         # Compiles the generated spec into a local system prompt
|- src/lib/openui-output.ts         # Retry-safe validation, fallback, and paced output chunks
|- src/lib/grok-build-chat.ts       # AgentInterface LLM + storage adapters
|- src/lib/thread-store.ts          # localStorage thread/transcript persistence
`- src/library.ts                   # openuiLibrary re-export for \`openui generate --spec\`
```

## Security

This is a local, single-user coding-agent harness. Its API route is unauthenticated, and
`GROK_BUILD_ALWAYS_APPROVE=true` gives Grok Build permission to run tools with the server user's
filesystem and process privileges inside—and potentially beyond—`GROK_BUILD_CWD`.

Do not expose this server to a network as-is. Add authentication and authorization, run the agent
inside an OS-level sandbox or container, restrict network access and credentials, and configure
Grok's permission policy for the deployment. Setting `GROK_BUILD_ALWAYS_APPROVE=false` makes this
demo cancel permission requests because `AgentInterface` does not currently provide a Grok-specific
tool-permission approval UI; question and plan dialogs continue to work independently.

## Verify

```bash
pnpm verify
```
