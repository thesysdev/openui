# @openuidev/angular-lang

Angular bindings for OpenUI Lang. Define model-renderable Angular components, generate prompts from those definitions, and render streamed OpenUI Lang in an Angular app.

[![npm version](https://img.shields.io/npm/v/@openuidev/angular-lang)](https://www.npmjs.com/package/@openuidev/angular-lang)
[![monthly downloads](https://img.shields.io/npm/dm/@openuidev/angular-lang)](https://www.npmjs.com/package/@openuidev/angular-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [OpenUI Lang docs](https://openui.com/docs/openui-lang) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

```bash
npm install @openuidev/angular-lang
# or
pnpm add @openuidev/angular-lang
```

**Peer dependencies:** `@angular/core`, `@angular/common`, `rxjs`, `zod`

## Overview

`@openuidev/angular-lang` brings the OpenUI Lang runtime to Angular:

1. **Define Angular components** that a model is allowed to call, with Zod schemas for props.
2. **Generate prompts** from the component library.
3. **Render streamed output** with `Renderer` / `<openui-renderer>` as OpenUI Lang arrives.

## Quick Start

### 1. Define a component

```ts
import { Component, Input } from "@angular/core";
import { defineComponent } from "@openuidev/angular-lang";
import { z } from "zod/v4";

@Component({
  selector: "demo-greeting",
  standalone: true,
  template: `<div>Hello, {{ props?.name }}!</div>`,
})
export class DemoGreetingComponent {
  @Input() props: { name: string; mood?: "happy" | "excited" } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;
}

export const Greeting = defineComponent({
  name: "Greeting",
  description: "Displays a greeting message",
  props: z.object({
    name: z.string().describe("The person's name"),
    mood: z.enum(["happy", "excited"]).optional().describe("Tone of the greeting"),
  }),
  component: DemoGreetingComponent,
});
```

### 2. Create a library

```ts
import { createLibrary } from "@openuidev/angular-lang";

export const library = createLibrary({
  components: [Greeting],
  root: "Greeting",
});
```

### 3. Generate a system prompt

```ts
const systemPrompt = library.prompt({
  preamble: "You are a helpful assistant.",
  additionalRules: ["Always greet the user by name."],
  examples: ['root = Greeting("Alice", "happy")'],
});
```

### 4. Render streamed output

```ts
import { Component } from "@angular/core";
import { Renderer } from "@openuidev/angular-lang";

@Component({
  selector: "assistant-message",
  standalone: true,
  imports: [Renderer],
  template: `
    <openui-renderer
      [response]="response"
      [library]="library"
      [isStreaming]="isStreaming"
      (action)="handleAction($event)"
    />
  `,
})
export class AssistantMessageComponent {
  response: string | null = null;
  isStreaming = false;
  library = library;

  handleAction(event: unknown) {
    console.log("Action:", event);
  }
}
```

## API Reference

### Component Definition

| Export | Description |
| :--- | :--- |
| `defineComponent(config)` | Define a single component with a name, Zod props schema, description, and Angular renderer |
| `createLibrary(definition)` | Create a library from an array of defined components |

### Rendering

| Export | Description |
| :--- | :--- |
| `Renderer` | Standalone Angular component class for OpenUI Lang rendering |
| `OpenUiRendererComponent` | Named Angular component export for the same renderer |
| `<openui-renderer>` | Renderer selector used in templates |

**`RendererProps`:**

| Prop | Type | Description |
| :--- | :--- | :--- |
| `response` | `string \| null` | Raw OpenUI Lang text from the model |
| `library` | `Library` | Component library from `createLibrary()` |
| `isStreaming` | `boolean` | Whether the model is still streaming |
| `onAction` / `(action)` | `(event: ActionEvent) => void` | Callback or output when a component triggers an action |
| `onStateUpdate` / `(stateUpdate)` | `(state: Record<string, unknown>) => void` | Callback or output when form field values change |
| `initialState` | `Record<string, unknown>` | Initial form state for hydration |
| `onParseResult` / `(parseResult)` | `(result: ParseResult \| null) => void` | Callback or output when the parse result changes |
| `toolProvider` | `Record<string, Function> \| McpClientLike \| null` | Tool provider for executing `Query()` and `Mutation()` calls |
| `queryLoader` | `Type<unknown> \| null` | Custom Angular loading component shown during query loading |
| `onError` / `(error)` | `(errors: OpenUIError[]) => void` | Callback or output for structured parser, query, and render errors |

#### Errors

`ParseResult.meta.errors` contains structured `OpenUIError` objects. Each error has a `code` for consumer-side filtering:

| Code | Meaning |
| :--- | :--- |
| `missing-required` | Required prop absent with no default |
| `null-required` | Required prop explicitly null with no default |
| `unknown-component` | Component name not found in the library schema |
| `excess-args` | More positional args passed than the schema defines |
| `tool-not-found` | A `Query()` or `Mutation()` tool was not registered |
| `tool-error` | A registered query tool threw an error |
| `mcp-error` | An MCP tool call returned an MCP error envelope |
| `render-error` | An Angular component threw during render and the last good subtree was preserved |

Errors stay structured so host apps can log them, surface them, or feed them back into an automated correction loop.

### Parser, Prompt, and Server-Side Utilities

| Export | Description |
| :--- | :--- |
| `createParser(library)` | Create a one-shot parser for complete OpenUI Lang text |
| `createStreamingParser(library)` | Create an incremental parser for streaming input |
| `generatePrompt(spec)` | Generate OpenUI prompt text from a prompt spec |
| `generateSystemPrompt(spec)` | Generate a complete system prompt |
| `mergeStatements(...)` | Merge statement fragments into stable OpenUI Lang output |
| `parse(source)` | Parse a full OpenUI Lang source string |

### Context Helpers

Use these inside Angular component renderers to interact with the OpenUI runtime.

| Helper | Description |
| :--- | :--- |
| `injectOpenUiContext()` | Access the full OpenUI runtime context |
| `injectRenderNode()` | Get the recursive child renderer |
| `injectTriggerAction()` | Trigger an action event |
| `injectIsStreaming()` | Read whether the model is still streaming |
| `injectIsQueryLoading()` | Read whether any query is currently loading |
| `injectGetFieldValue()` | Read a form field's current value |
| `injectSetFieldValue()` | Set a form field's value |
| `injectFormName()` | Get the current form name |
| `injectStore()` | Access the underlying store |
| `injectEvaluationContext()` | Access the runtime evaluation context |
| `setDefaultValue(options, context?)` | Persist a default field value once streaming finishes |

### Form Validation

| Export | Description |
| :--- | :--- |
| `injectFormValidation()` | Access form validation state |
| `createFormValidation()` | Create a validation context |
| `provideFormValidation()` | Provide validation state to Angular subtrees |
| `validate(value, rules)` | Run validation rules against a value |
| `builtInValidators` | Built-in validators such as required, email, min, and max |

### Types

```ts
import type {
  Library,
  LibraryDefinition,
  DefinedComponent,
  ComponentRenderer,
  ComponentRenderProps,
  ComponentGroup,
  PromptOptions,
  RendererProps,
  ActionEvent,
  ActionPlan,
  ElementNode,
  ParseResult,
  OpenUIError,
  LibraryJSONSchema,
  McpClientLike,
  ToolProvider,
  ValidationErrorCode,
} from "@openuidev/angular-lang";
```

## Tool Provider Support

OpenUI Lang connects to your backend through tools. You can register a `toolProvider` to handle data fetching (`Query()`) and updates (`Mutation()`) natively in Angular:

```ts
toolProvider = {
  async get_server_health() {
    const res = await fetch("/api/health");
    return res.json();
  },
  async create_ticket(args: Record<string, unknown>) {
    const res = await fetch("/api/tickets", {
      method: "POST",
      body: JSON.stringify(args),
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  },
};
```

The renderer accepts either:

- a plain async function map
- an MCP-like client with `callTool({ name, arguments })`

## Component Authoring Contract

Angular components registered with `defineComponent()` should accept these inputs:

- `props`
- `renderNode`
- `statementId`

Nested rendering, state access, query loading state, and action dispatch all flow through the injected OpenUI context.

## Testing Locally

From the workspace root:

```bash
pnpm --filter @openuidev/angular-lang test
pnpm --filter @openuidev/angular-lang typecheck
pnpm --filter @openuidev/angular-lang build
pnpm --filter @openuidev/angular-lang lint:check
pnpm --filter @openuidev/angular-lang format:check
```

Suggested manual smoke-test flow:

1. Register a tiny standalone library with two or three demo components.
2. Render a static response.
3. Render nested child references through `renderNode`.
4. Hydrate `initialState` and confirm field reads.
5. Trigger `setFieldValue()` and verify `(stateUpdate)`.
6. Execute a `Query()` through a mock `toolProvider`.
7. Execute a `Mutation()` through a `run` action step.
8. Confirm custom `queryLoader` behavior during an in-flight query.
9. Confirm `(error)` receives structured parser, tool, and render errors.

## JSON Schema Output

Libraries can also produce a JSON Schema representation of their components:

```ts
const schema = library.toJSONSchema();
// schema.$defs["Greeting"] -> { properties: {...}, required: [...] }
```

## Documentation

- [OpenUI Lang guide](https://openui.com/docs/openui-lang)
- [Language specification](https://openui.com/docs/openui-lang/specification-v05)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/angular-lang)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
