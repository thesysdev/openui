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

## Development

The `check:attw` script intentionally ignores the `no-resolution` rule. `./react` is exported through modern package `exports`; `attw` reports `no-resolution` only for legacy Node 10 resolution, which this package does not support.
