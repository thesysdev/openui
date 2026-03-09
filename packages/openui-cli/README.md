# OpenUI CLI

The OpenUI CLI helps you get started with OpenUI faster.

It currently supports two workflows:

- scaffolding a new OpenUI Chat app
- generating a system prompt or JSON Schema from a `createLibrary()` export

## Install

Run the CLI with your package manager of choice:

```bash
npx @openuidev/cli --help
pnpm dlx @openuidev/cli --help
bunx @openuidev/cli --help
```

## Quick Start

Create a new chat app:

```bash
npx @openuidev/cli@latest create
```

Generate a prompt from a library file:

```bash
npx @openuidev/cli generate ./src/library.ts
```

Generate JSON Schema instead:

```bash
npx @openuidev/cli generate ./src/library.ts --json-schema
```

## Commands

### `openui create`

Scaffolds a new Next.js app with OpenUI Chat.

```bash
openui create [options]
```

Options:

- `-n, --name <string>`: Project name
- `--no-interactive`: Fail instead of prompting for missing required input

What it does:

- prompts for the project name if you do not pass `--name`
- copies the bundled `openui-chat` template into a new directory
- rewrites `workspace:*` dependencies in the generated `package.json` to `latest`
- installs dependencies automatically using the detected package manager

Examples:

```bash
openui create
openui create
openui create --no-interactive
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
- `--no-interactive`: Fail instead of prompting for a missing `entry`

What it does:

- prompts for the entry file path if you do not pass one
- bundles the entry with `esbuild` before evaluating it in Node
- supports both TypeScript and JavaScript entry files
- stubs common asset imports such as CSS, SVG, images, and fonts during bundling
- auto-detects the exported library by checking `library`, `default`, and then all exports

Examples:

```bash
openui generate ./src/library.ts
openui generate ./src/library.ts --json-schema
openui generate ./src/library.ts --export library
openui generate ./src/library.ts --out ./artifacts/system-prompt.txt
openui generate --no-interactive ./src/library.ts
```

## How `generate` resolves exports

`openui generate` expects the target module to export a library object with both `prompt()` and `toJSONSchema()` methods.

If `--export` is not provided, it looks for exports in this order:

1. `library`
2. `default`
3. any other export that matches the expected library shape

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
