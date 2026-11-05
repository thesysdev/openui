# @openuidev/react-ui

## 0.18.2

### Patch Changes

- Updated dependencies [[`da5ea77`](https://github.com/thesysdev/openui/commit/da5ea770eb4284d8d1a08471d46f5bf6fe6a8b0f)]:
  - @openuidev/react-headless@0.18.2

## 0.18.1

### Patch Changes

- [#1327](https://github.com/thesysdev/openui/pull/1327) [`86da07f`](https://github.com/thesysdev/openui/commit/86da07f6266887ff819cd5a8e295c75b2edc8251) Thanks [@shubham-thesys](https://github.com/shubham-thesys)! - Refresh the AgentInterface shell: a collapsed sidebar rail with a History menu and a draggable, remembered width; a pill composer and a shared ~72ch reading column; a centred welcome screen with starter tabs and a `card` starter variant; `AgentInterface.ThreadHeader` gains `start` / `center` / `end` slots, the chat title and a Rename/Delete menu; a Rename option in the thread menu; a shared menu style for Select, ModelSwitcher and dropdowns; a mascot loader in place of the dot-matrix loader; an exported `WelcomeMascot` (blinks, follows the cursor, squishes on click); an `AgentInterface.SidebarFooter` slot with `AgentInterface.ThemeModeToggle`, backed by the new `useThemeModePreference` hook; a redesigned tool call timeline with animated tool glyphs, plain-language labels (`toolLabel`, `ToolLabelsProvider`) and a live "Working" row; `defaultLabel` is deprecated in favour of `toolLabel`; and server-rendering support: the saved sidebar and theme preferences are restored just after hydration, before paint, with the interface's contents hidden until then so the first visible frame is already correct.

- [#1394](https://github.com/thesysdev/openui/pull/1394) [`5186585`](https://github.com/thesysdev/openui/commit/51865854eb16e259089b736bf480b10b2e42b2ad) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Update the README for OpenUI Lang 1.0: working snippets and links to the new docs pages.
- Updated dependencies [[`5186585`](https://github.com/thesysdev/openui/commit/51865854eb16e259089b736bf480b10b2e42b2ad), [`86da07f`](https://github.com/thesysdev/openui/commit/86da07f6266887ff819cd5a8e295c75b2edc8251)]:
  - @openuidev/react-lang@1.0.1
  - @openuidev/react-headless@0.18.1

## 0.18.0

### Minor Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Add custom actions: `defineAction({ name, description, params })` plus `createLibrary({ actions })`. Programs use them like the built-in steps, alone or in `Action([...])`, for example `Button("Copy", @CopyToClipboard(order.id))`, with positional arguments in `params` key order. On click the step reaches the host `onAction` as `{ type: name, params }` (schema defaults applied), in order with the other steps, and the event is typed from the library so `params` narrows by `type`. Args are validated like library function args, and a step with invalid args is a no-op. Only a real call produces a custom step: a plan read from data (an object literal, `$state`, an `@Each` item) loses its custom steps, and a legacy action object whose type names a custom action is ignored. `library.toJSONSchema()` lists actions under `actions`, the prompt lists them with the built-in action steps, and `toSpec()` includes them. The React `Renderer` and the server autofix parser pick them up automatically, and the react-ui `Button` validates its form before a custom action.

  Types: the exported `ActionStep` union adds `{ type: "custom_action"; name; params }`, so a `switch` over `ActionStep` types needs a case for it.

  In react-ui, `AgentInterface` takes `onAction`, which receives the actions the chat does not handle itself, such as custom actions.

  The built-in steps (`@Run`, `@ToAssistant`, `@OpenUrl`, `@Set`, `@Reset`) are now defined like custom actions and live in the same call registry, so their prompt lines are generated too (for example `@OpenUrl(url: string)`). `ACTION_NAMES` is removed.

  A defined action has a `.ref` for slots that take only some actions, for example `share: z.union([copy.ref, steps.OpenUrl.ref]).optional()`: the prompt signature prints `share?: @CopyToClipboard | @OpenUrl`, and the JSON gets a `CopyToClipboard` `$defs` entry `{ type: "CopyToClipboard", params }`.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI Lang 1.0.

  - Upgrade `@openuidev/lang-core` and `@openuidev/react-lang` together, and together with the server that generates the system prompt. A 1.0 prompt teaches bare action steps (`@ToAssistant("Hi")` without `Action([...])`), which a 0.x client does not run.
  - react-ui 0.18 requires react-lang 1.0 (peer `>=1.0.0 <2.0.0`); upgrade them together.
  - browser-bundle 0.2 bundles react-lang 1.0 and react-ui 0.18.
  - server 0.3 uses lang-core 1.0 for autofix (parser and system prompt); stay on server 0.2 with a 0.x client. Autofix ignores warnings and accepts a ternary entry, so a program that renders does not start a fix round.
  - vue-lang, svelte-lang and angular-lang stay on 0.4 (OpenUI Lang 0.x). Keep `@openuidev/lang-core` ^0.4 for the prompts they render.
  - A program whose `root` statement is written last shows nothing while it streams, until the `root` line arrives. Write `root` first, as the system prompt asks.
  - A cut-off output that never reached its `root` statement, or any statement calling the root component, now renders blank instead of a partial tree.

### Patch Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Action steps are plans. Every step call now evaluates to a one-step plan (`{ steps: [step] }`), so a single step needs no wrapper: `Button("Ask", @ToAssistant("Tell me more"))`. Several steps still need `Action([...])`, for example `Button("Save", Action([@Set($saved, true), @ToAssistant("Saved")]))`; a plain list of steps stays a plain array. An invalid step evaluates to an empty plan (a no-op) instead of null, and `Action([...])` flattens nested plans. Legacy `{ type, params }` action configs are unchanged.

  New `action()` helper (lang-core, re-exported by react-lang), like `reactive()`: it returns the action prop schema, already tagged `ActionExpression`, so libraries write `action: action().optional()` instead of calling `tagSchemaId(..., "ActionExpression")` themselves. react-ui's action props use it.

  Prompt change: for libraries with action props (`ActionExpression`), the system prompt teaches one step bare and several steps in `Action([...])`. The react-ui prompt examples, including the chat library examples, use step calls instead of legacy objects.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Stored messages and Cloud responses whose second content line starts mid-line, after a cut-off first attempt, read the second attempt, as before.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - `parseMessage` reads a content line that starts mid-line as a new content section, so a regenerated response wins over the cut-off one, also while streaming. react-lang and react-ui drop their own copies of this step, and a Cloud response keeps the second attempt's scripts.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI 1.0 review fixes:

  - lang-core: the built-in functions prompt no longer uses react-ui's `Col` in its `@Each` example, and names Query only when tool calls are on.
  - lang-core: `JSONSchemaDef` adds `type` and `anyOf`, so the CLI's spec for a library that uses `action()` passes to `generateSystemPrompt` without a cast.
  - react-ui: the chat prompt's button rules name `@ToAssistant` and `@OpenUrl`.
  - react-ui, a2ui, assistant-ui, devtools, react-email: the `@openuidev/react-lang` peer window now covers the version this release publishes.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - The chat components read and write stored messages with `parseMessage` and `buildMessage` from react-lang instead of their own marker parser. Stored bytes are unchanged, and older messages in the `<content>`/`<context>` XML envelope still read. A complete message whose content ends in `]` (or any other start of a marker) is no longer cut short, and `]]>openui:end` text in the middle of a line stays in the content.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - `@ToAssistant(message, context)` passes its context through unchanged as any value (object, array, number, string, including falsy ones). The `continue_conversation` step's `context` is now typed `unknown`, and react-lang forwards it in `params.context` whenever it is set. The react-ui chat adds it as the third element of the chat context, and card blocks append their item context to it as text, as before. The system prompt documents the context argument.
- Updated dependencies [[`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2)]:
  - @openuidev/react-lang@1.0.0
  - @openuidev/react-headless@0.18.0

## 0.17.1

### Patch Changes

- [#1343](https://github.com/thesysdev/openui/pull/1343) [`497681e`](https://github.com/thesysdev/openui/commit/497681eefecf7d61b863e98af7dec98555941cf8) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Widen the internal `react-lang` peer windows to include the 0.4.x line that the
  Renderer slots release (a minor bump of the lang family) publishes.
- Updated dependencies [[`f1f66c4`](https://github.com/thesysdev/openui/commit/f1f66c4266d6d76d73b94530b32653fecd1f6c01)]:
  - @openuidev/react-lang@0.4.0
  - @openuidev/react-headless@0.17.1

## 0.17.0

### Minor Changes

- [#1248](https://github.com/thesysdev/openui/pull/1248) [`301d668`](https://github.com/thesysdev/openui/commit/301d66856835a81211628212f11833fe56a57dd4) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - Charts are now drawn with D3 instead of Recharts. Every chart keeps its name and export (`AreaChart`, `AreaChartCondensed`, `BarChart`, `BarChartCondensed`, `HorizontalBarChart`, `LineChart`, `LineChartCondensed`, `PieChart`, `RadarChart`, `RadialChart`, `ScatterChart`, `SingleStackedBar`, the Mini charts and the scatter helpers) and takes the same `data` + `categoryKey` / `dataKey` shape; genui-lib's chart components and their props are unchanged. New charts: `HeatmapChart`, `FunnelChart`, `SegmentedBar` (the same component as `SingleStackedBar`), `CalendarHeatmap`, plus `StackedLegend` with `LegendStoreProvider`.

  Changes for direct users:

  - `theme` (named palettes) is gone; set colors with `customPalette` or the ThemeProvider's chart palettes (`defaultChartPalette`, `barChartPalette`, …).
  - `height` is the whole chart: the x-axis labels and legend fit inside it instead of being added below. Labels take at most half of it and truncate when they don't fit.
  - Renamed: bar `radius` → `barRadius`; SingleStackedBar `animated` → `isAnimationActive`.
  - Dropped: line and radar `strokeWidth`; HorizontalBarChart `showXAxis`; Pie and Radial `onMouseEnter` / `onMouseLeave`; scatter `shape`.
  - Legend and tooltip text is shown as given, no longer capitalized ("iOS" stays "iOS"; a lowercase data key shows lowercase).
  - `recharts` is no longer a dependency.

### Patch Changes

- [#1273](https://github.com/thesysdev/openui/pull/1273) [`d51a09c`](https://github.com/thesysdev/openui/commit/d51a09cd4ed9639f5e606a9c07faef352672a164) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - Scrolling `BarChart`, `AreaChart` and `LineChart` lay out long category lists faster: only a label that widens the categories is measured in full, so the layout stays cheap as a long chart streams in. Widened categories are sized to the exact label width.

- [#1269](https://github.com/thesysdev/openui/pull/1269) [`dd4f450`](https://github.com/thesysdev/openui/commit/dd4f45074ac50b59d78e2855bd203e0e0562c95b) Thanks [@i-subham23](https://github.com/i-subham23)! - Fixes to the D3 charts from QA:

  - Area and line charts with `variant="step"` step halfway between points, as the Recharts charts did, so the first and last values get a flat run too.
  - The scrolling `BarChart`, `AreaChart` and `LineChart` widen their categories so long x-axis labels show in full, and scroll further. A category grows to at most three times its usual width and at most half the chart; longer labels, and labels in the condensed charts, are truncated with the full text on hover.
  - The donut `PieChart` is a thin band in the slice colors over grey track wedges again, with slices 0.5° apart; `paddingAngle` sets the pie's gaps only.
  - `RadarChart` marks the hovered axis with a dot on each series. The dots glide between axes and fade in and out, like the line and area charts' hover dots.

- Updated dependencies []:
  - @openuidev/react-lang@0.3.1
  - @openuidev/react-headless@0.17.0

## 0.16.3

### Patch Changes

- [#1068](https://github.com/thesysdev/openui/pull/1068) [`a935fcd`](https://github.com/thesysdev/openui/commit/a935fcd56ea38eb45e13c2192a43b9e0e94ffd51) Thanks [@iambharathpadhu](https://github.com/iambharathpadhu)! - Prevent Enter from submitting either built-in composer while IME composition is active, including browsers that report the keyCode 229 fallback. Enter after composition finishes still submits, and Shift+Enter continues to insert a newline.
- Updated dependencies []:
  - @openuidev/react-headless@0.16.3

## 0.16.2

### Patch Changes

- [#1170](https://github.com/thesysdev/openui/pull/1170) [`6060bf5`](https://github.com/thesysdev/openui/commit/6060bf58e62cdd30d085c10b9f436959f901b164) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Add an `AgentInterface` turn-level tool timeline override, allowing applications
  to replace the default live tool-activity UI without rebuilding the thread.
- Updated dependencies []:
  - @openuidev/react-headless@0.16.2

## 0.16.1

### Patch Changes

- [#1186](https://github.com/thesysdev/openui/pull/1186) [`0227ad7`](https://github.com/thesysdev/openui/commit/0227ad77ed79a6292802960c69b61e6a75e0fcae) Thanks [@abhithesys](https://github.com/abhithesys)! - Widen the internal `react-headless`/`react-ui` peer windows to include the
  0.16.x line, fixing an install-time peer mismatch where these packages
  required a `react-headless`/`react-ui` version older than the one they ship
  against.
- Updated dependencies []:
  - @openuidev/react-headless@0.16.1

## 0.16.0

### Minor Changes

- [#1184](https://github.com/thesysdev/openui/pull/1184) [`5cde7c3`](https://github.com/thesysdev/openui/commit/5cde7c36ccd419570dd6b2653fc88dc4f6471964) Thanks [@abhithesys](https://github.com/abhithesys)! - Widen peer dependency ranges for `@openuidev/react-headless` and `@openuidev/react-ui` to allow `0.15.x` (`>=0.14.0 <0.16.0`).

### Patch Changes

- Updated dependencies []:
  - @openuidev/react-headless@0.16.0

## 0.15.0

### Minor Changes

- [#1182](https://github.com/thesysdev/openui/pull/1182) [`b4aa87c`](https://github.com/thesysdev/openui/commit/b4aa87cb2d0bc32434cec806658286a8744cd514) Thanks [@abhithesys](https://github.com/abhithesys)! - Add the new card and form components to `openuiLibrary` (the base, non-chat library), so they're available outside `AgentInterface` too: `InlineHeader`, `EditableTable`, `Chips`/`ChipItem`, `OptionCards`/`OptionCard`, `IconButton`, `EntityList`, `Text`/`BoldText`, `IconText`/`ImageText`/`ImageTextLarge`, `MetricIndicatorInline`/`MetricIndicatorWithStrikethrough`, and the `Snippet`/`Overview`/`Context`/`Composite`/`Visual` card blocks with their items.

  `FormControl` now accepts `Chips` and `OptionCards` inputs in both libraries, which let the chat library drop its `ChatForm`/`ChatFormControl` duplicates and register the base `Form`/`FormControl` directly.

  Fixes `IconButton`, which was registered but unreachable in the chat library (no union pointed at it) — it can now be placed as a `Card`/`Stack` child in both libraries.

- [#1173](https://github.com/thesysdev/openui/pull/1173) [`8e0d1c8`](https://github.com/thesysdev/openui/commit/8e0d1c81bdbbd24647cad61a98e345f2f0de40bd) Thanks [@abhithesys](https://github.com/abhithesys)! - Add new components to `openuiChatLibrary`.

  New chat components: `InlineHeader`, `EditableTable`, `Chips`/`ChipItem`, `OptionCards`/`OptionCard`, `Icon`, `IconButton`, `EntityList`, `Text`, `BoldText`, `IconText`, `ImageText`, `ImageTextLarge`, `MetricIndicatorInline`, `MetricIndicatorWithStrikethrough`, and the `Snippet`/`Overview`/`Context`/`Composite`/`Visual` card blocks with their items. Each ships as a react-ui primitive under `components/` plus a genui-lib wrapper.

  Citations: the chat `Card` accepts `sources`, renders a Sources strip, and `[n]` markers in `TextContent` become citation chips. New `TextContentWrapper`, `Citation`, `Sources`, `SourceFaviconImage`, `InlineMarkdownRenderer` and `TooltipWrapper` primitives.

  Card block clicks attach per-item context (`itemIndex`, `itemId`, `itemTitle`, ...) to the block action. Chat-only variants of `Form`, `FormControl`, `Tabs`, `Accordion`, `Carousel` and `SectionBlock` accept the new blocks as nested content.

  Prompt: chat examples and rules rewritten to cover cards, forms, citations and actions. The action prop schema now carries the `open_url` / `continue_conversation` / custom object contract in the generated JSON schema.

  Breaking: `Tag.icon` is now an `Icon` reference instead of a string. `TagBlock` gains `size`, `ListBlock` gains `size`, condensed charts gain `height`. Typography map gains `number/title` and `number/title-medium`; several components that referenced a non-existent `primary` font family now use `body`.

  Dependencies: adds `@tanstack/react-table` and `unist-util-visit`.

### Patch Changes

- Updated dependencies [[`bad6e49`](https://github.com/thesysdev/openui/commit/bad6e492b38bfb1da05e6e6976ae6a23244a4af0)]:
  - @openuidev/react-headless@0.15.0

## 0.14.0

### Minor Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - Adopt automated release management via changesets. `react-headless` and
  `react-ui` now version together as a fixed group; this release unifies them on
  a single version line.

### Patch Changes

- Updated dependencies [[`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503), [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/react-lang@0.3.0
  - @openuidev/react-headless@0.14.0
