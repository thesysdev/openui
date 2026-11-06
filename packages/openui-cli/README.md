# @openuidev/cli

Command-line tools for starting OpenUI projects, minting OpenUI Cloud API keys, generating model instructions from component libraries, and deploying apps to Vercel.

[![npm](https://img.shields.io/npm/v/@openuidev/cli)](https://www.npmjs.com/package/@openuidev/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [CLI docs](https://openui.com/docs/api-reference/cli) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

Run the CLI with your package manager of choice:

```bash
npx @openuidev/cli@latest --help
pnpm dlx @openuidev/cli@latest --help
bunx @openuidev/cli@latest --help
yarn dlx @openuidev/cli@latest --help
```

## Quick start

```bash
# Create an app (prompts for anything you don't pass)
npx @openuidev/cli@latest create

# Mint an OpenUI Cloud API key into the current project's .env
npx @openuidev/cli@latest generate-api-key

# Generate a system prompt from a component library
npx @openuidev/cli@latest generate ./src/library.ts

# Deploy the current project to Vercel
npx @openuidev/cli@latest deploy
```

## Global options

- `--agent-name <name>`: Coding agents: declare your product slug, e.g. `codex` or `claude-code` (see [Coding agents](#coding-agents))
- `--verbose`: Stream full command logs
- `--no-telemetry`: Disable usage analytics (`DO_NOT_TRACK=1` also works)
- `-V, --version`: Print the CLI version

## Commands

### `openui create`

Scaffolds a generative UI agent with Next.js and your choice of agent framework. No account or API key is needed to scaffold; add the key afterwards with `openui generate-api-key`.

```bash
openui create [directory] [options]
```

Options:

- `-n, --name <string>`: Project name (default: `openui-agent`)
- `--backend-framework <framework>`: `langgraph` (default), `vercel-ai-sdk`, or `vercel-eve`
- `-e, --example <example>`: Scaffold an OpenUI example instead (see below)
- `--no-skill`: Skip the [OpenUI agent skill](https://www.openui.com/docs/mcp#install-via-the-skills-cli-recommended) for AI coding assistants
- `--no-install`: Scaffold without installing dependencies
- `-i, --immediate` / `--no-immediate`: Start, or don't start, the development server after installing
- `--no-interactive`: Never prompt; use defaults for anything not passed

Backend frameworks:

| Value           | Description                                |
| --------------- | ------------------------------------------ |
| `langgraph`     | LangGraph agent                            |
| `vercel-ai-sdk` | Vercel AI SDK agent                        |
| `vercel-eve`    | Eve agent rendered through Agent Interface |

Examples are loaded from [OpenUI Examples](https://github.com/thesysdev/openui/blob/main/examples). Pass `--example <name>` with any catalog folder name; it can't be combined with `--backend-framework`.

In a terminal, `create` prompts for anything you didn't pass and installs dependencies. As the last step, it asks you to press any key to sign in with Thesys, mints an API key into `.env`, and starts the development server. A `THESYS_API_KEY` already exported in your shell skips sign-in. Examples work the same way, except ones with several apps (such as `fastapi` or `react-native`), which print the steps for each app instead.

When nobody can answer prompts (`--no-interactive`, no terminal attached, or a coding agent running the CLI), it takes the defaults instead: `langgraph` and `openui-agent` (or the next free `openui-agent-<n>`). It installs dependencies without starting the server, skips Cloud sign-in, and ends with the `generate-api-key` command to run next. An explicit `--name` that already exists is an error.

Pass `.` as the directory (`openui create .`) to scaffold into the current folder instead; it must be empty apart from editor or agent folders such as `.git`, `.vscode` or `.claude`, and the project is named after the folder.

Examples:

```bash
openui create
openui create .
openui create --name my-app --backend-framework vercel-ai-sdk
openui create --name my-app --example shadcn
openui create --no-interactive --name my-app
```

### `openui deploy`

Deploys an OpenUI project to Vercel.

```bash
openui deploy [dir] [options]
```

Arguments:

- `dir`: Project directory (default: current directory)

Options:

- `-y, --yes`: Skip confirmation prompts and save missing env keys to the Vercel project
- `--skip-env`: Don't pass or save local `.env` / `.env.local` values
- `--no-interactive`: Skip prompts (implies `--yes`)

Any other flags, such as `--prod`, are passed through to Vercel. Unlinked projects are linked first.

```bash
openui deploy
openui deploy ./my-app --prod
openui deploy --skip-env -- --force
```

### `openui generate-api-key`

Signs in with Thesys in the browser, mints an OpenUI Cloud API key, and writes it to an env file in the current project. It needs an interactive terminal; without one it exits with the command to run yourself.

```bash
openui generate-api-key [options]
```

Options:

- `-f, --file <path>`: Env file to write (default: `.env`)
- `-k, --key <name>`: Environment variable name (default: `THESYS_API_KEY`)
- `-n, --name <string>`: Name of the key in the Thesys console (default: the `package.json` name, or the directory name)

```bash
openui generate-api-key
openui generate-api-key --file .env.local
```

### `openui generate`

Generates a system prompt and serialized library spec from a file that exports a `createLibrary()` result. Use the spec with `generateSystemPrompt` in backend routes.

```bash
openui generate [options] [entry]
```

Arguments:

- `entry`: Path to a `.ts`, `.tsx`, `.js`, or `.jsx` file that exports a library

Options:

- `-o, --out <file>`: Write the prompt to a file, with the spec alongside it as `.spec.json`
- `--json-schema`: Output only the JSON Schema
- `--spec`: Output only the serialized library spec
- `--export <name>`: Library export to use (default: `library`, then `default`, then any library export)
- `--prompt-options <name>`: `PromptOptions` export to use (default: `promptOptions`, then `options`, then any export ending in `PromptOptions`)
- `--no-interactive`: Fail instead of prompting for a missing `entry`

```bash
openui generate ./src/library.ts
openui generate ./src/library.ts --out ./src/generated/system-prompt.txt
openui generate ./src/library.ts --spec
openui generate ./src/library.ts --json-schema
openui generate ./src/library.ts --export myLibrary --prompt-options myPromptOptions
```

### `openui setup-agent`

Adds OpenUI instructions for coding agents to an existing project. It appends the [OpenUI skill](https://github.com/thesysdev/skills) to `AGENTS.md`, or creates the file. Running it again refreshes the OpenUI instructions and leaves the rest of the file alone. Projects made with `create` already have it.

```bash
openui setup-agent [directory]
```

`directory` defaults to the current folder.

### `openui feedback`

Sends anonymous feedback to the OpenUI team. It isn't linked to your account, device, or IP address, and it's sent even when telemetry is disabled. Don't include personal data, secrets, or code.

```bash
openui feedback [options] <message...>
```

Options:

- `-c, --category <category>`: `bug`, `feature`, `docs`, or `other`

```bash
openui feedback "The streaming docs don't explain how to handle partial components"
openui --agent-name codex feedback --category bug "Renderer throws when a streamed component closes before its props"
```

## Coding agents

Coding agents should pass `--agent-name` with their stable, lowercase kebab-case product slug, such as `codex`, `claude-code`, `cline`, `factory-droid`, or `pi`. Don't pass a model version, user name, or session ID. Humans can omit it.

`create` never waits on a prompt when an agent runs it, whether or not `--agent-name` is passed. It takes the non-interactive defaults, prints any follow-up commands at the end, and points the agent at the new project's README to get started.

## Telemetry

The CLI sends usage analytics: which commands and flags are used, and bounded failure codes. Browser sign-in may link usage to your Thesys account ID. It never sends code, prompts, API keys, env values, project paths, or command output. Disable it with `--no-telemetry` or `DO_NOT_TRACK=1`.

## Documentation

- [CLI API reference](https://openui.com/docs/api-reference/cli)
- [Chat quick start](https://openui.com/docs/chat/quick-start)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/openui-cli)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
