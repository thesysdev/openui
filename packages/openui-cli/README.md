# @openuidev/cli

Command-line tools for starting OpenUI projects, minting OpenUI Cloud API keys, and generating model instructions from component libraries, and deploying apps to Vercel.

[![npm](https://img.shields.io/npm/v/@openuidev/cli)](https://www.npmjs.com/package/@openuidev/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [CLI docs](https://openui.com/docs/api-reference/cli) | [GitHub repo](https://github.com/thesysdev/openui)

It currently supports:

- scaffolding a new OpenUI app from one of two templates:
  - **OpenUI Cloud (recommended)** — hosted models with managed conversations, streaming, built-in tools, and ready-to-use report and presentation artifacts
  - **Self-hosted** — bring an OpenAI-compatible model key and own the AI route and persistence
- keeping the default minimal SDK route or adding a LangGraph, Vercel AI SDK, or Vercel Eve backend to either template
- minting an OpenUI Cloud API key into an existing project's env file
- generating a system prompt or JSON Schema from a `createLibrary()` export
- deploying a project with `openui deploy`

## Install

Run the CLI with your package manager of choice:

```bash
npx @openuidev/cli@latest --help
pnpm dlx @openuidev/cli@latest --help
bunx @openuidev/cli@latest --help
```

## Quick Start

Create a new app (you'll be prompted to pick a template):

```bash
npx @openuidev/cli@latest create
```

Skip the prompt and pick a template directly:

```bash
npx @openuidev/cli@latest create --template openui-cloud
npx @openuidev/cli@latest create --template openui-self-hosted
```

Choose a backend framework directly (the default is `default`, the template's minimal SDK route):

```bash
npx @openuidev/cli@latest create --template openui-cloud --backend-framework langgraph
npx @openuidev/cli@latest create --template openui-cloud --backend-framework vercel-ai-sdk
npx @openuidev/cli@latest create --template openui-cloud --backend-framework vercel-eve
npx @openuidev/cli@latest create --template openui-self-hosted --backend-framework langgraph
npx @openuidev/cli@latest create --template openui-self-hosted --backend-framework vercel-ai-sdk
npx @openuidev/cli@latest create --template openui-self-hosted --backend-framework vercel-eve
```

Mint an OpenUI Cloud API key into the current project's `.env`:

```bash
npx @openuidev/cli@latest generate-api-key
npx @openuidev/cli@latest generate-api-key --file .env.local --key THESYS_API_KEY
```

Generate a prompt from a library file:

```bash
npx @openuidev/cli@latest generate ./src/library.ts
```

Generate JSON Schema instead:

```bash
npx @openuidev/cli@latest generate ./src/library.ts --json-schema
```

Deploy the current project:

```bash
npx @openuidev/cli@latest deploy
npx @openuidev/cli@latest deploy --prod
```

## Commands

### `openui create`

Scaffolds a new Next.js agent app from the recommended managed **OpenUI Cloud** template or the **self-hosted** template.

```bash
openui create [options]
```

Options:

- `-n, --name <string>`: Project name (interactive default: `openui-agent`)
- `-t, --template <template>`: AI backend — `openui-cloud` (managed) or `openui-self-hosted` (bring your provider)
- `--backend-framework <framework>`: API route implementation — `default`, `langgraph`, `vercel-ai-sdk`, or `vercel-eve`
- `--skill`: Install the OpenUI agent skill for AI coding assistants
- `--no-skill`: Skip installing the OpenUI agent skill
- `--no-install`: Scaffold without running the package install
- `-i, --immediate`: Start the development server after installing dependencies; the CLI refuses to start when the template's required API key is unavailable
- `--no-immediate`: Install dependencies without starting the development server
- `--no-interactive`: Fail instead of prompting for missing required input
- `--api-key <key>`: (cloud template) OpenUI Cloud API key; skips sign-in
- `--auth <method>`: (cloud template) How to obtain the key — `oauth` or `skip`; `manual` remains available for backward compatibility but is deprecated
- `--agent-name <name>`: Declare the invoking coding agent as a lowercase kebab-case product slug (default: `unknown`)

`--immediate` and `--no-immediate` are mutually exclusive; passing both exits with an error.

What it does:

- prompts for the project name, defaulting to `openui-agent`, if you do not pass `--name`
- uses the `openui-cloud` template when you do not pass `--template` (interactive runs no longer ask; `--template openui-self-hosted` still works)
- prompts for a backend framework after the template; non-interactive usage defaults to `default`
- copies the bundled template into a new directory
- rewrites monorepo-local dependencies (`workspace:`, `file:`, `catalog:`) in the generated `package.json` to `latest`
- installs dependencies automatically using the detected package manager (unless `--no-install`)
- in interactive sessions, starts the development server and opens its local URL in the default browser; pass `--no-immediate` to install and exit instead
- in non-interactive sessions, installs and exits unless `--immediate` is passed
- optionally installs the OpenUI agent skill for AI coding assistants
- writes a `.env` file tailored to the template (see below)

#### Choose a backend

- **OpenUI Cloud (recommended default)** — start here for prototypes and evaluations. You get hosted models, managed conversation history and streaming, built-in tools, and ready-to-use report and presentation artifacts without operating the model, storage, or artifact infrastructure.
- **Self-hosted** — choose this when owning the OpenAI-compatible provider integration, AI route, and persistence is a requirement. It is not offered as an interactive choice; request it with `--template openui-self-hosted`.

#### Backend frameworks

Overlay names are loaded from the fetched template's `overlays/` directory (`default` is the base template with no overlay). Current templates ship:

| Value           | OpenUI Cloud route                           | Self-hosted route                        |
| --------------- | -------------------------------------------- | ---------------------------------------- |
| `default`       | Direct OpenAI SDK Responses proxy            | Direct OpenAI SDK Chat Completions proxy |
| `langgraph`     | LangGraph + Cloud provider                   | LangGraph + your provider                |
| `vercel-ai-sdk` | Vercel AI SDK Next.js agent + Cloud provider | Vercel AI SDK `streamText()` route       |
| `vercel-eve`    | Vercel Eve agent + Cloud provider            | Vercel Eve agent + your provider         |

The default implementation is part of each base template. For LangGraph or Vercel AI SDK, the CLI applies a framework-specific set of files plus a manifest for its dependencies, scripts, removals, and onboarding text. Both Vercel AI SDK variants are standard Next.js deployments whose `streamText()` result returns `toUIMessageStreamResponse()` for `vercelAIAdapter()`.

In Cloud framework variants, the selected framework owns the agent orchestration and application tool loop. OpenUI Cloud is attached as the model provider and conversation store. Reports, presentations, web search, image search, and configured MCP tools remain provider-executed Cloud tools on the default, LangGraph, and Vercel AI SDK Cloud routes, while application tools such as `get_weather` execute inside the selected framework. The Eve Cloud overlay uses Cloud as the Chat Completions provider and does not attach those provider-executed Cloud tools. Choosing a Cloud framework does not configure a user-owned model provider; choose `openui-self-hosted` for that.

The Cloud graph needs `THESYS_API_KEY`; the self-hosted graph needs the selected provider credentials such as `OPENAI_API_KEY`.

Every framework overlay includes `get_weather` as its example app-owned function tool. Ask “What’s the weather in Berlin?” to exercise the selected backend’s native tool loop.

#### Conversation storage

Every OpenUI Cloud variant uses OpenUI Cloud as its only durable conversation and artifact store. The browser connects directly through `useOpenuiCloudStorage()` with a short-lived frontend token, and `/api/chat` appends each turn to the same Cloud conversation with `conversation: threadId` and `store: true`. Vercel does not add a second store. Configure a LangGraph checkpointer separately only when the graph itself needs durable state, interrupts, or resumable runs.

The self-hosted variants do not configure durable storage. `AgentInterface` keeps the conversation in memory for the current page session and sends that history to `/api/chat`; refreshing the page loses it. Pass a storage implementation to `AgentInterface` and back it with your own database when persistence is required; add a LangGraph checkpointer only for graph-specific durable state.

#### Template-specific `.env`

- **OpenUI Cloud** — obtains an OpenUI Cloud API key and writes `THESYS_API_KEY` plus `DEMO_USER_ID=demo-user` to `.env`. The key is resolved by, in order:
  - `--api-key <key>` if provided
  - the `--auth` method, otherwise an interactive prompt offering:
    - `oauth` — sign in with Thesys in the browser and mint a key for your org
    - `skip` — leave `THESYS_API_KEY` empty and add it later (get one at <https://console.thesys.dev/keys>)
  - `--auth manual` is deprecated but remains available for backward compatibility; use `--api-key` for scripted setup instead
  - in non-interactive mode without `--api-key`, the cloud template fails because a key is required
- **Self-hosted** — prompts for your OpenAI-compatible provider API key and writes `OPENAI_API_KEY` to `.env` (interactive mode only). Leave blank to skip.

Examples:

```bash
openui create
openui create --name my-app --template openui-self-hosted
openui create --name my-app --template openui-self-hosted --backend-framework langgraph
openui create --name my-app --template openui-self-hosted --backend-framework vercel-ai-sdk
openui create --name my-app --template openui-self-hosted --backend-framework vercel-eve
openui create --name my-app --template openui-cloud --auth oauth
openui create --name my-app --template openui-cloud --backend-framework langgraph --auth oauth
openui create --name my-app --template openui-cloud --backend-framework vercel-ai-sdk --auth oauth
openui create --name my-app --template openui-cloud --backend-framework vercel-eve --auth oauth
openui create --name my-app --template openui-cloud --api-key tk_your_key
openui create --name my-app --template openui-self-hosted
openui create --name my-app --template openui-cloud --immediate
openui create --name my-app --template openui-cloud --no-immediate
openui create --name my-app --no-skill --no-install
openui create --no-interactive --name my-app --template openui-cloud --api-key tk_your_key
```

### `openui deploy`

Deploys an OpenUI project. The default platform supported is **Vercel**.

```bash
openui deploy [dir] [options]
```

Arguments:

- `dir`: Project directory (default: current directory)

Options:

- `-y, --yes`: Skip confirmation prompts (also saves missing env keys to the Vercel project)
- `--skip-env`: Do not pass or save local `.env` / `.env.local` values
- `--no-interactive`: Skip prompts (implies `--yes`)
- `--verbose`: Stream full Vercel build logs (hidden by default; failure still prints a log tail)
- `--agent-name <name>`: Declare the invoking coding agent as a lowercase kebab-case product slug (default: `unknown`)

Extra flags after `deploy` are forwarded as-is to the target deployment platform, which validates them (for example `--prod` or `--force`). `--skip-env` is OpenUI-specific so it does not collide with Vercel's `--env KEY=value`.

Unlinked projects run `vercel link` first (so env can be saved before the build). Allowlisted keys from `.env` / `.env.local` that are missing on production, preview, or development can be saved to the project (prompted; auto-accepted with `--yes`). Existing project keys are never overwritten. Env is still attached to the current deployment via `--env` / `--build-env`. Build logs are quiet by default.


```bash
openui deploy
openui deploy ./my-app
openui deploy ./my-app --prod
openui deploy --skip-env -- --force
```

### `openui generate-api-key`

Signs in with Thesys in the browser, mints an OpenUI Cloud API key, and writes it to a project env file.

```bash
openui generate-api-key [options]
```

Options:

- `-f, --file <path>`: Env file to write (default: `.env`)
- `-k, --key <name>`: Environment variable name (default: `THESYS_API_KEY`)
- `-n, --name <string>`: Name of the minted key in the Thesys console (default: `package.json` name, or the current directory name)

Examples:

```bash
openui generate-api-key
openui generate-api-key --file .env.local
openui generate-api-key --file .env.local --key THESYS_API_KEY
```

### `openui generate`

Generates a system prompt and serialized library spec from a file that exports a `createLibrary()` result. Use the spec with `generateSystemPrompt` in backend routes; the prompt file remains available for static or legacy integrations.

```bash
openui generate [options] [entry]
```

Arguments:

- `entry`: Path to a `.ts`, `.tsx`, `.js`, or `.jsx` file that exports a library

Options:

- `-o, --out <file>`: Write the prompt to a file and the spec alongside it with the extension replaced by `.spec.json`
- `--json-schema`: Output only JSON Schema instead of the prompt and spec
- `--spec`: Output only the serialized library spec
- `--export <name>`: Use a specific export name instead of auto-detecting the library export
- `--prompt-options <name>`: Use a specific `PromptOptions` export name (auto-detected by default)
- `--no-interactive`: Fail instead of prompting for a missing `entry`
- `--agent-name <name>`: Declare the invoking coding agent as a lowercase kebab-case product slug (default: `unknown`)

What it does:

- prompts for the entry file path if you do not pass one
- bundles the entry with `esbuild` before evaluating it in Node
- supports both TypeScript and JavaScript entry files
- stubs common asset imports such as CSS, SVG, images, and fonts during bundling
- auto-detects the exported library by checking `library`, `default`, and then all exports
- auto-detects a `PromptOptions` export (with `examples`, `additionalRules`, or `preamble`) and passes it to `library.prompt()`

Examples:

```bash
openui generate ./src/library.ts
openui generate ./src/library.ts --json-schema
openui generate ./src/library.ts --spec
openui generate ./src/library.ts --export library
openui generate ./src/library.ts --out ./artifacts/system-prompt.txt
openui generate ./src/library.ts --prompt-options myPromptOptions
openui generate --no-interactive ./src/library.ts
```

## How `generate` resolves exports

`openui generate` expects the target module to export a library object with `prompt()`, `toSpec()`, and `toJSONSchema()` methods.

If `--export` is not provided, it looks for exports in this order:

1. `library`
2. `default`
3. any other export that matches the expected library shape

### PromptOptions auto-detection

If `--prompt-options` is not provided, the CLI looks for a `PromptOptions` export in this order:

1. `promptOptions`
2. `options`
3. any export whose name ends with `PromptOptions` (case-insensitive)

A valid `PromptOptions` object has at least one of: `examples` (string array), `additionalRules` (string array), or `preamble` (string).

## Local Development

Build the CLI locally:

```bash
pnpm run build
```

Run the built CLI:

```bash
node dist/index.js --help
node dist/index.js create --help
node dist/index.js deploy --help
node dist/index.js generate-api-key --help
node dist/index.js generate --help
```

## Telemetry

The CLI sends usage analytics; OAuth sign-ins may link usage to your OIDC account ID. It does not send code, prompts, API keys, email, or personal names.

When a coding agent invokes the CLI, it should pass `--agent-name` using its stable, lowercase kebab-case product slug—for example, `codex`, `claude-code`, `cline`, `factory-droid`, or `pi`. Do not pass a model/version, user name, session ID, or other unique value. Humans can omit the flag; it defaults to `unknown`.

Telemetry includes both `agent_name` (the CLI declaration) and `detected_agent_name` (best-effort environment detection). Either can be spoofed, inherited, missing, or ambiguous; neither is an authentication signal. Every invocation gets an ephemeral, unpersisted `cli_run_id` so its events can be correlated. Failure events include bounded `failure_stage`, `error_class`, and `error_code` values, never raw error messages. Dependency failures distinguish peer, registry, network, install-script, workspace, and package-compatibility errors. Process failures include duration, exit code, and signal; Cloud-auth failures include a bounded auth substage and HTTP status when known; cancellations use separate events. For `create`, telemetry also includes `package_manager`, the immediate-start selection, and best-effort dev-command start and result events. Dev-command events contain status, duration, exit code, and signal—not project paths, command output, code, or environment values. For `deploy`, telemetry includes the target (currently `vercel`), production vs preview, whether the Vercel CLI was logged in, whether local env was passed, CLI resolution source, and process status—not env values, project paths, or command output. Disable telemetry with `--no-telemetry` or `DO_NOT_TRACK=1`.

```bash
openui create --no-telemetry
```

## Notes

- interactive prompts can be cancelled without creating output
- `create` fetches `templates/templates.json` and the selected template from GitHub (`thesysdev/openui@main`)
- `generate` exits with a non-zero code if the file is missing or no valid library export is found
- `deploy` exits with a non-zero code if the directory has no `package.json` or the Vercel CLI fails

## Documentation

- [CLI API reference](https://openui.com/docs/api-reference/cli)
- [Chat quick start](https://openui.com/docs/chat/quick-start)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/openui-cli)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
