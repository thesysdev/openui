# @openuidev/solid-lang

Core runtime for [OpenUI](https://openui.com) in SolidJS — define component libraries, generate model prompts, and render structured UI from streaming LLM output.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

## Install

```bash
npm install @openuidev/solid-lang
# or
pnpm add @openuidev/solid-lang
```

**Peer dependencies:** `solid-js >=1.9.0`

## Overview

`@openuidev/solid-lang` provides three core capabilities:

1. **Define components** — Use `defineComponent` and `createLibrary` to declare what the model is allowed to generate, with typed props via Zod schemas.
2. **Generate prompts** — Call `library.prompt()` to produce a system prompt that instructs the model how to emit OpenUI Lang output.
3. **Render output** — Use `<Renderer>` to parse and progressively render streamed OpenUI Lang into SolidJS components.

## Quick Start

### 1. Define a component

```tsx
import { defineComponent } from "@openuidev/solid-lang";
import { z } from "zod";

const Greeting = defineComponent({
  name: "Greeting",
  description: "Displays a greeting message",
  props: z.object({
    name: z.string().describe("The person's name"),
    mood: z.enum(["happy", "excited"]).optional().describe("Tone of the greeting"),
  }),
  component: ({ props }) => (
    <div class={props.mood === "excited" ? "text-xl font-bold" : ""}>Hello, {props.name}!</div>
  ),
});
```

### 2. Create a library

```ts
import { createLibrary } from "@openuidev/solid-lang";

const library = createLibrary({
  components: [Greeting, Card, Table /* ... */],
  root: "Card",
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

```tsx
import { Renderer } from "@openuidev/solid-lang";

<Renderer
  response={response}
  library={library}
  isStreaming={isStreaming}
  onAction={(event) => console.log("Action:", event)}
/>;
```

## API Reference

### Component Definition

| Export                      | Description                                                                             |
| :-------------------------- | :-------------------------------------------------------------------------------------- |
| `defineComponent(config)`   | Define a single component with a name, Zod props schema, description, and Solid renderer |
| `createLibrary(definition)` | Create a library from an array of defined components                                    |

### Rendering

| Export     | Description                                                |
| :--------- | :--------------------------------------------------------- |
| `Renderer` | Solid component that parses and renders OpenUI Lang output |

### Context helpers

Use these inside component renderers to interact with the rendering context:

- `useOpenUI()`
- `useRenderNode()`
- `useTriggerAction()`
- `useIsStreaming()`
- `useGetFieldValue()`
- `useSetFieldValue()`
- `useSetDefaultValue()`
- `useFormName()`

### Form Validation

| Export                   | Description                                           |
| :----------------------- | :---------------------------------------------------- |
| `useFormValidation()`    | Access form validation state                          |
| `createFormValidation()` | Create a form validation context                      |
| `validate(value, rules)` | Run validation rules against a value                  |
| `builtInValidators`      | Built-in validators (required, email, min, max, etc.) |

### Parser (Server-Side)

| Export                          | Description                                            |
| :------------------------------ | :----------------------------------------------------- |
| `createParser(schema)`          | Create a one-shot parser for complete OpenUI Lang text |
| `createStreamingParser(schema)` | Create an incremental parser for streaming input       |

## Documentation

Full documentation, guides, and the language specification are available at **[openui.com](https://openui.com)**.

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
