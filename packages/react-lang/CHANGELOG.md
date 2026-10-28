# @openuidev/react-lang

## 1.0.2

### Patch Changes

- [#1500](https://github.com/thesysdev/openui/pull/1500) [`d4711b2`](https://github.com/thesysdev/openui/commit/d4711b2b5c53fefe870dba10112b8d13e5b70929) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Settle the devtools stream row when a Renderer unmounts mid-stream. It used to stay on "Streaming" forever; react-lang now publishes an `unmounted` stream event and devtools shows an "Interrupted" badge with the final duration.

- [#1455](https://github.com/thesysdev/openui/pull/1455) [`c9f93b6`](https://github.com/thesysdev/openui/commit/c9f93b6e57d05b19b9781846769da530c6741dc4) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - The React Native entry now renders React Native primitives instead of DOM elements. `Renderer`, its slots, and `WithPreviewRenderer` used to mount `<div>`/`<button>`/`<section>` on native, which crashed Metro with "View config getter callback for component `div` must be a function". The native build now uses `View`, `Pressable`, and `ActivityIndicator`, with slot props typed for React Native (`onPress`, `View` styles). `react-native` is an optional peer dependency. Web is unchanged.
- Updated dependencies [[`6fbaf91`](https://github.com/thesysdev/openui/commit/6fbaf91fb31fa3ad4008718540ca2fe24eb4d60c), [`e2ae4f1`](https://github.com/thesysdev/openui/commit/e2ae4f1de01cf1a48c40cf1a6d8042f7c0d50f2f), [`d4711b2`](https://github.com/thesysdev/openui/commit/d4711b2b5c53fefe870dba10112b8d13e5b70929)]:
  - @openuidev/lang-core@1.0.2
  - @openuidev/devtools@0.3.1

## 1.0.1

### Patch Changes

- [#1394](https://github.com/thesysdev/openui/pull/1394) [`5186585`](https://github.com/thesysdev/openui/commit/51865854eb16e259089b736bf480b10b2e42b2ad) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Update the README for OpenUI Lang 1.0: working snippets and links to the new docs pages.
- Updated dependencies [[`5186585`](https://github.com/thesysdev/openui/commit/51865854eb16e259089b736bf480b10b2e42b2ad)]:
  - @openuidev/lang-core@1.0.1

## 1.0.0

### Major Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI Lang 1.0.

  - Upgrade `@openuidev/lang-core` and `@openuidev/react-lang` together, and together with the server that generates the system prompt. A 1.0 prompt teaches bare action steps (`@ToAssistant("Hi")` without `Action([...])`), which a 0.x client does not run.
  - react-ui 0.18 requires react-lang 1.0 (peer `>=1.0.0 <2.0.0`); upgrade them together.
  - browser-bundle 0.2 bundles react-lang 1.0 and react-ui 0.18.
  - server 0.3 uses lang-core 1.0 for autofix (parser and system prompt); stay on server 0.2 with a 0.x client. Autofix ignores warnings and accepts a ternary entry, so a program that renders does not start a fix round.
  - vue-lang, svelte-lang and angular-lang stay on 0.4 (OpenUI Lang 0.x). Keep `@openuidev/lang-core` ^0.4 for the prompts they render.
  - A program whose `root` statement is written last shows nothing while it streams, until the `root` line arrives. Write `root` first, as the system prompt asks.
  - A cut-off output that never reached its `root` statement, or any statement calling the root component, now renders blank instead of a partial tree.

### Minor Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Add custom actions: `defineAction({ name, description, params })` plus `createLibrary({ actions })`. Programs use them like the built-in steps, alone or in `Action([...])`, for example `Button("Copy", @CopyToClipboard(order.id))`, with positional arguments in `params` key order. On click the step reaches the host `onAction` as `{ type: name, params }` (schema defaults applied), in order with the other steps, and the event is typed from the library so `params` narrows by `type`. Args are validated like library function args, and a step with invalid args is a no-op. Only a real call produces a custom step: a plan read from data (an object literal, `$state`, an `@Each` item) loses its custom steps, and a legacy action object whose type names a custom action is ignored. `library.toJSONSchema()` lists actions under `actions`, the prompt lists them with the built-in action steps, and `toSpec()` includes them. The React `Renderer` and the server autofix parser pick them up automatically, and the react-ui `Button` validates its form before a custom action.

  Types: the exported `ActionStep` union adds `{ type: "custom_action"; name; params }`, so a `switch` over `ActionStep` types needs a case for it.

  In react-ui, `AgentInterface` takes `onAction`, which receives the actions the chat does not handle itself, such as custom actions.

  The built-in steps (`@Run`, `@ToAssistant`, `@OpenUrl`, `@Set`, `@Reset`) are now defined like custom actions and live in the same call registry, so their prompt lines are generated too (for example `@OpenUrl(url: string)`). `ACTION_NAMES` is removed.

  A defined action has a `.ref` for slots that take only some actions, for example `share: z.union([copy.ref, steps.OpenUrl.ref]).optional()`: the prompt signature prints `share?: @CopyToClipboard | @OpenUrl`, and the JSON gets a `CopyToClipboard` `$defs` entry `{ type: "CopyToClipboard", params }`.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Add `parseMessage` and `buildMessage` for the OpenUI message protocol (`]]>openui:content`, `context`, `end` marker lines). The react-lang `Renderer` now accepts a stored message as `response` and renders its content.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Add library functions: `defineFunction({ name, description, params, returns, fn })` plus `createLibrary({ functions })`, for example `@Percent(done, total)`. Programs call them with positional arguments in `params` key order, and `fn` receives one object with schema defaults applied. `library.toJSONSchema()` lists them under `functions` (params and returns as JSON Schema) and `toSpec()` describes them like components, so every parser built from the schema, including the server autofix, accepts them. Args go through the component prop pipeline: the parser maps them by name and validates literals (`type-mismatch`, `missing-required`, `excess-args`; an invalid optional arg is dropped so its default applies), the runtime validates dynamic args and return values. An invalid call or a throwing `fn` evaluates to null with a `runtime-error`. Calls run on every streamed chunk like built-ins; the Renderer reports their errors once streaming ends. The prompt lists them with the built-in functions, and the new `builtinFunctions` prompt option lists the built-ins without `toolCalls` or `bindings`; prompt options never change what parses or runs.

  Built-ins are now defined with `defineFunction` too, so their prompt lines are generated (for example `@Sum(numbers: number[]) → number`). `BUILTINS`, `BUILTIN_NAMES`, `LAZY_BUILTINS`, `isBuiltin` and the `BuiltinDef` type are removed.

### Patch Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Action slots are JSON Schema `$ref`s, like component slots. An action prop is `{"$ref": "#/$defs/ActionExpression"}`, and the library's `$defs` has `ActionExpression` with the same legacy object union as before. A slot can name specific steps with refs, for example `share: z.union([steps.ToAssistant.ref, steps.OpenUrl.ref]).optional()` (lang-core, re-exported by react-lang): the JSON gets `ToAssistant` and `OpenUrl` `$defs`, and the prompt signature prints `share?: @ToAssistant | @OpenUrl`. These refs only shape the prompt and the JSON for now; the runtime accepts any step in them. Action `$defs` are never components.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Action steps are plans. Every step call now evaluates to a one-step plan (`{ steps: [step] }`), so a single step needs no wrapper: `Button("Ask", @ToAssistant("Tell me more"))`. Several steps still need `Action([...])`, for example `Button("Save", Action([@Set($saved, true), @ToAssistant("Saved")]))`; a plain list of steps stays a plain array. An invalid step evaluates to an empty plan (a no-op) instead of null, and `Action([...])` flattens nested plans. Legacy `{ type, params }` action configs are unchanged.

  New `action()` helper (lang-core, re-exported by react-lang), like `reactive()`: it returns the action prop schema, already tagged `ActionExpression`, so libraries write `action: action().optional()` instead of calling `tagSchemaId(..., "ActionExpression")` themselves. react-ui's action props use it.

  Prompt change: for libraries with action props (`ActionExpression`), the system prompt teaches one step bare and several steps in `Action([...])`. The react-ui prompt examples, including the chat library examples, use step calls instead of legacy objects.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Stored messages and Cloud responses whose second content line starts mid-line, after a cut-off first attempt, read the second attempt, as before.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Action steps read the form state when each step runs, so an earlier `@Set` in the same plan is visible.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI Lang 1.0 entry rule: the entry is the `root` statement, else the first statement that calls the library root component, wherever it is (`no-root` with `severity: "warning"`), else a `no-root` error. With no entry, statements are not also reported as orphaned. `root = $t ? A : B` is a valid entry, exposed as `ParseResult.rootExpression` and evaluated with the new `evaluateRoot()`. An `@Name(...)` call that is not a built-in or action step reports `unknown-function` and evaluates to null; its statement is kept.
  React: renders ternary entries and reports `no-root` instead of `parse-failed` when statements parsed but no entry rendered.
  `ValidationErrorCode` adds `no-root` and `unknown-function`. `ValidationError` and `OpenUIError` gain an optional `severity: "warning"`; react-lang passes it through to `onError`.

  Breaking:

  - A program without `root` in which no statement calls the library root component no longer renders its first component statement.
  - `@Name(...)` for a non-built-in, including `@Card(...)`, now evaluates to null with `unknown-function` instead of acting as a component call.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Add `library.extend()`, which derives a new library from an existing one (the base stays untouched): `lib.extend({ components: { add: [ProductCard], remove: ["Image"] }, functions: { add: [percent] }, actions: { add: [copy] } })`. Components support `add` (to the library only, or into content slots with `{ component, slots: ["Card"] }` or `"Card.children"`), `override` (every parent points at the replacement) and `remove` (dropped from every parent union and from `componentGroups`; removing the root or a slot's only type throws, and a removed name still in prompt notes, examples or rules warns once). Added functions and actions work like those passed to `createLibrary`. The result has no public `id`. Adding a name that already exists throws. The typed `onAction` event includes added actions and keeps the built-in events. Create derived libraries once at module scope, since parsers memoize by library identity. In development, react-lang registers each derived library with devtools under its own key.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - `parseMessage` reads a content line that starts mid-line as a new content section, so a regenerated response wins over the cut-off one, also while streaming. react-lang and react-ui drop their own copies of this step, and a Cloud response keeps the second attempt's scripts.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - A `$state` value that streams in no longer sticks at its half-written value: an untouched default is replaced when the full declaration arrives, a partly typed `$name` no longer becomes state, and setting up declared defaults no longer fires `onStateUpdate`. User edits are kept. `StreamParser.push`, `set` and `getResult` take a `complete` flag: pass `true` once the stream has ended, or a `$name` that is the last token is not declared.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - `@ToAssistant(message, context)` passes its context through unchanged as any value (object, array, number, string, including falsy ones). The `continue_conversation` step's `context` is now typed `unknown`, and react-lang forwards it in `params.context` whenever it is set. The react-ui chat adds it as the third element of the chat context, and card blocks append their item context to it as text, as before. The system prompt documents the context argument.
- Updated dependencies [[`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2)]:
  - @openuidev/lang-core@1.0.0
  - @openuidev/devtools@0.3.0

## 0.4.1

### Patch Changes

- [#1349](https://github.com/thesysdev/openui/pull/1349) [`05c1b25`](https://github.com/thesysdev/openui/commit/05c1b2500275711155625d1056f46a8222b954e2) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Fix form fields without reactive bindings appearing frozen after typing or restoring saved state. Propagate form-store updates through Renderer slots even when the evaluated UI tree is unchanged, and include the fix in the browser bundle.
- Updated dependencies []:
  - @openuidev/lang-core@0.4.1

## 0.4.0

### Minor Changes

- [#1268](https://github.com/thesysdev/openui/pull/1268) [`f1f66c4`](https://github.com/thesysdev/openui/commit/f1f66c4266d6d76d73b94530b32653fecd1f6c01) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Add optional Renderer slots for content, query loading, errors, and retry controls. Keep `queryLoader` supported on `Renderer` and `A2UIRenderer`. Preserve the default loading spinner; error/retry views render nothing unless supplied by the application.

  Preserve the existing query lifecycle while waiting for generation to finish. Keep mounted input state through retries and refresh query results when generated scripts change.

### Patch Changes

- Updated dependencies [[`497681e`](https://github.com/thesysdev/openui/commit/497681eefecf7d61b863e98af7dec98555941cf8)]:
  - @openuidev/devtools@0.2.3
  - @openuidev/lang-core@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`7c8f5e9`](https://github.com/thesysdev/openui/commit/7c8f5e9ae2e914063f7b47fc131fd46a7e178985)]:
  - @openuidev/lang-core@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies [[`55df79c`](https://github.com/thesysdev/openui/commit/55df79c2ff645b4c24b03be9c798f57cdf36dd99)]:
  - @openuidev/lang-core@0.3.1

## 0.3.0

### Minor Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - Adopt automated release management via changesets. The lang-family packages
  (`lang-core`, `react-lang`, `svelte-lang`, `vue-lang`) now version together as
  a fixed group; this release unifies them on a single version line.

### Patch Changes

- Updated dependencies [[`0a46d6f`](https://github.com/thesysdev/openui/commit/0a46d6f2b665adcf677d7ab87b78800703e65809), [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/devtools@0.2.0
  - @openuidev/lang-core@0.3.0
