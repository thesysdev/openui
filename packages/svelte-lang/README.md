# @openuidev/svelte-lang

Define component libraries, generate LLM system prompts, and render streaming [OpenUI Lang](https://openui.com) output in **Svelte 5** — the core runtime for OpenUI generative UI.

This is the Svelte equivalent of [`@openuidev/react-lang`](../react-lang/).

## Installation

```bash
npm install @openuidev/svelte-lang zod
```

## Quick Start

### 1. Define Components

```ts
// lib/components.ts
import { defineComponent, createLibrary } from "@openuidev/svelte-lang";
import { z } from "zod";
import Header from "./Header.svelte";
import Card from "./Card.svelte";

const HeaderDef = defineComponent({
  name: "Header",
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
  }),
  description: "Page header with title and optional subtitle",
  component: Header,
});

const CardDef = defineComponent({
  name: "Card",
  props: z.object({
    title: z.string(),
    content: z.string(),
    items: z.array(HeaderDef.ref).optional(),
  }),
  description: "Content card",
  component: Card,
});

export const library = createLibrary({
  components: [HeaderDef, CardDef],
  root: "Card",
});
```

### 2. Create Component Renderers

```svelte
<!-- Header.svelte -->
<script lang="ts">
  import type { ComponentRenderProps } from "@openuidev/svelte-lang";
  import { RenderValue } from "@openuidev/svelte-lang";

  let { props, renderNode }: ComponentRenderProps<{
    title: string;
    subtitle?: string;
  }> = $props();
</script>

<header>
  <h1>{props.title}</h1>
  {#if props.subtitle}
    <p>{props.subtitle}</p>
  {/if}
</header>
```

```svelte
<!-- Card.svelte -->
<script lang="ts">
  import type { ComponentRenderProps } from "@openuidev/svelte-lang";
  import { RenderValue } from "@openuidev/svelte-lang";

  let { props, renderNode }: ComponentRenderProps<{
    title: string;
    content: string;
    items?: unknown[];
  }> = $props();
</script>

<div class="card">
  <h2>{props.title}</h2>
  <p>{props.content}</p>
  {#if props.items}
    {#each props.items as item}
      <RenderValue value={item} />
    {/each}
  {/if}
</div>
```

### 3. Use the Renderer

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { Renderer } from "@openuidev/svelte-lang";
  import { library } from "./lib/components";

  let response = $state<string | null>(null);
  let isStreaming = $state(false);

  async function generate() {
    isStreaming = true;
    // Stream from your LLM API using library.prompt() as system prompt
    const stream = await fetchStream(library.prompt());
    for await (const chunk of stream) {
      response = (response ?? "") + chunk;
    }
    isStreaming = false;
  }
</script>

<button onclick={generate}>Generate UI</button>

<Renderer
  {response}
  {library}
  {isStreaming}
  onAction={(event) => console.log("Action:", event)}
  onStateUpdate={(state) => console.log("Form state:", state)}
/>
```

## API Reference

### `defineComponent(config)`

Define a component with its name, Zod props schema, description, and Svelte component.

### `createLibrary(definition)`

Create a component library from defined components. Returns a `Library` with:
- `prompt(options?)` — Generate the LLM system prompt
- `toJSONSchema()` — Get the JSON Schema for all components
- `components` — Map of component definitions

### `<Renderer>`

The main streaming renderer component.

| Prop | Type | Description |
|------|------|-------------|
| `response` | `string \| null` | Raw OpenUI Lang response text |
| `library` | `Library` | Component library from `createLibrary()` |
| `isStreaming` | `boolean` | Whether the LLM is still streaming |
| `onAction` | `(event: ActionEvent) => void` | Action callback |
| `onStateUpdate` | `(state) => void` | Form state change callback |
| `initialState` | `Record<string, any>` | Initial form state |
| `onParseResult` | `(result: ParseResult \| null) => void` | Parse result callback |

### `<RenderValue>`

Helper component for rendering nested values inside component renderers.

```svelte
<RenderValue value={props.children} />
```

### Context Functions

Svelte uses `getContext`/`setContext` instead of React hooks:

- `getOpenUI()` — Full OpenUI context (equivalent to React's `useOpenUI`)
- `getRenderNode()` — Get the renderNode function
- `getTriggerAction()` — Get the action trigger function
- `getIsStreaming()` — Whether LLM is streaming
- `getGetFieldValue()` — Get form field values
- `getSetFieldValue()` — Set form field values
- `getFormName()` — Current form name
- `setFormNameContext(name)` — Set form name (for form components)

### Form Validation

- `createFormValidation()` — Create form validation state
- `getFormValidation()` — Access form validation context
- `setFormValidationContext(value)` — Set validation context

### Parser (Server-side)

- `createParser(schema)` — Create a one-shot parser
- `createStreamingParser(schema)` — Create a streaming parser

## Svelte vs React Patterns

| React | Svelte |
|-------|--------|
| `useOpenUI()` | `getOpenUI()` |
| `useRenderNode()` | `getRenderNode()` |
| `useTriggerAction()` | `getTriggerAction()` |
| `useIsStreaming()` | `getIsStreaming()` |
| `useGetFieldValue()` | `getGetFieldValue()` |
| `useSetFieldValue()` | `getSetFieldValue()` |
| `useFormName()` | `getFormName()` |
| `useFormValidation()` | `getFormValidation()` |
| `useCreateFormValidation()` | `createFormValidation()` |
| `React.FC<ComponentRenderProps>` | Svelte component with `ComponentRenderProps` props |
| `{renderNode(value)}` | `<RenderValue value={value} />` |

## Requirements

- Svelte 5+
- Zod 4+

## License

MIT
