# @openuidev/vue-lang

Core runtime for [OpenUI](https://openui.com) in Vue 3 — define component libraries, generate model prompts, and render structured UI from streaming LLM output.

[![npm](https://img.shields.io/npm/v/@openuidev/vue-lang)](https://www.npmjs.com/package/@openuidev/vue-lang)
[![npm downloads](https://img.shields.io/npm/dm/@openuidev/vue-lang)](https://www.npmjs.com/package/@openuidev/vue-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

## Install

```bash
npm install @openuidev/vue-lang
# or
pnpm add @openuidev/vue-lang
```

**Peer dependencies:** `vue >=3.5.0`

## Overview

`@openuidev/vue-lang` provides three core capabilities:

1. **Define components** — Use `defineComponent` and `createLibrary` to declare what the model is allowed to generate, with typed props via Zod schemas.
2. **Generate prompts** — Call `library.prompt()` to produce a system prompt that instructs the model how to emit OpenUI Lang output.
3. **Render output** — Use `<Renderer>` to parse and progressively render streamed OpenUI Lang into Vue components.

## Quick Start

### 1. Define a component

```vue
<script setup lang="ts">
import { defineComponent, type ComponentRenderProps } from "@openuidev/vue-lang";
import { z } from "zod";

const Greeting = defineComponent({
  name: "Greeting",
  description: "Displays a greeting message",
  props: z.object({
    name: z.string().describe("The person's name"),
    mood: z.enum(["happy", "excited"]).optional().describe("Tone of the greeting"),
  }),
  component: {
    setup(compProps: ComponentRenderProps<{ name: string; mood?: string }>) {
      return () => (
        <div class={compProps.props.mood === "excited" ? "text-xl font-bold" : ""}>
          Hello, {compProps.props.name}!
        </div>
      );
    },
  },
});
</script>
```

### 2. Create a library

```ts
import { createLibrary } from "@openuidev/vue-lang";

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

```vue
<template>
  <Renderer
    :response="response"
    :library="library"
    :is-streaming="isStreaming"
    :on-action="handleAction"
  />
</template>

<script setup lang="ts">
import { Renderer } from "@openuidev/vue-lang";
</script>
```

## API Reference

### Component Definition

| Export                      | Description                                                                            |
| :-------------------------- | :------------------------------------------------------------------------------------- |
| `defineComponent(config)`   | Define a single component with a name, Zod props schema, description, and Vue renderer |
| `createLibrary(definition)` | Create a library from an array of defined components                                   |

### Rendering

| Export     | Description                                              |
| :--------- | :------------------------------------------------------- |
| `Renderer` | Vue component that parses and renders OpenUI Lang output |

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

#### Errors

`ParseResult.meta.errors` contains structured `OpenUIError` objects. Each error has a `type` discriminant (currently always `"validation"`) and a `code` for consumer-side filtering:

| Code                | Meaning                                             |
| :------------------ | :-------------------------------------------------- |
| `missing-required`  | Required prop absent with no default                |
| `null-required`     | Required prop explicitly null with no default       |
| `unknown-component` | Component name not found in the library schema      |
| `excess-args`       | More positional args passed than the schema defines |

Errors do not affect rendering — the parser stays permissive and renders what it can. Use `code` to decide how to surface or log errors:

```ts
const result = parser.parse(output);
const critical = result.meta.errors.filter((e) => e.code === "unknown-component");
```

To check for unresolved references after streaming, inspect `meta.unresolved`:

```ts
if (result.meta.unresolved.length > 0) {
  console.warn("Unresolved refs:", result.meta.unresolved);
}
```

### Composables

Use these inside component renderers to interact with the rendering context:

| Composable             | Description                          |
| :--------------------- | :----------------------------------- |
| `useIsStreaming()`     | Whether the model is still streaming |
| `useRenderNode()`      | Render child element nodes           |
| `useTriggerAction()`   | Trigger an action event              |
| `useGetFieldValue()`   | Get a form field's current value     |
| `useSetFieldValue()`   | Set a form field's value             |
| `useSetDefaultValue()` | Set a field's default value          |
| `useFormName()`        | Get the current form's name          |

### Form Validation

| Export                   | Description                                           |
| :----------------------- | :---------------------------------------------------- |
| `useFormValidation()`    | Access form validation state                          |
| `createFormValidation()` | Create a form validation context                      |
| `validate(value, rules)` | Run validation rules against a value                  |
| `builtInValidators`      | Built-in validators (required, email, min, max, etc.) |

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
  RenderNodeResult,
  SubComponentOf,
  ActionEvent,
  ElementNode,
  ParseResult,
  LibraryJSONSchema,
} from "@openuidev/vue-lang";
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
