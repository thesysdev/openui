# @openuidev/react-ui

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
