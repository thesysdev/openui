# @openuidev/lang-core

Framework-agnostic core for OpenUI Lang. This is the parser, prompt-generation, runtime-evaluation, and type layer used by the framework packages.

[![npm version](https://img.shields.io/npm/v/@openuidev/lang-core)](https://www.npmjs.com/package/@openuidev/lang-core)
[![monthly downloads](https://img.shields.io/npm/dm/@openuidev/lang-core)](https://www.npmjs.com/package/@openuidev/lang-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [OpenUI Lang docs](https://openui.com/docs/openui-lang) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

```bash
npm install @openuidev/lang-core
# or
pnpm add @openuidev/lang-core
```

## What this package does

`@openuidev/lang-core` has no React, Vue, or Svelte dependency. Use it when you need to:

- **Parse** OpenUI Lang text into a typed element tree (one-shot or streaming)
- **Generate system prompts** from a component spec + tool definitions
- **Evaluate** reactive expressions, `$variables`, and query results at runtime
- **Merge** incremental edits into existing programs

If you're building a framework-specific app, use `@openuidev/react-lang`, `@openuidev/vue-lang` or `@openuidev/svelte-lang` instead. It re-exports everything from this package plus framework-specific components and hooks.

## Quick Start

### Parse OpenUI Lang

```ts
import { createParser } from "@openuidev/lang-core";

const parser = createParser(libraryJsonSchema);
const result = parser.parse(`
root = Stack([header, content])
header = CardHeader("Hello")
content = TextContent("World")
`);

console.log(result.root);       // ElementNode tree
console.log(result.meta);       // { incomplete, unresolved, statementCount, validationErrors }
```

### Streaming parser

```ts
import { createStreamingParser } from "@openuidev/lang-core";

const sp = createStreamingParser(libraryJsonSchema);

// Feed chunks as they arrive from the LLM
const result1 = sp.set("root = Stack([header])\n");
const result2 = sp.set("root = Stack([header])\nheader = CardHeader(\"Hello\")\n");
// result2.root now resolves the forward reference
```

### Generate a system prompt

```ts
import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import librarySpec from "./generated/library.spec.json";

const prompt = generateSystemPrompt({
  library: librarySpec as LibrarySpec,
  promptOptions: {
    tools: myToolSpecs,
    toolCalls: true,
    bindings: true,
    editMode: true,
    preamble: "You build dashboards.",
  },
});
```

### OpenUI Cloud

Pass `cloud: true` to emit Cloud's managed config block instead of a local prompt. OpenUI Cloud
assembles the real system prompt on the server.

```ts
import { generateSystemPrompt } from "@openuidev/lang-core";

// Built-in Cloud chat library
const instructions = generateSystemPrompt({ cloud: true });

// Using your own library (the `.spec.json` from `openui generate`)
const myLibraryPrompt = generateSystemPrompt({
  cloud: true,
  library: librarySpec,
  promptOptions: { preamble: "You build dashboards for Acme." },
  instructions: "Be terse.",
});
```

Enable managed slides and reports with `artifactTool` from the Cloud subpath:

```ts
import { artifactTool } from "@openuidev/lang-core/cloud";

const tools = [
  artifactTool({ artifacts: ["slides", "report"] }),
  { type: "web_search" },
];
```

### Merge incremental edits

```ts
import { mergeStatements } from "@openuidev/lang-core";

const original = `root = Stack([header, tbl])\nheader = CardHeader("Tickets")\ntbl = Table([...])`;
const patch = `root = Stack([header, chart, tbl])\nchart = PieChart(...)`;
const merged = mergeStatements(original, patch);
// header and tbl kept from original, root replaced, chart added
```

## API

### Parser

| Export | Description |
| :--- | :--- |
| `createParser(schema)` | One-shot parser for complete text |
| `createStreamingParser(schema)` | Incremental parser for streaming input |
| `parse(input, schema)` | Convenience one-shot parse |

### Prompt Generation

| Export | Description |
| :--- | :--- |
| `generatePrompt(spec)` | Generate a system prompt from a `PromptSpec` (now deprecated) |
| `generateSystemPrompt(spec)` | Generate a system prompt from `{ library, promptOptions }`. Pass `{ cloud: true }` for OpenUI Cloud's managed config. |

**`PromptSpec`** includes component signatures, tool definitions (`ToolSpec[]`), feature flags (`toolCalls`, `bindings`, `editMode`, `inlineMode`), examples, and custom rules.

**`ToolSpec`** describes a tool for prompt generation (name, description, inputSchema, outputSchema). Shape inspired by MCP's tool schema.

### OpenUI Cloud

| Export | Description |
| :--- | :--- |
| `artifactTool(options?)` | From `@openuidev/lang-core/cloud`. Responses `tools[]` entry for Cloud's managed slides/report artifacts. |

## Telemetry

Lang Core sends pseudonymous installation telemetry during `postinstall`.
Runtime usage telemetry is opt-in: set `OPENUI_RUNTIME_TELEMETRY_ENABLED=1` to allow
limited telemetry from 10% of eligible server-side `generateSystemPrompt()` and
`createParser().parse()` calls. Parser events include only the outcome, incomplete/root
booleans, structural counts, fixed validation error-code counts, runtime metadata, and
an optional locally hashed project identifier. They do not include OpenUI Lang source,
schemas, component/prop/statement names, validation messages or paths, unresolved or
orphaned names, exception content, credentials, application-user identifiers, or chat
data. Browser and worker runtimes do not send runtime telemetry. Direct low-level
`parse()` and streaming-parser calls are not included in the parser event.

Capture servers can observe standard network metadata such as source IP even though
it is not included in event properties.

Set `OPENUI_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1` to disable telemetry
(these also override `OPENUI_RUNTIME_TELEMETRY_ENABLED`). Set
`OPENUI_TELEMETRY_DEBUG=1` to print the installation payload to stdout without
sending it.

### Runtime

| Export | Description |
| :--- | :--- |
| `createQueryManager(toolProvider)` | Manages Query/Mutation execution and caching |
| `createStore()` | Reactive store for `$variables` and form state |
| `evaluate(ast, context)` | Evaluate an AST node to a concrete value |
| `evaluateElementProps(root, context)` | Recursively evaluate all props in an element tree |
| `extractToolResult(result)` | Extract data from an MCP `callTool` response |
| `mergeStatements(original, patch)` | Merge incremental edits by statement name |

### Types

```ts
import type {
  PromptSpec,
  ToolSpec,
  ParseResult,
  ElementNode,
  ToolProvider,
  McpClientLike,
  QueryManager,
  Store,
  OpenUIError,
} from "@openuidev/lang-core";
```

## Documentation

- [OpenUI Lang guide](https://openui.com/docs/openui-lang)
- [Language specification](https://openui.com/docs/openui-lang/specification-v05)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/lang-core)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
