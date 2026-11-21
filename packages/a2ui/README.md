# `@openuidev/a2ui`

An experimental A2UI v1.0 profile that keeps the protocol lifecycle and envelopes intact while representing component lists as OpenUI Lang statements.

```json
{
  "version": "v1.0",
  "updateComponents": {
    "surfaceId": "main",
    "components": ["root = Stack([title])", "title = TextContent(\"Hello\")"]
  }
}
```

`updateDataModel`, `deleteSurface`, actions, `callRendererFunction`, `agentFunctionResponse`, `callAgentFunction`, `rendererFunctionResponse`, errors, capabilities, and renderer data-model metadata retain their A2UI v1.0 shapes. For v1.0 single-message creation, optional `createSurface.components` uses the same Lang statement array as `updateComponents.components`, so there is exactly one component representation on the wire.

Incoming protocol messages are validated with the exported Zod schemas in the package. The public TypeScript message types are inferred from the same definitions, so runtime validation and static types stay aligned.

## Installation

Install the framework-neutral protocol client with its runtime schema peer:

```bash
npm install @openuidev/a2ui zod
```

The React adapter is optional. Install its peers only when importing `@openuidev/a2ui/react`:

```bash
npm install react @openuidev/react-lang
```

## How updates work

Each array item is one complete OpenUI Lang statement (a multiline statement block is also accepted). Repeated messages are merged by statement ID and the resulting source is parsed by `@openuidev/lang-core`. A newer assignment replaces the previous statement, and `statementId = null` deletes it. The `root` statement remains the surface root.

## Usage

```tsx
import { createA2UIClient } from "@openuidev/a2ui";
import { A2UIRenderer } from "@openuidev/a2ui/react";
import { openuiLibrary } from "@openuidev/react-ui";

const client = createA2UIClient({
  schema: openuiLibrary.toJSONSchema(),
  rootName: openuiLibrary.root,
  rendererCapabilities: {
    "v1.0": { supportedCatalogIds: ["com.example:openui"] },
  },
  onMessage(message, metadata) {
    transport.send(message, metadata);
  },
});

await client.process({
  version: "v1.0",
  createSurface: {
    surfaceId: "main",
    catalogId: "com.example:openui",
    dataModel: { user: { name: "Alice" } },
  },
});

await client.process({
  version: "v1.0",
  updateComponents: {
    surfaceId: "main",
    components: ["root = Stack([greeting])", 'greeting = TextContent("Hello, " + $user.name)'],
  },
});

export function Surface() {
  return (
    <A2UIRenderer
      client={client}
      surfaceId="main"
      library={openuiLibrary}
      isStreaming={transport.isStreaming}
      mapAction={(event) => ({ name: event.type })}
    />
  );
}
```

The client is framework-neutral: it owns surface lifecycle, runtime envelope validation, Lang parsing and merging, data-model patches, actions, RPC, and protocol errors. `A2UIRenderer` is the React adapter; it subscribes to one surface and delegates the parsed OpenUI Lang UI to `@openuidev/react-lang`.

When `sendDataModel` is enabled, the second `onMessage` argument contains `a2uiRendererDataModel` metadata filtered to opted-in surfaces. Configured renderer capabilities are exposed in the same metadata object. The host transport decides where to attach this metadata.

Renderer functions can be registered as a direct function shorthand or as `{ handler, catalogId, allowedCallers }`. Explicit registrations default to `rendererOnly`; incoming `callRendererFunction` messages are accepted only when the catalog ID matches and `allowedCallers` is `agentOnly` or `rendererOrAgent`.

When no `toolProvider` is passed to `A2UIRenderer`, OpenUI Lang `Query()` and `Mutation()` calls automatically use A2UI `callAgentFunction` and settle from the matching `agentFunctionResponse`. Pass a `toolProvider` to handle those calls locally instead.

Use `mapAction` to provide `sourceComponentId` when the host renderer does not include one in its action event. Otherwise actions fall back to the surface `root` ID.

## Standard A2UI components

`compileToA2UI` and `createA2UIStream` turn OpenUI Lang into standard A2UI messages, with component JSON objects in `components`, for renderers that do not read OpenUI Lang, such as A2UI's own React, Angular and Lit renderers. Describe the renderer's A2UI catalog as an OpenUI library: the order of each component's props is its positional argument order. `a2uiPromptOptions()` keeps the model to the part of OpenUI Lang that A2UI can express.

```ts
import { a2uiPromptOptions, createA2UIStream } from "@openuidev/a2ui";
import { basicCatalog } from "./basic-catalog"; // the A2UI Basic Catalog as an OpenUI library

const systemPrompt = basicCatalog.prompt(a2uiPromptOptions());

const stream = createA2UIStream({
  schema: basicCatalog.toJSONSchema(),
  surfaceId: "main",
  catalogId: "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json",
  version: "v0.9", // defaults to "v1.0"
});

let text = "";
for await (const delta of modelStream) {
  text += delta;
  // Messages for the statements that are complete and new or changed.
  for (const message of stream.push(text)) send(message);
}
const { messages, errors } = stream.finish(text);
```

| OpenUI Lang                         | A2UI                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `id = Column([a, b], "start")`      | `{ "id": "id", "component": "Column", "children": ["a", "b"], "justify": "start" }`    |
| `Button(Text("Go"), "primary", …)`  | Inline components get generated ids (`id_0`), since A2UI refers to children by id      |
| `$user = {name: "Ada"}`             | `updateDataModel` at `/user`                                                           |
| `$user.name`, `$items[0]`           | `{ "path": "/user/name" }`, `{ "path": "/items/0" }`                                   |
| `@signUp({email: $user.email})`     | `{ "event": { "name": "signUp", "context": { "email": { "path": "/user/email" } } } }` |
| `@formatString("Hi ${/user/name}")` | `{ "call": "formatString", "args": { "value": "Hi ${/user/name}" } }`                  |
| `opts = [...]`                      | Inlined wherever `opts` is used                                                        |
| `null` argument                     | The optional prop is left out                                                          |

Catalog functions take their arguments positionally, in catalog order. `BASIC_CATALOG_FUNCTIONS` lists the Basic Catalog's; pass `functions` for another catalog. OpenUI built-ins (`@Count`, `@Filter`, …), ternaries, comparisons and `Query`/`Mutation` have no A2UI equivalent, and enum values the catalog does not define (such as an unknown icon name) would be rejected by the renderer, so these are reported in `errors` for their statement instead of being sent. `compileToA2UI(source, { schema })` compiles a complete program into `{ components, data, errors }` without the messages.

### A2UI Express

`openUIToExpress` and `expressToOpenUI` translate between OpenUI Lang and [A2UI Express](https://github.com/a2ui-project/a2ui/blob/main/specification/proposals/express/a2ui_express.md). The rewrites apply outside string literals:

| OpenUI Lang                | A2UI Express                   |
| -------------------------- | ------------------------------ |
| (no wrapper)               | `<a2ui> … </a2ui>`             |
| `$user.name`, `$items[0]`  | `$/user/name`, `$/items/0`     |
| `null` (skipped argument)  | `_`                            |
| `@save({id: $id})`         | `Event("save", {id: $/id})`    |
| `@formatDate($d, "MMM d")` | `formatDate($/d, "MMM d")`     |
| `$form = {email: ""}`      | `$/form/email = ""` (per path) |

Express template lists (`_template(...)`), relative paths inside templates and `?checks` are not translated yet.

## Development

The `check:attw` script intentionally ignores the `no-resolution` rule. `./react` is exported through modern package `exports`; `attw` reports `no-resolution` only for legacy Node 10 resolution, which this package does not support.
