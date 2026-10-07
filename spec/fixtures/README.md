# OpenUI 1.0 conformance fixtures

The layout and main file formats are in [language.md](../language.md), Appendix B. This file lists the details Appendix B leaves open. Every expected result was written from the spec text.

```text
spec/fixtures/
  library.json          the test library, used by every case
  known-failing.json    ids a runner reports but does not fail on, with the reason
  <area>/<NNN-short-name>/
```

## The test library

`library.json` is a LibrarySpec ([prompt.md](../prompt.md), section 2) with `root: "Stack"`, twelve components, and one custom function, `@Upper(text)`, which returns the text in upper case. The function has no implementation in the file, so a runner supplies it.

Positional order comes from each component's `order` array. Bindable props carry `"x-openui": "binding"`, action props `"x-openui": "action"`, and component lists mark their `items` with `"x-openui": "component"`.

## Program cases

Files: `input.oui` (streaming cases: `chunks.json`) and `expected.json`.

`expected.json` has the keys of Appendix B: `root`, `errors`, `unresolved`, `orphans`, `incomplete`. It may also have:

- `state`: the state defaults after the stream ends, `{ "$name": value }`. When present it must match exactly.
- `statements` (editing cases): the statement names of the merged program, in order.
- `errorObjects`: full error objects (language.md, section 8.3). Only the listed keys are compared.

How the tree is summarized:

- A component is `{ "type", "props" }`. A prop that is null or absent is left out. Array elements are kept as they are, including `null`.
- An action is `{ "action": [{ "step", "args" }] }`. Step names drop the `@`: `ToAssistant`, `OpenUrl`, `Set`, `Reset`, `Run`. `ToAssistant` args are the message, plus the context when there is one. `Set` args are the target and its value, evaluated with the state at stream end. `Reset` args are the targets, and `Run` args are the statement id. A lone step in an action prop is summarized as a plan of one step.
- A binding is `{ "$binding": "$name" }`.
- Values come from evaluating the tree when the stream ends. No query has returned yet, so a reference to a query reads its defaults, and a reference to a mutation reads `{ "status": "idle", "data": null, "error": null }`.

Comparison:

- `errors` is compared as a multiset. An entry without `statementId` matches any statement, which is how `no-root` is written.
- `unresolved` and `orphans` are compared as sets.
- Streaming cases must match both after the last chunk plus the end of the stream, and as a batch parse of the joined chunks (language.md, section 4: streaming equals parsing).
- `*-roundtrip-*` cases also serialize the rendered tree, parse it again, and expect the same `root`.

## Editing cases

Files: `input.oui` (the current program), `patch.oui` (the model's reply), and `expected.json`. The runner merges the patch into the program (language.md, section 7), then parses the result as a program case. `statements` is read from the merged text: each line that starts with `name =` at column 0 starts a statement.

## Action and form cases

These cases add `steps.json` as in Appendix B. A step is `{ "click": id }`, `{ "type": [id, text] }`, or `{ "tool": name, "result": json }`, where `id` is the statement name of a Button or Input.

- A `tool` step sets what that tool returns from then on. Tool steps before the first user step apply before the program mounts.
- `expected.events` lists the host events in order. Each entry is compared on the keys it lists only. `"formName": null` means the key is absent or null.
- `expected.state` is compared key by key against the state store.
- `expected.toolCalls` is optional: `[{ "tool", "args" }]`, the tool calls in order. Consecutive identical calls count once. Appendix B has no way to check tool arguments, so this key extends it.

The test library's Input writes a form field as `{ "value", "componentType": "input" }`. `componentType` is up to each platform's components, so fixtures only use it with this library.

State cases with user input (`state/*-binding-*`, `state/*-form-*`) use `steps.json` too.

## Validation cases

`state/*-validation-*` cases hold `validation.json` instead of a program: `{ "cases": [{ "rules", "value", "valid" }] }`. `rules` is the validation rules object (language.md, section 5.4). The runner checks each value against the rules and compares only pass or fail, not the message.

## known-failing.json

`{ "<area>/<name>": "reason" }`. The `steps.json` part of a case has its own id, `<area>/<name>#steps`. A runner reports every case, fails only on unlisted failures, and reports listed cases that pass so they can be removed.
