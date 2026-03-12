# @openuidev/structured-outputs

A standalone, framework-agnostic library for using OpenUI Lang as a general-purpose structured output format. No React, no UI rendering — only schema definition, prompt generation, parsing, and Zod validation.

## Installation

```bash
pnpm add @openuidev/structured-outputs zod
```

## Quick Start

```ts
import { z } from "zod";
import { defineType, createSchema } from "@openuidev/structured-outputs";

// Define types with Zod schemas
const Contact = defineType({
  name: "Contact",
  description: "A person's contact information",
  props: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
  }),
});

// Create a schema
const schema = createSchema({
  types: [Contact],
  root: "Contact",
});

// Generate system prompt for your LLM
const systemPrompt = schema.prompt();

// Parse the LLM's response
const result = schema.parse('root = Contact("Alice", "alice@example.com", "+1234567890")');
// result.root → { name: "Alice", email: "alice@example.com", phone: "+1234567890" }
```

## Nested Types

Use `.ref` to reference child types in parent schemas:

```ts
const LineItem = defineType({
  name: "LineItem",
  description: "Invoice line item",
  props: z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
  }),
});

const Invoice = defineType({
  name: "Invoice",
  description: "An invoice with line items",
  props: z.object({
    invoiceNumber: z.string(),
    items: z.array(LineItem.ref),
  }),
});

const schema = createSchema({
  types: [LineItem, Invoice],
  root: "Invoice",
});
```

## Streaming

```ts
const parser = schema.streamingParser();

// Feed chunks as they arrive from the LLM
let result = parser.push('root = Invoice("INV-001", [i1])\n');
result = parser.push('i1 = LineItem("Widget", 5, 10.00)');

console.log(result.root);
// { invoiceNumber: "INV-001", items: [{ description: "Widget", quantity: 5, unitPrice: 10 }] }
```

## Multi-Schema Routing

Use `createSchemaMap` to route input to the correct schema:

```ts
import { createSchemaMap } from "@openuidev/structured-outputs";

const map = createSchemaMap(
  { invoice: invoiceSchema, receipt: receiptSchema },
  {
    callLLM: async (systemPrompt, userMessage) => {
      // Your LLM call here
      return await myLLM.complete(systemPrompt, userMessage);
    },
  },
);

const result = await map.parse("Invoice #1234 for 5 widgets at $10 each");
// result.type → "invoice"
// result.data → { invoiceNumber: "1234", items: [...] }
```

## API

### `defineType(config)`

Define a named type with a Zod schema and description.

### `createSchema(definition)`

Create a schema from an array of defined types. Returns an object with:
- `prompt(options?)` — Generate a system prompt for your LLM
- `parse(input)` — Parse an OpenUI Lang string into a typed object
- `streamingParser()` — Create a streaming parser for incremental parsing
- `toJSONSchema()` — Get the JSON Schema representation

### `createSchemaMap(schemas, options)`

Create a multi-schema router that classifies input and delegates to the matching schema.

## Key Differences from `@openuidev/react-lang`

| Concern | `react-lang` | `structured-outputs` |
|---|---|---|
| `defineComponent` / `defineType` | Requires `component` renderer | No renderer — data only |
| `ParseResult.root` | `ElementNode` (component tree) | Plain typed JS object via Zod |
| Prompt preamble | UI-focused | Data-extraction focused |
| React dependency | `peerDependency: react >=19` | None |
| Multi-schema routing | Not present | `createSchemaMap` |

## License

MIT
