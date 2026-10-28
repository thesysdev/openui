# @openuidev/devtools

## 0.3.1

### Patch Changes

- [#1497](https://github.com/thesysdev/openui/pull/1497) [`e2ae4f1`](https://github.com/thesysdev/openui/commit/e2ae4f1de01cf1a48c40cf1a6d8042f7c0d50f2f) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Add a Position setting to the Inspect settings menu to move the launcher and the Inspect and Debug panels to any corner of the screen. The launcher can also be dragged: a short drag toward another corner snaps it there. The choice is saved, and the `position` prop sets the default.

- [#1500](https://github.com/thesysdev/openui/pull/1500) [`d4711b2`](https://github.com/thesysdev/openui/commit/d4711b2b5c53fefe870dba10112b8d13e5b70929) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Settle the devtools stream row when a Renderer unmounts mid-stream. It used to stay on "Streaming" forever; react-lang now publishes an `unmounted` stream event and devtools shows an "Interrupted" badge with the final duration.
- Updated dependencies [[`d4711b2`](https://github.com/thesysdev/openui/commit/d4711b2b5c53fefe870dba10112b8d13e5b70929), [`c9f93b6`](https://github.com/thesysdev/openui/commit/c9f93b6e57d05b19b9781846769da530c6741dc4)]:
  - @openuidev/react-lang@1.0.2

## 0.3.0

### Minor Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI Lang 1.0.

  - Upgrade `@openuidev/lang-core` and `@openuidev/react-lang` together, and together with the server that generates the system prompt. A 1.0 prompt teaches bare action steps (`@ToAssistant("Hi")` without `Action([...])`), which a 0.x client does not run.
  - react-ui 0.18 requires react-lang 1.0 (peer `>=1.0.0 <2.0.0`); upgrade them together.
  - browser-bundle 0.2 bundles react-lang 1.0 and react-ui 0.18.
  - server 0.3 uses lang-core 1.0 for autofix (parser and system prompt); stay on server 0.2 with a 0.x client. Autofix ignores warnings and accepts a ternary entry, so a program that renders does not start a fix round.
  - vue-lang, svelte-lang and angular-lang stay on 0.4 (OpenUI Lang 0.x). Keep `@openuidev/lang-core` ^0.4 for the prompts they render.
  - A program whose `root` statement is written last shows nothing while it streams, until the `root` line arrives. Write `root` first, as the system prompt asks.
  - A cut-off output that never reached its `root` statement, or any statement calling the root component, now renders blank instead of a partial tree.

### Patch Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI 1.0 review fixes:

  - lang-core: the built-in functions prompt no longer uses react-ui's `Col` in its `@Each` example, and names Query only when tool calls are on.
  - lang-core: `JSONSchemaDef` adds `type` and `anyOf`, so the CLI's spec for a library that uses `action()` passes to `generateSystemPrompt` without a cast.
  - react-ui: the chat prompt's button rules name `@ToAssistant` and `@OpenUrl`.
  - react-ui, a2ui, assistant-ui, devtools, react-email: the `@openuidev/react-lang` peer window now covers the version this release publishes.

- Updated dependencies [[`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2)]:
  - @openuidev/react-lang@1.0.0

## 0.2.3

### Patch Changes

- [#1343](https://github.com/thesysdev/openui/pull/1343) [`497681e`](https://github.com/thesysdev/openui/commit/497681eefecf7d61b863e98af7dec98555941cf8) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Widen the internal `react-lang` peer windows to include the 0.4.x line that the
  Renderer slots release (a minor bump of the lang family) publishes.
- Updated dependencies [[`f1f66c4`](https://github.com/thesysdev/openui/commit/f1f66c4266d6d76d73b94530b32653fecd1f6c01)]:
  - @openuidev/react-lang@0.4.0

## 0.2.2

### Patch Changes

- [#1207](https://github.com/thesysdev/openui/pull/1207) [`1b1f3ba`](https://github.com/thesysdev/openui/commit/1b1f3ba95ace51402b0104a47a37a7391e6e8f23) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Split the reliability banner CTA into a primary "Get API key" button linking to the Thesys Console and a secondary "View docs" button.

- [#1208](https://github.com/thesysdev/openui/pull/1208) [`21d8df3`](https://github.com/thesysdev/openui/commit/21d8df3f9cbce6201871f26c7d3479648a7e8c9f) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Bundle Inter (latin variable subset) with the devtools widget so it renders in Inter regardless of the host app's fonts, instead of silently falling back to the system font.

## 0.2.1

### Patch Changes

- [#1172](https://github.com/thesysdev/openui/pull/1172) [`6de371d`](https://github.com/thesysdev/openui/commit/6de371d4e8ffe9f1e07023899afa4f8212e297ab) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Add dismissible local deployment prompts and align Inspect card spacing.

## 0.2.0

### Minor Changes

- [#1159](https://github.com/thesysdev/openui/pull/1159) [`0a46d6f`](https://github.com/thesysdev/openui/commit/0a46d6f2b665adcf677d7ab87b78800703e65809) Thanks [@abhithesys](https://github.com/abhithesys)! - Internal peer dependencies now declare bounded tested-compatibility ranges:
  `@openuidev/react-lang` requires `">=0.3.0 <0.4.0"`. Minor (breaking) rather
  than patch on purpose: react-lang 0.2.x depends on devtools with `^0.1.0`, so
  a 0.1.x release would be pulled into existing react-lang 0.2.x installs and
  fail them with an unsatisfiable peer. Bumping to 0.2.0 keeps old react-lang
  paired with old devtools; react-lang >=0.3.0 picks up the new line.

### Patch Changes

- Updated dependencies [[`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/react-lang@0.3.0
