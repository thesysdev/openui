# @openuidev/assistant-ui

## 0.2.1

### Patch Changes

- [#1544](https://github.com/thesysdev/openui/pull/1544) [`cebe02b`](https://github.com/thesysdev/openui/commit/cebe02b1c38eb7177a69d49fd7cf10a5f8a20b66) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Show where a live artifact's numbers come from. `LiveArtifactRenderer` takes `enableProvenance`: the bar gets an inspect toggle (`ProvenanceToggle`), a click on a component or a number while inspecting selects it instead of acting, and `Provenance` shows your panel for it. By default it shows a Sources panel docked beside the dashboard, opened by the bar's "Sources" button: every query, and for a click its query, result and formula; pass `describeSource` to `Provenance` to name your tools, or children to use your own panel. `useArtifactProvenance()` returns the selection and the program's sources: each component's queries with their calls and results, the formula in between and its filters. Style inspect mode with `[data-openui-hover]`, `[data-openui-selected]` and `.openui-artifact-inspecting`.

  In lang-core, a component written inside a statement gets an id, `componentId` (`lead.2`: the third component inside `lead`), and `dataSources` lists it. In react-lang, components may receive `bindSource`, which marks their root element (`bindSource()`) and a prop's element (`bindSource("value")`); `readSourceTarget(element)` finds the component and prop under a click, also for components that don't call `bindSource`. `useDataSources()` returns `DataSources`. `Renderer.DefaultContent` is what `Renderer` shows without children. In the dashboard library, `Kpi`, `Stat` and `Kpis` mark their value and comparison. `@openuidev/react-ui` now needs `@openuidev/react-lang` 1.2.0 or later, for these APIs: update both together (`pnpm add @openuidev/react-ui@^0.19 @openuidev/react-lang@^1.2`). `@openuidev/assistant-ui` accepts `@openuidev/react-ui` and `@openuidev/react-headless` 0.19.

- Updated dependencies [[`1ff6b26`](https://github.com/thesysdev/openui/commit/1ff6b265c5af6f242b4f5949c8db36db2c51f5ea), [`cebe02b`](https://github.com/thesysdev/openui/commit/cebe02b1c38eb7177a69d49fd7cf10a5f8a20b66), [`cebe02b`](https://github.com/thesysdev/openui/commit/cebe02b1c38eb7177a69d49fd7cf10a5f8a20b66), [`bbc525d`](https://github.com/thesysdev/openui/commit/bbc525d919cd622f18d6b111d4db26fb7538b94f), [`bbc525d`](https://github.com/thesysdev/openui/commit/bbc525d919cd622f18d6b111d4db26fb7538b94f), [`a8ba1dd`](https://github.com/thesysdev/openui/commit/a8ba1dde96a59e5f7a66276c79114e98b946ab83)]:
  - @openuidev/react-headless@0.19.0
  - @openuidev/react-ui@0.19.0
  - @openuidev/react-lang@1.2.0

## 0.2.0

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

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - The error fallback no longer appears for warnings, such as a program without `root` whose entry still renders.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI 1.0 review fixes:

  - lang-core: the built-in functions prompt no longer uses react-ui's `Col` in its `@Each` example, and names Query only when tool calls are on.
  - lang-core: `JSONSchemaDef` adds `type` and `anyOf`, so the CLI's spec for a library that uses `action()` passes to `generateSystemPrompt` without a cast.
  - react-ui: the chat prompt's button rules name `@ToAssistant` and `@OpenUrl`.
  - react-ui, a2ui, assistant-ui, devtools, react-email: the `@openuidev/react-lang` peer window now covers the version this release publishes.

- Updated dependencies [[`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2)]:
  - @openuidev/react-lang@1.0.0
  - @openuidev/react-ui@0.18.0
  - @openuidev/react-headless@0.18.0

## 0.1.3

### Patch Changes

- [#1343](https://github.com/thesysdev/openui/pull/1343) [`497681e`](https://github.com/thesysdev/openui/commit/497681eefecf7d61b863e98af7dec98555941cf8) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Widen the internal `react-lang` peer windows to include the 0.4.x line that the
  Renderer slots release (a minor bump of the lang family) publishes.
- Updated dependencies [[`f1f66c4`](https://github.com/thesysdev/openui/commit/f1f66c4266d6d76d73b94530b32653fecd1f6c01), [`497681e`](https://github.com/thesysdev/openui/commit/497681eefecf7d61b863e98af7dec98555941cf8)]:
  - @openuidev/react-lang@0.4.0
  - @openuidev/react-ui@0.17.1
  - @openuidev/react-headless@0.17.1

## 0.1.2

### Patch Changes

- [#1263](https://github.com/thesysdev/openui/pull/1263) [`453b820`](https://github.com/thesysdev/openui/commit/453b820dacfdc4a435d456059c5174da75c8cea9) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - Widen the internal `react-headless`/`react-ui` peer windows to include the
  0.17.x line that the D3 charts release (a minor bump of the react-ui /
  react-headless pair) publishes.
- Updated dependencies [[`d51a09c`](https://github.com/thesysdev/openui/commit/d51a09cd4ed9639f5e606a9c07faef352672a164), [`301d668`](https://github.com/thesysdev/openui/commit/301d66856835a81211628212f11833fe56a57dd4), [`dd4f450`](https://github.com/thesysdev/openui/commit/dd4f45074ac50b59d78e2855bd203e0e0562c95b)]:
  - @openuidev/react-ui@0.17.0
  - @openuidev/react-lang@0.3.1
  - @openuidev/react-headless@0.17.0

## 0.1.1

### Patch Changes

- [#1186](https://github.com/thesysdev/openui/pull/1186) [`0227ad7`](https://github.com/thesysdev/openui/commit/0227ad77ed79a6292802960c69b61e6a75e0fcae) Thanks [@abhithesys](https://github.com/abhithesys)! - Widen the internal `react-headless`/`react-ui` peer windows to include the
  0.16.x line, fixing an install-time peer mismatch where these packages
  required a `react-headless`/`react-ui` version older than the one they ship
  against.
- Updated dependencies [[`0227ad7`](https://github.com/thesysdev/openui/commit/0227ad77ed79a6292802960c69b61e6a75e0fcae)]:
  - @openuidev/react-ui@0.16.1
  - @openuidev/react-headless@0.16.1

## 0.1.0

### Minor Changes

- [#1184](https://github.com/thesysdev/openui/pull/1184) [`5cde7c3`](https://github.com/thesysdev/openui/commit/5cde7c36ccd419570dd6b2653fc88dc4f6471964) Thanks [@abhithesys](https://github.com/abhithesys)! - Widen peer dependency ranges for `@openuidev/react-headless` and `@openuidev/react-ui` to allow `0.15.x` (`>=0.14.0 <0.16.0`).

### Patch Changes

- Updated dependencies [[`5cde7c3`](https://github.com/thesysdev/openui/commit/5cde7c36ccd419570dd6b2653fc88dc4f6471964)]:
  - @openuidev/react-ui@0.16.0
  - @openuidev/react-headless@0.16.0

## 0.0.4

### Patch Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - Internal `@openuidev/*` peer dependencies now declare bounded
  tested-compatibility ranges (e.g. `">=0.3.0 <0.4.0"`) instead of `workspace:`
  ranges, so a mismatched pair is caught at install time instead of failing at
  runtime.
- Updated dependencies [[`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503), [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/react-lang@0.3.0
  - @openuidev/react-headless@0.14.0
  - @openuidev/react-ui@0.14.0
