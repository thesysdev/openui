---
"@openuidev/react-ui": minor
---

Add new components to `openuiChatLibrary`.

New chat components: `InlineHeader`, `EditableTable`, `Chips`/`ChipItem`, `OptionCards`/`OptionCard`, `Icon`, `IconButton`, `EntityList`, `Text`, `BoldText`, `IconText`, `ImageText`, `ImageTextLarge`, `MetricIndicatorInline`, `MetricIndicatorWithStrikethrough`, and the `Snippet`/`Overview`/`Context`/`Composite`/`Visual` card blocks with their items. Each ships as a react-ui primitive under `components/` plus a genui-lib wrapper.

Citations: the chat `Card` accepts `sources`, renders a Sources strip, and `[n]` markers in `TextContent` become citation chips. New `TextContentWrapper`, `Citation`, `Sources`, `SourceFaviconImage`, `InlineMarkdownRenderer` and `TooltipWrapper` primitives.

Card block clicks attach per-item context (`itemIndex`, `itemId`, `itemTitle`, ...) to the block action. Chat-only variants of `Form`, `FormControl`, `Tabs`, `Accordion`, `Carousel` and `SectionBlock` accept the new blocks as nested content.

Prompt: chat examples and rules rewritten to cover cards, forms, citations and actions. The action prop schema now carries the `open_url` / `continue_conversation` / custom object contract in the generated JSON schema.

Breaking: `Tag.icon` is now an `Icon` reference instead of a string. `TagBlock` gains `size`, `ListBlock` gains `size`, condensed charts gain `height`. Typography map gains `number/title` and `number/title-medium`; several components that referenced a non-existent `primary` font family now use `body`.

Dependencies: adds `@tanstack/react-table` and `unist-util-visit`.
