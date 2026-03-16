# @openuidev/svelte-lang

Svelte 5 runtime for [OpenUI](https://openui.com) — define component libraries, generate model prompts, and render structured UI from streaming LLM output.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

## Install

```bash
npm install @openuidev/svelte-lang
# or
pnpm add @openuidev/svelte-lang
```

**Peer dependencies:** `svelte >=5.0.0`

## Overview

`@openuidev/svelte-lang` provides three core capabilities:

1. **Define components** — Use `defineComponent` and `createLibrary` to declare what the model is allowed to generate, with typed props via Zod schemas.
2. **Generate prompts** — Call `library.prompt()` to produce a system prompt that instructs the model how to emit OpenUI Lang output.
3. **Render output** — Use `<Renderer>` to parse and progressively render streamed OpenUI Lang into Svelte components.

## Quick Start

### 1. Define a component

```svelte
<!-- Greeting.svelte -->
<script lang="ts">
  import type { ComponentRenderProps } from "@openuidev/svelte-lang";

  let { props }: ComponentRenderProps<{ name: string; mood?: "happy" | "excited" }> = $props();
</script>

<div class={props.mood === "excited" ? "text-xl font-bold" : ""}>
  Hello, {props.name}!
</div>
```

```ts
import { defineComponent } from "@openuidev/svelte-lang";
import { z } from "zod";
import Greeting from "./Greeting.svelte";

const GreetingDef = defineComponent({
  name: "Greeting",
  description: "Displays a greeting message",
  props: z.object({
    name: z.string().describe("The person's name"),
    mood: z.enum(["happy", "excited"]).optional().describe("Tone of the greeting"),
  }),
  component: Greeting,
});
```

### 2. Create a library

```ts
import { createLibrary } from "@openuidev/svelte-lang";

const library = createLibrary({
  components: [GreetingDef, CardDef, TableDef /* ... */],
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

```svelte
<script lang="ts">
  import { Renderer } from "@openuidev/svelte-lang";

  let { response, isStreaming }: { response: string | null; isStreaming: boolean } = $props();
</script>

<Renderer
  {response}
  {library}
  {isStreaming}
  onAction={(event) => console.log("Action:", event)}
/>
```

## API Reference

### Component Definition

| Export | Description |
| :--- | :--- |
| `defineComponent(config)` | Define a single component with a name, Zod props schema, description, and Svelte component |
| `createLibrary(definition)` | Create a library from an array of defined components |

### Rendering

| Export | Description |
| :--- | :--- |
| `Renderer` | Svelte component that parses and renders OpenUI Lang output |

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

### Context Getters

Use these inside component renderers to interact with the rendering context:

| Function | Description |
| :--- | :--- |
| `getIsStreaming()` | Whether the model is still streaming |
| `getTriggerAction()` | Trigger an action event |
| `getGetFieldValue()` | Get a form field's current value |
| `getSetFieldValue()` | Set a form field's value |
| `useSetDefaultValue()` | Set a field's default value |
| `getFormName()` | Get the current form's name |

> **Note:** Svelte components receive `renderNode` as a snippet prop instead of via context. This avoids stale-closure issues and is idiomatic Svelte 5.

### Form Validation

| Export | Description |
| :--- | :--- |
| `getFormValidation()` | Access form validation state |
| `createFormValidation()` | Create a form validation context |
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
  LibraryJSONSchema,
} from "@openuidev/svelte-lang";
```

## JSON Schema Output

Libraries can also produce a JSON Schema representation of their components:

```ts
const schema = library.toJSONSchema();
// schema["$defs"]["Card"]     → { properties: {...}, required: [...] }
// schema["$defs"]["Greeting"] → { properties: {...}, required: [...] }
```

## Documentation

Full documentation, guides, and the language specification are available at **[openui.com](https://openui.com)**.

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
