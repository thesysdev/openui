# @openuidev/react-lang

React bindings for OpenUI Lang. Use this package when your model needs to emit structured UI and your React app needs to render it while the response is still streaming.

[![npm version](https://img.shields.io/npm/v/@openuidev/react-lang)](https://www.npmjs.com/package/@openuidev/react-lang)
[![monthly downloads](https://img.shields.io/npm/dm/@openuidev/react-lang)](https://www.npmjs.com/package/@openuidev/react-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [Package docs](https://openui.com/docs/api-reference/react-lang) | [OpenUI Lang guide](https://openui.com/docs/openui-lang) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

```bash
npm install @openuidev/react-lang
# or
pnpm add @openuidev/react-lang
```

**Peer dependencies:** `react >=19.0.0`

## Overview

`@openuidev/react-lang` is the React runtime layer for OpenUI Lang. It covers the loop most apps need:

1. **Define components** that a model is allowed to use, with Zod schemas for props.
2. **Generate prompts** from that component library so the model knows the exact output language.
3. **Render streamed output** with `<Renderer>` as OpenUI Lang arrives from your backend.

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

The streaming parser exposes two methods:

| Method | Description |
| :--- | :--- |
| `push(chunk)` | Feed the next chunk; returns the latest `ParseResult` |
| `getResult()` | Get the latest result without consuming new data |

After the stream ends, check `meta.unresolved` for any identifiers that were referenced but never defined. During streaming these are expected (forward refs) and are not treated as errors.

#### Errors

`ParseResult.meta.errors` contains structured `OpenUIError` objects. Each error has a `type` discriminant (currently always `"validation"`) and a `code` for consumer-side filtering:

| Code | Meaning |
| :--- | :--- |
| `missing-required` | Required prop absent with no default |
| `null-required` | Required prop explicitly null with no default |
| `unknown-component` | Component name not found in the library schema |
| `excess-args` | More positional args passed than the schema defines |

Errors do not affect rendering. The parser stays permissive and renders what it can. Use `code` to decide how to surface or log errors:

```ts
const result = parser.parse(output);
const critical = result.meta.errors.filter(
  (e) => e.code === "unknown-component"
);
```

To check for unresolved references after streaming, inspect `meta.unresolved`:

```ts
if (result.meta.unresolved.length > 0) {
  console.warn("Unresolved refs:", result.meta.unresolved);
}
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
  OpenUIError,
  ValidationErrorCode,
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

- [React API reference](https://openui.com/docs/api-reference/react-lang)
- [OpenUI Lang guide](https://openui.com/docs/openui-lang)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/react-lang)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)

### Cloud response bundles and scripts

Pass the complete response to `Renderer`, including content, scripts, and end
sentinels. It renders the program while streaming. Bare OpenUI Lang remains
supported. Use `ArtifactRenderer` for metadata and preview presentation.

```tsx
<Renderer
  response={message.content}
  library={library}
  isStreaming={isStreaming}
  toolProvider={{
    async callTool({ name, arguments: args }) {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, arguments: args ?? {}, response: message.content }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`Tool request failed: ${res.status}`);
      const { result } = await res.json();
      return { content: [], structuredContent: result };
    },
  }}
/>
```

Every Query/Mutation goes through the supplied provider. Renderer does not reserve
an execution tool name or implement a script transport. Existing function maps
also work; use the single `callTool` form when your backend handles dispatch.

In the example, the host attaches the complete response to each request. Your
server first executes registered tools, then resolves unregistered names against
the response's scripts through `/v1/app/execute`. The server owns the continuation
loop: run requested customer tools, send their results and opaque state back to
the execution endpoint, and return the final `{ result }` to the provider. Keep
credentials and customer authorization on that server. Unknown tools/scripts
should return an error. The provider returns an MCP-compatible result envelope.

Providers own timeouts, cancellation and execution limits. On response changes
or unmount, Renderer ignores obsolete query results; it does not cancel calls
already running inside a provider.

Execution waits until streaming stops and a framed response has its end sentinel.
The backend emits the end sentinel only after successful generation. A stopped
stream without a valid terminal marker remains blocked. Bare DSL retains its
existing behavior: it becomes executable when `isStreaming` is false. Hosts
should discard interrupted bare-code responses rather than mark them complete.
Malformed bundles do not execute. Script transport and tool errors flow through
`onError` and query/mutation error state.

For edits, replace `response` with the complete updated bundle returned by Cloud.
Changed script bundles invalidate cached query results, including when the
program keeps the same query names and arguments.

### Artifact previews and host-owned portals

`ArtifactRenderer` wraps `Renderer` with metadata and presentation. It defaults to
an inline name button that opens an inline content region. Metadata is optional;
missing names display as “Untitled artifact”. All Renderer props pass through.

```tsx
import { createPortal } from "react-dom";
import { ArtifactRenderer } from "@openuidev/react-lang";

<ArtifactRenderer
  response={message.content}
  library={library}
  toolProvider={tools}
  isStreaming={isStreaming}
  renderPreview={({ metadata, isOpen, open, close }) => (
    <button aria-expanded={isOpen} onClick={isOpen ? close : open}>
      {metadata.name || "View artifact"}
    </button>
  )}
  renderArtifact={({ children, metadata, close, contentId }) =>
    panelElement && createPortal(
      <section id={contentId} aria-label={metadata.name || "Artifact"}>
        <button onClick={close}>Close</button>
        {children}
      </section>,
      panelElement,
    )
  }
/>
```

This is a composition pattern: `renderPreview` controls the inline preview and
`renderArtifact` places the expanded Renderer in your panel, modal, or portal.
The host owns the target element and any dialog focus/keyboard behavior. No
portal library or `react-dom` import is imposed by the wrapper.

Use `open` and `onOpenChange` for controlled visibility, or `defaultOpen` for
initially expanded content. `onMetadata` is available on `ArtifactRenderer` only.
The expanded Renderer mounts only while open; closing disposes its query manager
and resets its local state. Persist form state with `onStateUpdate` and restore
it with `initialState` when needed. Reopening refetches queries. Use a stable key
per artifact to keep separate messages' presentation state independent.

Streaming edits may contain multiple content sections: a base-plus-patch preview,
retry previews, and a final merged result. The last content section wins. Queries
and mutations remain blocked until streaming stops and the final end marker is
present. The entire accumulated response can be passed back for execution/editing.
