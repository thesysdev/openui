# @openuidev/react-lang

Core runtime for [OpenUI](https://openui.com) — define component libraries, generate model prompts, and render structured UI from streaming LLM output.

[![npm](https://img.shields.io/npm/v/@openuidev/react-lang)](https://www.npmjs.com/package/@openuidev/react-lang)
[![npm downloads](https://img.shields.io/npm/dm/@openuidev/react-lang)](https://www.npmjs.com/package/@openuidev/react-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

## Install

```bash
npm install @openuidev/react-lang
# or
pnpm add @openuidev/react-lang
```

**Peer dependencies:** `react >=19.0.0`

## Overview

`@openuidev/react-lang` provides three core capabilities:

1. **Define components** — Use `defineComponent` and `createLibrary` to declare what the model is allowed to generate, with typed props via Zod schemas.
2. **Generate prompts** — Call `library.prompt()` to produce a system prompt that instructs the model how to emit OpenUI Lang output.
3. **Render output** — Use `<Renderer>` to parse and progressively render streamed OpenUI Lang into React components.

## Quick Start

### 1. Define a component

```tsx
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const Greeting = defineComponent({
  name: "Greeting",
  description: "Displays a greeting message",
  props: z.object({
    name: z.string().describe("The person's name"),
    mood: z.enum(["happy", "excited"]).optional().describe("Tone of the greeting"),
  }),
  component: ({ name, mood }) => (
    <div className={mood === "excited" ? "text-xl font-bold" : ""}>
      Hello, {name}!
    </div>
  ),
});
```

### 2. Create a library

```ts
import { createLibrary } from "@openuidev/react-lang";

const library = createLibrary({
  components: [Greeting, Card, Table /* ... */],
  root: "Card", // optional default root component
});
```

### 3. Generate a system prompt

```ts
const systemPrompt = library.prompt({
  preamble: "You are a helpful assistant.",
  additionalRules: ["Always greet the user by name."],
  examples: ["<Greeting name='Alice' mood='happy' />"],
});
```

### 4. Render streamed output

```tsx
import { Renderer } from "@openuidev/react-lang";

function AssistantMessage({ response, isStreaming }) {
  return (
    <Renderer
      response={response}
      library={library}
      isStreaming={isStreaming}
      onAction={(event) => console.log("Action:", event)}
    />
  );
}
```

## API Reference

### Component Definition

| Export | Description |
| :--- | :--- |
| `defineComponent(config)` | Define a single component with a name, Zod props schema, description, and React renderer |
| `createLibrary(definition)` | Create a library from an array of defined components |

### Rendering

| Export | Description |
| :--- | :--- |
| `Renderer` | React component that parses and renders OpenUI Lang output |

**`RendererProps`:**

| Prop | Type | Description |
| :--- | :--- | :--- |
| `response` | `string \| null` | Raw OpenUI Lang text from the model |
| `library` | `Library` | Component library from `createLibrary()` |
| `isStreaming` | `boolean` | Whether the model is still streaming (disables form interactions) |
| `onAction` | `(event: ActionEvent) => void` | Callback when a component triggers an action |
| `onStateUpdate` | `(state: Record<string, any>) => void` | Callback when form field values change |
| `initialState` | `Record<string, any>` | Initial form state for hydration |
| `onParseResult` | `(result: ParseResult \| null) => void` | Callback when the parse result changes |

### Parser (Server-Side)

| Export | Description |
| :--- | :--- |
| `createParser(library)` | Create a one-shot parser for complete OpenUI Lang text |
| `createStreamingParser(library)` | Create an incremental parser for streaming input |

The streaming parser exposes three methods:

| Method | Description |
| :--- | :--- |
| `push(chunk)` | Feed the next chunk; returns the latest `ParseResult` |
| `getResult()` | Get the latest result without consuming new data |
| `finalize()` | Signal stream completion; promotes unresolved references to `validationErrors` |

Call `finalize()` once after the last chunk to get the definitive result with all validation errors. Forward references are valid mid-stream, so `unresolved-ref` errors are only added at finalization.

#### Validation errors

`ParseResult.meta.validationErrors` contains structured errors from the parser. Each error includes a `rule` field for consumer-side filtering:

| Rule | Meaning |
| :--- | :--- |
| `missing-required` | Required prop absent with no default |
| `null-required` | Required prop explicitly null with no default |
| `unknown-component` | Component name not found in the library schema |
| `excess-args` | More positional args passed than the schema defines |
| `unresolved-ref` | Identifier referenced but never assigned (after `finalize()`) |

Validation errors do not affect rendering — the parser stays permissive and renders what it can. Use `rule` to decide how to surface or log errors:

```ts
const result = parser.parse(output);
const critical = result.meta.validationErrors.filter(
  (e) => e.rule === "unknown-component" || e.rule === "unresolved-ref"
);
```

### Context Hooks

Use these inside component renderers to interact with the rendering context:

| Hook | Description |
| :--- | :--- |
| `useIsStreaming()` | Whether the model is still streaming |
| `useRenderNode()` | Render child element nodes |
| `useTriggerAction()` | Trigger an action event |
| `useGetFieldValue()` | Get a form field's current value |
| `useSetFieldValue()` | Set a form field's value |
| `useSetDefaultValue()` | Set a field's default value |
| `useFormName()` | Get the current form's name |

### Form Validation

| Export | Description |
| :--- | :--- |
| `useFormValidation()` | Access form validation state |
| `useCreateFormValidation()` | Create a form validation context |
| `validate(value, rules)` | Run validation rules against a value |
| `builtInValidators` | Built-in validators (required, email, min, max, etc.) |

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
  ElementNode,
  ParseResult,
  ValidationError,
  ValidationRule,
  LibraryJSONSchema,
} from "@openuidev/react-lang";
```

## JSON Schema Output

Libraries can also produce a JSON Schema representation of their components:

```ts
const schema = library.toJSONSchema();
// schema.$defs["Card"]     → { properties: {...}, required: [...] }
// schema.$defs["Greeting"] → { properties: {...}, required: [...] }
```

## Documentation

Full documentation, guides, and the language specification are available at **[openui.com](https://openui.com)**.

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
