# @openuidev/svelte-lang

Svelte renderer for [OpenUI Lang](https://openui.com) — define component libraries, generate LLM system prompts, and render streaming OpenUI Lang output in Svelte 5.

## Installation

```bash
pnpm add @openuidev/svelte-lang
```

Peer dependencies:

```bash
pnpm add svelte@^5.0.0 zod@^4.0.0
```

## Quick Start

### 1. Define Components

```ts
// lib/library.ts
import { defineComponent, createLibrary } from "@openuidev/svelte-lang";
import { z } from "zod";
import Card from "./components/Card.svelte";

const CardComponent = defineComponent({
  name: "Card",
  props: z.object({
    title: z.string().describe("Card title"),
    content: z.any().describe("Card content"),
  }),
  description: "A card container with title and content",
  component: Card,
});

export const library = createLibrary({
  components: [CardComponent],
  root: "Card",
});
```

### 2. Create a Svelte Component

```svelte
<!-- components/Card.svelte -->
<script lang="ts">
  import type { ComponentRenderProps } from "@openuidev/svelte-lang";

  interface Props extends ComponentRenderProps<{
    title: string;
    content: unknown;
  }> {}

  let { props, renderNode }: Props = $props();
</script>

<div class="card">
  <h2>{props.title}</h2>
  <div>{@render renderNode(props.content)}</div>
</div>
```

### 3. Render OpenUI Lang Output

```svelte
<script lang="ts">
  import { Renderer } from "@openuidev/svelte-lang";
  import { library } from "$lib/library";

  let response = $state('root = Card("Hello", "World")');
</script>

<Renderer {response} {library} />
```

### 4. Generate LLM System Prompts

```ts
const systemPrompt = library.prompt({
  preamble: "You are a helpful assistant that generates UI.",
  additionalRules: ["Use Card for organizing content"],
});
```

## API Reference

### `defineComponent(config)`

Define a component with a Zod schema, description, and Svelte renderer.

```ts
const comp = defineComponent({
  name: "Button",
  props: z.object({ label: z.string() }),
  description: "A clickable button",
  component: ButtonComponent,
});

// Use .ref in parent schemas for cross-references
const form = defineComponent({
  name: "Form",
  props: z.object({ submitButton: comp.ref }),
  description: "A form",
  component: FormComponent,
});
```

### `createLibrary(definition)`

Create a component library from defined components.

```ts
const library = createLibrary({
  components: [card, table, form],
  componentGroups: [{ name: "Layout", components: ["Card"] }],
  root: "Card",
});
```

### `<Renderer>` Component

| Prop | Type | Description |
|------|------|-------------|
| `response` | `string \| null` | Raw OpenUI Lang text |
| `library` | `Library` | Component library |
| `isStreaming` | `boolean` | Whether LLM is still streaming |
| `onAction` | `(event: ActionEvent) => void` | Action callback |
| `onStateUpdate` | `(state) => void` | Form state change callback |
| `initialState` | `Record<string, any>` | Initial form state |
| `onParseResult` | `(result) => void` | Parse result callback |

### Context API

Access renderer state from within components:

```ts
import {
  getOpenUIContext,    // Full context
  getTriggerAction,   // Fire action events
  getIsStreaming,      // Check streaming status
  getGetFieldValue,   // Read form field values
  getSetFieldValue,   // Update form field values
  getFormName,         // Current form name
  useSetDefaultValue,  // Set defaults after streaming
  setFormNameContext,   // Set form name (for Form components)
} from "@openuidev/svelte-lang";
```

### Form Handling

```svelte
<script lang="ts">
  import { getGetFieldValue, getSetFieldValue, getFormName } from "@openuidev/svelte-lang";

  let { props }: Props = $props();

  const getFieldValue = getGetFieldValue();
  const setFieldValue = getSetFieldValue();
  const formName = getFormName();

  const value = $derived(getFieldValue(formName, props.name) ?? "");

  function handleInput(e: Event) {
    setFieldValue(formName, "Input", props.name, (e.target as HTMLInputElement).value);
  }
</script>
```

### Action Events

```svelte
<script lang="ts">
  import { getTriggerAction, getFormName } from "@openuidev/svelte-lang";

  const triggerAction = getTriggerAction();
  const formName = getFormName();

  function handleClick() {
    triggerAction("Submit form", formName, { type: "continue_conversation" });
  }
</script>
```

## Differences from React Implementation

| React (`@openuidev/react-lang`) | Svelte (`@openuidev/svelte-lang`) |
|------|------|
| `useRenderNode()` hook | `renderNode` snippet prop |
| `useIsStreaming()` hook | `getIsStreaming()` context getter |
| `useSetFieldValue()` hook | `getSetFieldValue()` context getter |
| `useFormName()` hook | `getFormName()` context getter |
| React Context.Provider | Svelte `setContext` / `getContext` |
| React.FC component | Svelte 5 component with runes |
| JSX `{renderNode(value)}` | `{@render renderNode(value)}` |

## Shared with React

The following are reused directly from `@openuidev/react-lang` (no duplication):

- Parser (`createParser`, `createStreamingParser`)
- Prompt generation (`library.prompt()`)
- Types (`ElementNode`, `ParseResult`, `ActionEvent`, `ValidationError`)
- Validation utilities (`builtInValidators`, `parseRules`, `validate`)

## License

MIT
