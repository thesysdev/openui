# @openuidev/structured-outputs

A standalone, framework-agnostic library for using OpenUI Lang as a general-purpose structured output format. No React, no UI rendering — only schema definition, prompt generation, parsing, and Zod validation.

## Installation

```bash
pnpm add @openuidev/structured-outputs zod
```

## Quick Start

```ts
import { z } from "zod";
import { defineModel, createSchema } from "@openuidev/structured-outputs";

// Define models with Zod schemas
const Contact = defineModel({
  name: "Contact",
  description: "A person's contact information",
  schema: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
  }),
});

// Create a schema — Contact is the root
const schema = createSchema([Contact]);

// Generate system prompt for your LLM
const systemPrompt = schema.prompt();

// Parse the LLM's response
const result = schema.parse('root = Contact("Alice", "alice@example.com", "+1234567890")');
// result.root → { name: "Alice", email: "alice@example.com", phone: "+1234567890" }
// result.meta.rootType → "Contact"
```

## Nested Models

Use `.ref` to reference child models in parent schemas. Sub-models are **discovered automatically** — you only pass the root model(s) to `createSchema`:

```ts
const LineItem = defineModel({
  name: "LineItem",
  description: "Invoice line item",
  schema: z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
  }),
});

const Invoice = defineModel({
  name: "Invoice",
  description: "An invoice with line items",
  schema: z.object({
    invoiceNumber: z.string(),
    items: z.array(LineItem.ref),  // LineItem referenced via .ref
  }),
});

// Only pass Invoice — LineItem is auto-discovered from Invoice.schema
const schema = createSchema([Invoice]);
```

## Multi-Root Schemas

Pass multiple root models to `createSchema` to handle more than one possible output type:

```ts
const Receipt = defineModel({
  name: "Receipt",
  description: "A purchase receipt",
  schema: z.object({
    store: z.string(),
    total: z.number(),
  }),
});

const schema = createSchema([Invoice, Receipt]);
// schema.root → ["Invoice", "Receipt"]

// Prompt instructs the LLM to use one of the root types
const prompt = schema.prompt();

// Parse — meta.rootType tells you which root was matched
const r1 = schema.parse('root = Invoice("INV-001", [])');
// r1.meta.rootType → "Invoice"

const r2 = schema.parse('root = Receipt("Shop", 42)');
// r2.meta.rootType → "Receipt"
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

## API

### `defineModel(config)`

Define a named model with a Zod schema and description.

```ts
interface DefinedModel<T extends z.ZodObject<any>> {
  name: string
  description: string
  schema: T        // Zod schema describing the model
  ref: T           // Use in parent schemas: z.array(Child.ref)
}
```

### `createSchema(rootModels)`

Create a schema from an array of root models. Sub-models are discovered automatically by traversing each root's `schema` fields. Returns a `Schema` object with:

- `prompt(options?)` — Generate a system prompt for your LLM
- `parse(input)` — Parse an OpenUI Lang string into a typed object
- `streamingParser()` — Create a streaming parser for incremental parsing
- `toJSONSchema()` — Get the JSON Schema representation
- `models` — Record of all models (roots + discovered sub-models)
- `root` — Root model name(s): `string` (single), `string[]` (multi), or `undefined` (none)

### `ParseResult`

```ts
interface ParseResult<T = unknown> {
  root: T | null
  meta: {
    rootType: string | null      // which root model was matched
    incomplete: boolean          // true if input was truncated
    unresolved: string[]         // references used but not yet defined
    statementCount: number
    validationErrors: ValidationError[]
  }
}
```

## Key Differences from `@openuidev/react-lang`

| Concern | `react-lang` | `structured-outputs` |
|---|---|---|
| Define | `defineComponent` | `defineModel` |
| Schema field | `props` | `schema` |
| `ParseResult.root` | `ElementNode` (component tree) | Plain typed JS object via Zod |
| Sub-type discovery | Manual — pass all types | Automatic from root schema traversal |
| Multi-root | Not present | Native: `createSchema([A, B])` |
| Prompt preamble | UI-focused | Data-extraction focused |
| React dependency | `peerDependency: react >=19` | None |

## License

MIT
