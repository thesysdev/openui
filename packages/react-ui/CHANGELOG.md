# @openuidev/react-ui

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
