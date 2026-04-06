# @openuidev/cli

Command-line tool for [OpenUI](https://openui.com) — scaffold AI-powered generative UI chat apps and generate LLM system prompts from your React component libraries.

[![npm](https://img.shields.io/npm/v/@openuidev/cli)](https://www.npmjs.com/package/@openuidev/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

It currently supports two workflows:

- scaffolding a new OpenUI Chat app
- generating a system prompt or JSON Schema from a `createLibrary()` export

## Install

Run the CLI with your package manager of choice:

```bash
npx @openuidev/cli@latest --help
pnpm dlx @openuidev/cli@latest --help
bunx @openuidev/cli@latest --help
```

## Quick Start

Create a new chat app:

```bash
npx @openuidev/cli@latest create
```

Generate a prompt from a library file:

```bash
npx @openuidev/cli@latest generate ./src/library.ts
```

Generate JSON Schema instead:

```bash
npx @openuidev/cli@latest generate ./src/library.ts --json-schema
```

## Commands

### `openui create`

Scaffolds a new Next.js app with OpenUI Chat.

```bash
openui create [options]
```

Options:

- `-n, --name <string>`: Project name
- `--skill`: Install the OpenUI agent skill for AI coding assistants
- `--no-skill`: Skip installing the OpenUI agent skill
- `--no-interactive`: Fail instead of prompting for missing required input

What it does:

- prompts for the project name if you do not pass `--name`
- copies the bundled `openui-chat` template into a new directory
- rewrites `workspace:*` dependencies in the generated `package.json` to `latest`
- installs dependencies automatically using the detected package manager
- optionally installs the OpenUI agent skill for AI coding assistants
- prompts for your OpenAI API key and writes it to `.env` (interactive mode only)

Examples:

```bash
openui create
openui create --name my-app
openui create --name my-app --no-skill
openui create --no-interactive --name my-app
```

### `openui generate`

Generates a system prompt or JSON Schema from a file that exports a `createLibrary()` result.

```bash
openui generate [options] [entry]
```

Arguments:

- `entry`: Path to a `.ts`, `.tsx`, `.js`, or `.jsx` file that exports a library

Options:

- `-o, --out <file>`: Write output to a file instead of stdout
- `--json-schema`: Output JSON Schema instead of the system prompt
- `--export <name>`: Use a specific export name instead of auto-detecting the library export
- `--prompt-options <name>`: Use a specific `PromptOptions` export name (auto-detected by default)
- `--no-interactive`: Fail instead of prompting for a missing `entry`

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
openui generate ./src/library.ts --export library
openui generate ./src/library.ts --out ./artifacts/system-prompt.txt
openui generate ./src/library.ts --prompt-options myPromptOptions
openui generate --no-interactive ./src/library.ts
```

## How `generate` resolves exports

`openui generate` expects the target module to export a library object with both `prompt()` and `toJSONSchema()` methods.

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
node dist/index.js generate --help
```

## Notes

- interactive prompts can be cancelled without creating output
- `create` requires the template files to be present in the built package
- `generate` exits with a non-zero code if the file is missing or no valid library export is found

## Documentation

Full documentation and guides are available at **[openui.com](https://openui.com)**.

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
