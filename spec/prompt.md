# The OpenUI Prompt and LibrarySpec

**1.0**

This document defines what is sent to the model: the LibrarySpec, the system prompt generated from it, and the conversation the model sees. It also defines the marker lines a host stores messages with. MUST, MUST NOT, SHOULD, and MAY are used as in RFC 2119.

For the language, see [language.md](./language.md). For the big picture, see [overview.md](./overview.md).

## 1. Overview

The model learns your UI system from two places:

1. **The system prompt.** Generated from the LibrarySpec, a set of options, and a prompt version (section 4). It teaches the language, the component list, and only the features the client supports.
2. **The conversation.** User messages, the model's earlier OpenUI Lang responses, and context the host adds (error reports, form values, click data, the current program in edit mode).

Nothing else is sent. The prompt MUST NOT teach features the target client does not support.

## 2. The LibrarySpec

A LibrarySpec is one JSON document.

| field | meaning |
| --- | --- |
| `id` | The library name, for example `support`. |
| `version` | The library version, for example `1.2.0`. |
| `root` | Optional. The root component name, for example `Card`. |
| `schema` | The validation schema (JSON Schema). One `$defs` entry per component. |
| `components` | Per component: `signature` and `description` (derived from `schema`), `order` (section 2.3), and optional `aliases`, a list of old names (section 3.2). |
| `componentGroups` | Optional. Named groups that split the component list into titled parts. |
| `functions` | Custom functions: declarations only. |

Example:

```json
{
  "id": "support",
  "version": "1.2.0",
  "root": "Card",
  "schema": {
    "$defs": {
      "Card": {
        "type": "object",
        "description": "A container",
        "properties": {
          "children": { "type": "array", "items": { "x-openui": "component" } }
        },
        "required": ["children"]
      },
      "Button": {
        "type": "object",
        "description": "A clickable button",
        "properties": {
          "label": { "type": "string" },
          "action": { "x-openui": "action" },
          "variant": { "type": "string", "enum": ["primary", "secondary"] }
        },
        "required": ["label"]
      }
    }
  },
  "components": {
    "Card": {
      "signature": "Card(children: any[])",
      "description": "A container",
      "order": ["children"]
    },
    "Button": {
      "signature": "Button(label: string, action?: ActionExpression, variant?: \"primary\" | \"secondary\")",
      "description": "A clickable button",
      "order": ["label", "action", "variant"],
      "aliases": ["ActionButton"]
    }
  },
  "functions": {
    "Percent": {
      "description": "Format part / total as a percentage",
      "params": {
        "type": "object",
        "properties": {
          "part": { "type": "number" },
          "total": { "type": "number" }
        },
        "required": ["part", "total"]
      },
      "order": ["part", "total"],
      "returns": { "type": "string" }
    }
  }
}
```

### 2.1 `id` and `version`

`id` and `version` are metadata. A host uses them in the `library=` attribute of a stored message (section 7) and to name a prompt version. They do not change how a program is parsed.

### 2.2 `root`

`root` names the library's root component, used in the entry rule ([language.md](./language.md), section 2.2). When present, it MUST name a component in `components`. Without `root`, only a statement named `root` is an entry.

### 2.3 The validation schema

The schema is the single source of truth for a component's arguments.

- Each component's `order` array in `components` lists its prop names in positional order. `Button("Save", a, "primary")` maps `label`, `action`, `variant` in that order.
- `required` lists the props that must be present. A prop's `default` fills a missing required argument before the component is dropped.
- A prop that takes a component, an action, or a `$binding` carries the `x-openui` keyword: `"x-openui": "component"`, `"action"`, or `"binding"`. A list of components marks its `items`. A binding prop also carries its value type, for example `{ "type": "string", "x-openui": "binding" }`.

JSON object key order is not portable. Readers MUST use `order`, not the key order of `properties`.

### 2.4 Derived signatures

Each entry in `components` has a `signature` and a `description`. The `signature` is derived from the schema. If they disagree, the schema wins, and a consumer SHOULD rebuild the signature from it. The format is in section 5.

### 2.5 Custom functions

A library declares pure functions with `defineFunction({ name, description, params, returns, fn })`. The spec keeps name, description, `params` (a JSON Schema object), `order` (the positional order of the params, as for components), and `returns`. `fn` never serializes. It receives one object keyed by the `params` names. Each client implements the function itself.

A program calls a custom function like a built-in, with the `@` prefix and positional arguments in `order`:

```
share = TextContent(@Percent(done, total))
```

The prompt lists custom functions next to the built-ins. Lookup goes to built-ins first, then custom functions. A call to a name that is not a built-in, an action step, or a custom function evaluates to null, like an unresolved reference, and reports `unknown-function`. The statement is not dropped ([language.md](./language.md), sections 3.6 and 8.2).

Fixtures: `evaluation/*-function-*`, `errors/*-unknown-function-*`

### 2.6 What the spec does not do

The LibrarySpec drives prompt generation and validation, not rendering. Each platform writes its components natively and decides how they look and behave, including which props bind to state and how inputs attach to forms.

### 2.7 Output from the tools

`library.toSpec()` returns the document above. `library.toJSONSchema()` returns the `schema` alone. The CLI command `npx @openuidev/cli generate` writes the system prompt and, with `--out prompt.txt`, a `prompt.spec.json` beside it. `--json-schema` prints the schema alone. `--spec` prints the full spec.

Fixtures: none. The spec shape is checked on the library, not by program fixtures.

## 3. Rules for libraries

### 3.1 Conformance

- Component names MUST start with an uppercase letter and match the identifier rule.
- Custom function names MUST start with an uppercase letter, like the built-ins (`@Percent`).
- Required props MUST come before optional props in `order`. A required prop that has a `default` counts as optional here, so it may be added at the end.
- A library MUST NOT define components named `Query`, `Mutation`, or `Action`.
- A library MUST NOT use a built-in name for a component or a function. New built-in names are reserved when added (for example `@Take`).
- Custom functions MUST be pure and synchronous. They read their arguments and return a value. They do not touch state, the network, or the clock.
- `root`, when present, and every component in `componentGroups` MUST exist in `components`.

Fixtures: none. These are definition-time checks on the library.

### 3.2 Backward compatibility

Stored programs are plain text. They stay readable as long as libraries follow these rules:

1. **Only add props at the end.** Never reorder props. Never remove a prop.
2. **A renamed component lists its old name in `aliases`.** Props are positional, so a prop rename never touches a stored program. Only component names need aliases.
3. **New required props need a default.** An old program cannot supply it, so the `default` fills it. With a default, the prop counts as optional (section 3.1), so it goes at the end, as rule 1 says.
4. **New built-in names are reserved.** Library components and functions MUST NOT use them.

Position is the meaning of an argument, which is why rule 1 matters most. [overview.md](./overview.md), section "Keeping stored UIs working", says the same in plain words.

Fixtures: none. These are authoring rules for library owners.

## 4. Prompt generation

### 4.1 Determinism

The system prompt is a function of the LibrarySpec, the options, and the prompt version. The same inputs give byte-identical prompts on every platform.

The entry point is `generateSystemPrompt({ library, promptOptions })`. The flat `generatePrompt(spec)` form is deprecated.

Fixtures: none in `spec/fixtures/`. A golden-file test generates the prompt for a fixed library and options and compares the bytes to a stored file.

### 4.2 Options

| option | effect |
| --- | --- |
| `promptVersion` | `"1.0"` (default) or `"0.x"`. See section 4.3. |
| `toolCalls` | Teaches `Query`, `Mutation`, and `@Run`. Defaults to true when `tools` is given. |
| `bindings` | Teaches `$variables`, `@Set`, `@Reset`, and `$binding<type>` props. Defaults to true when `toolCalls` is on. |
| `builtinFunctions` | Lists the built-in functions even when `toolCalls` and `bindings` are off. |
| `editMode` | Teaches editing by changed statements (section 6.4). |
| `inlineMode` | Teaches prose plus fenced code. |
| `tools` | Tool descriptors: a name string, or `{ name, description?, inputSchema, outputSchema, annotations? }`. |
| `preamble`, `examples`, `toolExamples`, `additionalRules` | Extra text the host adds to the prompt. |

The built-in function section appears when `toolCalls` or `bindings` is on, or when `builtinFunctions` is true. Custom functions are listed in the same section, which prints whenever the library has any, since they also work in plain props.

The inline mode section MUST teach two rules. First, openui-lang belongs only inside fences, and a `text`-tagged fence shows code without rendering it. Second, independent UI blocks go in separate fences with prose between them.

### 4.3 Prompt versions

- **`1.0`** is the default.
- **`0.x`** is a frozen copy of the previous prompt, for models trained on it. It never changes.

What the 1.0 prompt changes:

- It prints the validation rules type once, not once per component.
- It uses no em dashes.
- It teaches that a prop typed as a list takes `[...]` even for one item.
- It teaches the entry rule, single-step actions, and `@Take`.
- It teaches that arguments are positional only. To skip an optional argument, write `null`.

### 4.4 Order of the prompt

1. The syntax rules: statement shape, positional arguments, and the entry statement `root`.
2. The component list (section 5).
3. The built-ins and the tool section, when the options turn them on, and the custom functions, when the library has any.
4. The hoisting and streaming guidance.
5. The edit mode and inline mode sections, when the options turn them on.

Components appear in the order they are listed in `components`. `componentGroups` split the list into titled sections. A group is `{ name, components, notes? }`. Components in no group go under "Other".

Fixtures: none in `spec/fixtures/`. Covered by the golden-file test in section 4.1.

## 5. Component signatures and descriptions

Each component is one line in the prompt: the signature, a separator, and the description.

```
Button(label: string, action?: ActionExpression, variant?: "primary" | "secondary") - A clickable button
```

The 1.0 prompt joins the two with a space, a hyphen, and a space. The `0.x` prompt keeps its original em dash separator. The line MUST stay on one line.

### 5.1 Signature format

- Primitive types print as `string`, `number`, `boolean`, `any`.
- Enums print as quoted alternatives joined by `|`.
- Arrays print as `T[]`.
- Inline objects print as `{field: type}`.
- Unions are joined by `|`.
- An optional prop has `?` before the colon: `variant?: "primary"`.
- A prop that binds to state prints as `$binding<type>`.
- Names such as `ActionExpression` come from ids the library gives to shared schemas.

### 5.2 Descriptions

A description SHOULD say what the type does not: units, ranges, and when to use each enum member. It SHOULD NOT repeat the type.

### 5.3 Error hints

Error `hint` fields do not reuse the signature line. They carry a shorter form: prop names only, with required props marked by a star ([language.md](./language.md), section 8.3).

Fixtures: none in `spec/fixtures/`. Covered by the golden-file test in section 4.1.

## 6. The conversation

### 6.1 History

The model's earlier responses appear in history as the OpenUI Lang text it wrote, with surrounding prose in inline mode.

The host removes every marker line (section 7) from history before the model sees it. The rules in section 3.2 keep stored programs readable across library changes.

Fixtures: `messages/*-strip-*`

### 6.2 Error feedback

When a response had errors, the host SHOULD send the structured error list in the next request. The wire shape is in [language.md](./language.md), section 8.3. Each error has a `hint`.

Fixtures: `errors/`

### 6.3 Action events

A user action that continues the conversation becomes the next user turn. It has three parts:

- the message, written for people (`@ToAssistant("Save order")`);
- the `context`, any value the program passed as the second argument: a string, number, object, or array;
- the form state.

The host receives `context` unchanged in `params.context`. How it reaches the model is up to the host (see "Reference format" below). The host writes the context and form state in a `context` section (section 7). The event shape is in [language.md](./language.md), section 6.3.

Form state is read when the step runs, not when the click starts. A `@Set` earlier in the same action is visible in the form state.

A step can stand alone in an action position. It is a plan of one step:

```
Button("Save", @ToAssistant("Save order"))
```

This equals `Button("Save", Action([@ToAssistant("Save order")]))`. It works for `@ToAssistant`, `@OpenUrl`, `@Set`, `@Reset`, and `@Run`.

**Reference format.** Hosts may use their own format. The reference chat client and the reference backend use this one. The user turn is stored as:

```
]]>openui:content
<message text>
]]>openui:context
["User clicked: <message>", <formState object>, <context value if any>]
```

The model receives one user message: `<message text>`, a newline, then `context and form values = <that JSON>`. All marker lines are removed. The third element, the `@ToAssistant` context, is new in 1.0. Earlier assistant turns reach the model as their program text only, with markers and stored form state removed.

Fixtures: `actions/`, `messages/*-turn-*`

### 6.4 Edit mode

With `editMode` on, the host sends the current program with the request. The model answers with only the changed statements, and the client merges them into the current program. Without `editMode`, every response is a complete program.

The merge uses the same statement boundary rules as parsing ([language.md](./language.md), section 1.4), including ternaries that span several lines. The merge rules are in [language.md](./language.md), section 7.

Fixtures: `editing/`

## 7. The message protocol

A host stores a response as text, with the program wrapped in marker lines. The model never writes or sees these lines.

### 7.1 Marker lines

```ebnf
marker     = "]]>openui:" kind [ "?" attributes ] line_end ;
kind       = lowercase_letter { lowercase_letter } ;
line_end   = "\n" | "\r\n" | end of message ;
```

The kind ends at the first `?` or line end. Example:

```
]]>openui:content?library=support%401.2.0
```

The attributes are a query string in `application/x-www-form-urlencoded` form, as produced by `URLSearchParams`. Pairs are `key=value`, joined by `&`. `%40` is the encoded `@`, and a space is written `+`. Readers decode the string the same way and accept an unencoded `@`.

A marker counts only at the very start of a line. `]]>openui:` in the middle of a line is ordinary text.

Fixtures: `messages/*-marker-*`

### 7.2 Kinds and sections

| kind | shape | body |
| --- | --- | --- |
| `content` | Opens a section. | The program, or prose with fenced programs. |
| `context` | Opens a section. | JSON defined by the host. OpenUI requires no structure. |
| `end` | One line. No body. | The stream reached its last chunk. |

A section body starts on the line after its marker and runs up to the next marker line, or to the end of the message. The newline just before the next marker line is not part of the body.

In a stored message, a missing `end` line means the stream died before it finished.

The reference chat client stores `[formState]` as the context of an assistant turn, and the array in section 6.3 for a user turn. That is its own usage, not a shape OpenUI requires.

Example:

```
]]>openui:content?library=support%401.2.0
root = Card([title, saveBtn])
title = TextContent("Order")
saveBtn = Button("Save", @ToAssistant("Save order", {"orderId": 42}))
]]>openui:context
{"formState":{"note":"rush"},"context":{"orderId":42}}
]]>openui:end
```

Fixtures: `messages/*-section-*`

### 7.3 Reading messages

1. **Last `content` wins.** With more than one `content` section, the reader uses the last one. A `context` section that comes before it is dropped.
2. **Text before the first marker.** It is the content when the message has no `content` marker. Otherwise the reader ignores it.
3. **Unknown attributes** are ignored.
4. **Unknown kinds.** The reader strips the marker line and its text up to the next marker line.
5. **Text after `end`.** Hosts never write it. A reader keeps it with the section the `end` line interrupted.
6. **Display.** The reader never shows marker lines, and never shows the `context` section as content.

While a response streams, the last line may be incomplete. If that line starts with `]]>openui:`, or is a prefix of it, the reader holds it back until its newline arrives or the stream ends.

Fixtures: `messages/*-read-*`

### 7.4 Writing messages

The host writes the markers. It puts a `content` line before the response and, when it has form state or click context, a `context` line before the JSON. It writes `end` when the stream finishes. To name the library, it writes `library=<id>@<version>`, with `id` and `version` from the LibrarySpec (section 2.1), encoded as in section 7.1.

The attribute tells a later reader which library wrote the message. It does not change how the program is parsed.

Fixtures: `messages/*-write-*`

### 7.5 What the model sees

Nothing of this protocol. The party that builds a model request MUST strip every marker line, and every section body it does not use, before the text reaches the model. The party that shows a message MUST strip every marker line before display. The prompt never teaches the syntax.

Fixtures: `messages/*-strip-*`

### 7.6 Older forms

- The attribute `libraryVersion` (a version with no library id) is still written by some hosts. Readers return it like any other attribute.
- Other envelopes, such as an XML `<content>`/`<context>` wrapper or an artifact header, are host-specific. OpenUI readers do not read them; the host that writes them reads them.

Fixtures: `messages/*-legacy-*`

## Appendix A. Changelog

- **2026-09-30: 1.0.** The LibrarySpec is one document with `id`, `version`, `root`, the schema, signatures, and `functions`. Prompts are deterministic, with versions `1.0` and `0.x`. Libraries follow backward-compatibility rules. The message protocol uses `content`, `context`, and `end` marker lines.
- Earlier drafts: 0.9 community review (2026-07-22) and 1.0-beta (2026-08-05). See the git history for their changes.
