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

  let { props, renderNode }: ComponentRenderProps<{ name: string; mood?: "happy" | "excited" }> = $props();
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
  examples: ['User: Hi\n\nroot = Greeting("Alice", "happy")'],
});
```

### 4. Render streamed output

```svelte
<script lang="ts">
  import { Renderer } from "@openuidev/svelte-lang";
  import { library } from "$lib/library";

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

| Export                      | Description                                                                                |
| :-------------------------- | :----------------------------------------------------------------------------------------- |
| `defineComponent(config)`   | Define a single component with a name, Zod props schema, description, and Svelte component |
| `createLibrary(definition)` | Create a library from an array of defined components                                       |

### Rendering

| Export     | Description                                                 |
| :--------- | :---------------------------------------------------------- |
| `Renderer` | Svelte component that parses and renders OpenUI Lang output |

**`RendererProps`:**

| Prop            | Type                                    | Description                                                       |
| :-------------- | :-------------------------------------- | :---------------------------------------------------------------- |
| `response`      | `string \| null`                        | Raw OpenUI Lang text from the model                               |
| `library`       | `Library`                               | Component library from `createLibrary()`                          |
| `isStreaming`   | `boolean`                               | Whether the model is still streaming (disables form interactions) |
| `onAction`      | `(event: ActionEvent) => void`          | Callback when a component triggers an action                      |
| `onStateUpdate` | `(state: Record<string, any>) => void`  | Callback when form field values change                            |
| `initialState`  | `Record<string, any>`                   | Initial form state for hydration                                  |
| `onParseResult` | `(result: ParseResult \| null) => void` | Callback when the parse result changes                            |

### Children Rendering

Svelte components receive `renderNode` as a **snippet prop** (not via context). Use it to render child element nodes:

```svelte
<script lang="ts">
  import type { Snippet } from "svelte";

  let { props, renderNode }: { props: { children?: unknown }; renderNode: Snippet<[unknown]> } = $props();
</script>

<div>
  {#if props.children}
    {@render renderNode(props.children)}
  {/if}
</div>
```

### Parser (Server-Side)

| Export                          | Description                                            |
| :------------------------------ | :----------------------------------------------------- |
| `createParser(schema)`          | Create a one-shot parser for complete OpenUI Lang text |
| `createStreamingParser(schema)` | Create an incremental parser for streaming input       |

The streaming parser exposes two methods:

| Method        | Description                                           |
| :------------ | :---------------------------------------------------- |
| `push(chunk)` | Feed the next chunk; returns the latest `ParseResult` |
| `getResult()` | Get the latest result without consuming new data      |

After the stream ends, check `meta.unresolved` for any identifiers that were referenced but never defined. During streaming these are expected (forward refs) and are not treated as errors.

#### Errors

`ParseResult.meta.errors` contains structured `OpenUIError` objects. Each error has a `type` discriminant (currently always `"validation"`) and a `code` for consumer-side filtering:

| Code                | Meaning                                             |
| :------------------ | :-------------------------------------------------- |
| `missing-required`  | Required prop absent with no default                |
| `null-required`     | Required prop explicitly null with no default       |
| `unknown-component` | Component name not found in the library schema      |
| `excess-args`       | More positional args passed than the schema defines |

Errors do not affect rendering — the parser stays permissive and renders what it can:

```ts
const result = parser.parse(output);
const critical = result.meta.errors.filter((e) => e.code === "unknown-component");
```

### Context Getters

Use these inside component renderers to interact with the rendering context:

| Function                   | Returns               | Description                                                                    |
| :------------------------- | :-------------------- | :----------------------------------------------------------------------------- |
| `getOpenUIContext()`       | `OpenUIContextValue`  | Access the full context object (library, streaming state, field accessors)     |
| `getIsStreaming()`         | `() => boolean`       | Returns a getter for the streaming state — call it reactively: `isStreaming()` |
| `getTriggerAction()`       | `Function`            | Trigger an action event                                                        |
| `getGetFieldValue()`       | `Function`            | Get a form field's current value                                               |
| `getSetFieldValue()`       | `Function`            | Set a form field's value                                                       |
| `getFormName()`            | `string \| undefined` | Get the current form's name                                                    |
| `useSetDefaultValue(opts)` | `void`                | Set a field's default value once streaming completes                           |

### Form Validation

| Export                       | Description                                           |
| :--------------------------- | :---------------------------------------------------- |
| `getFormValidation()`        | Access form validation state                          |
| `createFormValidation()`     | Create a form validation context                      |
| `setFormValidationContext()` | Provide validation context to child components        |
| `validate(value, rules)`     | Run validation rules against a value                  |
| `builtInValidators`          | Built-in validators (required, email, min, max, etc.) |
| `parseRules(rules)`          | Parse a rules config object into `ParsedRule[]`       |

### Types

```ts
import type {
  // Component definition
  Library,
  LibraryDefinition,
  DefinedComponent,
  ComponentRenderer,
  ComponentRenderProps,
  ComponentGroup,
  SubComponentOf,
  PromptOptions,

  // Rendering
  RendererProps,
  OpenUIContextValue,
  ActionConfig,

  // Parser & core
  ActionEvent,
  ElementNode,
  ParseResult,
  LibraryJSONSchema,

  // Validation
  FormValidationContextValue,
  ParsedRule,
  ValidatorFn,
} from "@openuidev/svelte-lang";
```

## JSON Schema Output

Libraries can also produce a JSON Schema representation of their components:

```ts
const schema = library.toJSONSchema();
// schema.$defs["Card"]     → { properties: {...}, required: [...] }
// schema.$defs["Greeting"] → { properties: {...}, required: [...] }
```

## Differences from React

| Concern            | `react-lang`                                     | `svelte-lang`                                    |
| :----------------- | :----------------------------------------------- | :----------------------------------------------- |
| Children rendering | `renderNode` function prop returning `ReactNode` | `renderNode` **snippet** (`Snippet<[unknown]>`)  |
| Context access     | Hooks (`useIsStreaming()`, etc.)                 | Getters (`getIsStreaming()`, etc.)               |
| Error boundaries   | Class-based, preserves last valid render         | `svelte:boundary` with auto-retry on prop change |
| Reactivity         | Hooks re-run on every render                     | Runes (`$state`, `$derived`, `$effect`)          |

## Documentation

Full documentation, guides, and the language specification are available at **[openui.com](https://openui.com)**.

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
