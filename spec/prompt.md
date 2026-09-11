# The OpenUI Prompt and LibrarySpec

**1.0-beta, community review draft**

This document specifies everything that is sent to the model: the LibrarySpec a library serializes to, the system prompt generated from it, and the shape of the conversation the model sees. MUST, MUST NOT, SHOULD, and MAY are used as in RFC 2119, and *(proposed)* marks designed but unshipped behavior.

## 1. Overview

The model's entire knowledge of your UI system comes from two places:

1. **The system prompt**: a deterministic function of the LibrarySpec, a set of feature flags, and a prompt template version (section 4). It teaches the language rules, the component vocabulary, and only the features the client supports.
2. **The conversation**: user messages, the model's own earlier OpenUI Lang responses, and context the host injects (error reports, form state, the current program in edit mode).

Nothing else is sent. There is no hidden capability negotiation: if the prompt did not teach it, the model was not told about it, and the prompt MUST NOT teach features the target client does not support.

## 2. The LibrarySpec

A library serializes into two documents today. `library.toSpec()` emits the component signatures, for prompt generation:

```json
{
  "root": "Card",
  "components": {
    "Button": {
      "signature": "Button(label: string, action?: ActionExpression, variant?: \"primary\" | \"secondary\")",
      "description": "A clickable button"
    }
  },
  "componentGroups": []
}
```

`library.toJSONSchema()` emits the validation schema, the machine-readable half a client validates against. It carries one `$defs` entry per component:

```json
{
  "$defs": {
    "Button": {
      "type": "object",
      "properties": {
        "label": { "type": "string" },
        "action": {},
        "variant": { "type": "string", "enum": ["primary", "secondary"] }
      },
      "required": ["label"]
    }
  }
}
```

Reading it: the key order of `properties` is the positional argument order, so `Button("Save", a, "primary")` maps label, action, variant in that order; `required` lists the props whose absence invalidates the component; a property's `default` value fills a missing required argument before the component is dropped. Because the positional contract rides on JSON object key order, producers MUST emit `properties` in schema key order and consumers MUST parse with an order-preserving JSON parser.

The CLI (`npx @openuidev/cli generate`) emits both artifacts by default: the system prompt, and a spec document combining `toSpec()` with a `schema` key holding `toJSONSchema()`. With `--out prompt.txt` the spec lands beside the prompt as `prompt.spec.json`; `--json-schema` prints the validation schema alone, and `--spec` prints the combined document.

A unified LibrarySpec document *(proposed)* bundles both, adds a library name, and carries `functions`, `validators`, and `actions` registries as declarations only (name, params schema, return type, description); implementations never serialize. The document self-describes its format with `specVersion`, the version of this specification it conforms to, distinct from the library's own `version` (which tracks the library's content). It stores no signature strings: the schema is the single source of truth (its property key order is the positional contract), and the TypeScript-style signature is derived from it by the prompt template, so the two can never drift. A backend that wants the prompt calls `generateSystemPrompt` rather than reading a stored string; the CLI's current combined output still carries legacy signature strings during the transition. It also adds the `bindable` marker for two-way-binding props and the form-component markers; until those land, a prompt generated from the spec alone cannot enable the `bindings` flag faithfully, because bindability lives only in the library definition today. The document further carries `root` as one component name or an array of candidates, and the `schemaOnly` marker for data components ([overview.md](./overview.md), section 4.8). The LibrarySpec is the interchange format between platforms: a Kotlin library and a TypeScript library that emit the same spec are interchangeable.

The LibrarySpec drives prompt generation and validation. It does not drive rendering: components are implemented natively on each platform, and each platform's library definition owns its components' behavior, including which props are bindable and how inputs attach to forms. A native client is not a generic schema-driven widget engine; it is the same components, written for that platform, agreeing on one contract.

## 3. Conformance rules for libraries

- Component names MUST start with an uppercase letter and match the identifier rule. Registered function and action names SHOULD follow the built-ins' uppercase convention (`@FormatCurrency`, `@ApproveInvoice`); validator names MUST start lowercase, since they are rules-object keys.
- Required props MUST precede optional props in schema key order.
- Key order is part of the public contract. A reorder changes the meaning of every generated prompt and of every stored program that lacks its meta line (section 7), so authors SHOULD add new props at the end of the key order and treat reorders and removals as version-bumping changes. A publish-time compatibility check *(proposed)* classifies these changes mechanically (section 7.6).
- Libraries MUST NOT define components named `Query`, `Mutation`, or `Action`, and MUST NOT register functions shadowing built-ins.
- Every component in `root` and in `componentGroups` MUST exist in `components`.
- Argument constraints *(proposed)* are limited to the JSON-Schema-mappable keywords, so any platform can enforce them from the schema document alone: `minLength`, `maxLength`, `pattern`, `format` (`uri`, `email`) on strings; `minimum`, `maximum`, integer type on numbers; `minItems`, `maxItems` on arrays; `default` on any prop. A violation renders the value as-is and reports a warning diagnostic; it MUST NOT drop the component. Custom-function refinements do not serialize and are unsupported; implementations SHOULD ignore them with a definition-time warning.
- Definition-time enforcement of these rules is proposed; the reference `createLibrary` currently checks only that `root` names a member component.

## 4. Prompt generation

The system prompt is a deterministic function of the LibrarySpec, a set of flags, and a prompt template. The canonical entry point is `generateSystemPrompt({ library, promptOptions })`; the older flat `generatePrompt(spec)` form is deprecated. The canonical template is the reference implementation's generator at a tagged release; this document does not reprint it, so byte-level determinism is defined against that tagged template, and publishing the template as a normative appendix is planned alongside the fixture suite. Given the same spec, flags, and template version, prompt generators MUST produce the same prompt bytes, whichever platform runs them. This determinism lets a gateway generate the prompt server-side from a client's LibrarySpec and get identical model behavior to a client that generated it locally.

The flags gate feature sections: `toolCalls` (queries, mutations, tools), `bindings` (state and `$binding<type>` props), `editMode` (patching), `inlineMode` (prose plus fenced code). Built-in function documentation appears only when `toolCalls` or `bindings` is set. The inline-mode section MUST teach two rules explicitly: openui-lang belongs only in fences, with a `text`-tagged fence showing code without rendering it, and independent UI blocks split into separate fences with prose between them. Models follow both reliably when taught, and just as reliably coalesce a whole response into one fence when the second rule is left out.

The generated prompt contains, in order: the syntax rules (statement shape, positional arguments, the root convention: a single component statement named `root`), the component catalog (section 5), the flag-gated sections for built-ins and tools, the hoisting and streaming guidance, and the flag-gated sections for editing and inline mode. Components render in the spec's key order. `componentGroups` are named groups (`{ name, components, notes? }`) that organize the catalog into titled sections; every listed component must exist in `components`.

Tool descriptors are supplied to prompt generation as options, not in the LibrarySpec today: each is a name string or a ToolSpec (`{ name, description?, inputSchema, outputSchema, annotations? }`). Tools are described to the model with their names, typed signatures, and default values derived from their output schemas. The unified LibrarySpec *(proposed)* will carry tool declarations so spec-driven generation can build this section.

## 5. Component signatures and descriptions

Each component appears in the prompt as a single-line signature joined to its description; the separator in the current template is the em dash character:

```
Button(label: string, action?: ActionExpression, variant?: "primary" | "secondary") — A clickable button
```

The signature line MUST stay single-line so it can be quoted whole in prompts and logs. Error `hint` fields do not reuse it: they carry a compact signature built from the JSON Schema, prop names only with required props starred ([language.md](./language.md), section 8.3).

The signature string format is part of the template: primitive types print as `string`, `number`, `boolean`, `any`; enums as quoted alternatives joined by `|`; arrays as `T[]`; inline objects as `{field: type}`; unions joined by `|`; optional props with `?` before the colon; bindable props as `$binding<type>`. Names like `ActionExpression` come from schema id tags the library registers for non-component schemas. The exact grammar of the signature string is pinned by the reference template and will appear in the normative template appendix.

Per-prop descriptions and usage examples *(proposed)* render as a JSDoc block above the signature. `@param` lines come from prop descriptions in the schema (`.describe()` in the Zod definition, a `description` field in the LibrarySpec); `@example` lines come from the component's `example` field (a string or an array of strings, one `@example` entry each):

```
/**
 * A clickable button
 * @param label - Text shown on the button
 * @param variant - Visual weight, defaults to primary
 * @example
 * btn = Button("Save changes", saveAction, "primary")
 */
Button(label: string, action?: ActionExpression, variant?: "primary" | "secondary")
```

Argument constraints (section 3) also render here *(proposed)*: a deterministic suffix on the `@param` line, derived from the schema, so the model learns the constraint without the author restating it: `@param value - Stars filled (integer, 0 to 5)`, `@param items - (min 2 items)`. A constraint with no hand-written description still produces its `@param` line.

JSDoc is chosen because models require no teaching to read it, and because it costs nothing when unused: the block appears only when a component has prop descriptions, an argument constraint, or an example; otherwise the component keeps the compact single-line form, and a library with none of these produces no boilerplate at all. Descriptions SHOULD add semantics the type does not carry (units, ranges, when to use which enum member), not restate the type. *(Today the reference prompt generator drops per-prop descriptions; this section is the fix for that gap.)*

## 6. The conversation

### 6.1 Assistant history

The model's earlier responses appear in history as the OpenUI Lang text it generated (with surrounding prose when inline mode is on). History is the strongest style signal the model gets: whatever form its earlier messages use is the form it will continue to use, so the stored form of history matters. Section 7 *(proposed)* defines the storage protocol: stored responses carry a metadata line naming the library and key orders they were written against, and hosts re-serialize history into the current dialect, with every metadata line stripped, before the model sees it.

### 6.2 Error feedback

When a response produced errors, the host SHOULD include the structured error list (wire shape in [language.md](./language.md), section 8.3) in the next request context. The `hint` field is designed so the model can produce a one-line patch without re-reading the library documentation.

### 6.3 Action events

A `continue_conversation` event becomes the next user-side turn: the human-friendly message, the event context, and the current form state travel together, so the model sees what the user entered without asking.

### 6.4 Edit mode

With `editMode` on, the host sends the current program with the request, and the prompt teaches the model to respond with only the changed statements. Without it, every response is a complete program.

## 7. Stored messages and the sentinel protocol *(proposed)*

OpenUI Lang is a positional format: argument meaning depends on schema key order, and a stored message can outlive the key order it was written against. This is the schema-evolution problem Avro solves for positional binary data, and this section adopts Avro's solution: the writer's schema travels with the data, either embedded (the `orders` attribute below) or by reference to a registry (slim mode). OpenUI needs far less than Avro carries, because the text encodes its own value types; the only writer knowledge a stored message loses is the prop names for its argument positions. Like every proposed section, this one is written in the present tense so the design can be judged as it would ship; none of it is implemented today.

### 7.1 The sentinel line

A sentinel line is a line beginning with `]]>openui:` followed by a kind identifier and, optionally, a single space and space-separated `key=value` attributes. Values contain no spaces (identifiers, `id@semver`, or compact JSON), so the line splits on spaces. Sentinel lines MUST be line-anchored; the byte sequence mid-line is content, not a marker.

Sentinel lines are host-authored. The prompt MUST NOT teach the syntax. The party assembling a model request MUST strip every sentinel line before text reaches the model, and the party rendering MUST strip every sentinel line from display, in both cases including kinds and attributes they do not recognize; unknown attributes on a recognized kind are ignored. During streaming, a client SHOULD withhold from display an incomplete final line that is a prefix of, or begins with, `]]>openui:`, so a marker split across chunks never flashes as text.

### 7.2 Kinds

| kind | channel | position | payload | status |
| --- | --- | --- | --- | --- |
| `meta` | assistant message | trailing block, one line per library | `library=id@semver`, `orders={...}` (absent in slim mode) | proposed, defined here |
| `context` | user and assistant messages | opens a section; body runs to the next marker or end of message | JSON (form state, action event context) | in use today; normative |
| `content` | assistant message | opens a section | attributes | legacy, in use today; parsers MUST keep accepting it |
| `end` | assistant message | standalone line, anywhere | none; attributes reserved | in use today; optional |

A message's trailing block is the maximal run of sentinel lines at its end; `meta` lines are read only there. If a legacy `content` header and a `meta` line disagree, `meta` wins. Only `context` and legacy `content` open sections: every other kind, including kinds defined in the future, MUST be a standalone line, so a parser that does not recognize a kind can always strip exactly one line and never leaks a section body. `end` marks the last stored chunk of a live stream, so its absence from a persisted message indicates a stream that died mid-write; how a response ended on the wire is structural, never in-band. Managed backends define additional kinds on other channels (an artifact carrier on tool results, a configuration block on request instructions); they are profile extensions, they follow the single-line rule, and they impose nothing on clients of this specification.

### 7.3 The meta line

When a host stores an assistant response containing OpenUI Lang, it SHOULD append one `meta` line per library used (this is the storage half of the versioning guarantee; without it, messages degrade as described in 7.4):

```
]]>openui:meta library=support@1.2.0 orders={"components":{"Card":["children","sources"],"Button":["label","action","variant"]},"actions":{"ApproveInvoice":["id"]}}
```

`library` is the library id and version the prompt was generated from. `orders` is the key-order projection of the LibrarySpec, restricted to names the message uses, grouped by registry: `components`, `functions`, and `actions`, each mapping a used name to its params in schema key order, with empty groups omitted. The grouping keeps the projection unambiguous, since functions and actions share the `@` call form and name casing is a convention, not a discriminator. Arrays make the order explicit, so any JSON parser reads the projection correctly; the order-preserving requirement of section 2 does not apply here. In slim mode `orders` is absent and the reader resolves the same projection from a registry by `library`; embedded orders keep the message self-contained where no registry exists.

Writers MUST be idempotent: an existing trailing `meta` line for the same library id is replaced, never duplicated. Writers SHOULD put one blank line before the trailing block for readability; parsers accept both.

### 7.4 Reading stored messages

Before a stored message is rendered or resent as history, the host normalizes it:

1. If the stored orders equal the current projection for every name used, strip the sentinel lines and use the text as-is. Equality of orders, not of version numbers, is the fast path: a schema change that shipped without a version bump is still caught. The version attribute remains useful as a skew diagnostic.
2. Otherwise, parse the text binding argument positions to prop names through the stored orders, then re-serialize each statement in the current library's key order: repositioned props move, gaps before a later argument are filled with `null`, props absent from the current schema are dropped, and trailing unwritten props are omitted. Renames need an explicit alias mapping, planned alongside this protocol and not yet specified; until it lands, a renamed name behaves as a removal. A name with no current entry is dropped with a diagnostic.

Re-binding applies to every component, registered-function, and declared-action call at every depth: inside arrays, object values, ternary branches, `@Each` templates, and action plans, not only at the top of a statement. A call whose name is absent from the stored orders is read with the current library's order and reported with a skew diagnostic. Beyond that re-binding, normalization is textual rewriting: expressions, state declarations, and hoisted references re-serialize as written, values are never evaluated or coerced, and line comments are not preserved. The model MUST NOT receive sentinel bytes, and SHOULD receive history in the current dialect, since history is the strongest style signal (section 6.1). The conformance fixtures pin this behavior with nested-call cases.

A message without a meta line (never enriched, or truncated in storage) is read as-is against the current library, which is exactly the pre-protocol behavior. The append-only discipline of section 3 exists for this case: additions at the end of the key order keep even degraded messages correct, so the meta line only has to earn its keep for reorders and removals.

### 7.5 The storage boundary

The reference implementation ships the protocol as two functions: one wraps a completed response with its meta lines, one normalizes a stored message and strips every sentinel for the model. Where they run depends on who owns the prompt. A managed backend that generated the prompt runs both server-side, on the response stream and on incoming history, so clients store and echo plain strings. A self-hosted backend calls the wrap function where it already handles the stream; a client-side stack calls the normalize function at its API boundary before resending history. A client that persists messages itself MAY wrap on the client; such a stamp reflects the client's library, not necessarily the prompt's, and SHOULD be marked so skew warnings can weigh it accordingly.

### 7.6 Compatibility checking *(proposed)*

Schema registries for positional formats reject incompatible schemas at publish time rather than letting readers fail later, and the same check applies here. When a new library version is published or a prompt is generated, diff the full component schemas against the previous version, not only the key orders, and classify each component: additions at the end of the key order are compatible even for messages without a meta line, except that a newly required prop MUST carry a `default`, since stored messages cannot supply it (and a required prop added after optionals also violates section 3's ordering rule); reorders and removals are compatible only through the meta line; a removed name alongside a new name suggests a rename and warrants a warning when no alias covers it; a type or enum change on an existing prop warrants a warning, since stored values may now fail validation with no order change to detect it by; an unchanged version with a changed projection is an error, the forgotten version bump. A registry MAY reject on these classes; a generator SHOULD warn.

### 7.7 Security

In-band metadata is forgeable in principle: model output or third-party text could contain a marker-shaped line. The mitigations are structural. The syntax is never taught, so the model does not produce it in practice; display parsers strip every sentinel line regardless of kind, so forged lines never render; `meta` is only read from the trailing block, and the blast radius of a forged projection is one message re-binding incorrectly. Hosts MUST NOT derive trust decisions from sentinel attributes.

## Appendix A. Changelog

- **2026-08-12**: Fixes from three independent review passes. Naming: registered function and action names follow the built-ins' uppercase convention; the `orders` projection grouped by registry (`components`/`functions`/`actions`) so casing is no longer a discriminator. Section 7 hardened: proposed-tense disclaimer; strip obligations split between the request assembler and the renderer; single-line rule for all future kinds; `end` defined; re-binding stated to apply at every expression depth with fixtures to pin it; rename aliases marked as planned rather than assumed; the compatibility check widened to full-schema diffs with the required-prop-needs-default rule. Section 2 documents `root` plurality and the `schemaOnly` marker. Section 4 pins the two inline-mode teaching rules (fence-only code, fence splitting), the second validated empirically.
- **2026-08-07**: Added section 7, the proposed storage protocol: sentinel line grammar and kind registry, the meta line carrying the key-order projection, normalization with an orders-equality fast path, slim mode, the storage boundary, and publish-time compatibility checking. Section 3's key-order rule gains the append-only guidance and section 6.1 references the protocol.
- **2026-08-05**: Draft renamed from 0.9 to 1.0-beta; earlier entries keep the old name.
- **2026-08-04**: Argument constraints limited to the JSON-Schema-mappable keywords with warn-and-render recovery, rendered as deterministic `@param` suffixes; `example` documented as string or array; CLI section updated to PR #811 behavior (default generate emits prompt plus `.spec.json`, `--json-schema` prints the validation schema, `generateSystemPrompt` canonical); unified LibrarySpec standardized as schema-only with signatures derived by the prompt template.
- **2026-08-03**: Split out of the 0.9 draft as its own document; added the conversation contract and the proposed JSDoc form for per-prop descriptions and examples. Review fixes: determinism scoped to a tagged prompt template, the validation-schema half of the LibrarySpec documented with the order-preserving requirement, CLI output described as shipped, tool descriptor input defined, signature format and the em dash separator documented as emitted.
