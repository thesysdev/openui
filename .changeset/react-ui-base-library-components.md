---
"@openuidev/react-ui": minor
---

Add the new card and form components to `openuiLibrary` (the base, non-chat library), so they're available outside `AgentInterface` too: `InlineHeader`, `EditableTable`, `Chips`/`ChipItem`, `OptionCards`/`OptionCard`, `IconButton`, `EntityList`, `Text`/`BoldText`, `IconText`/`ImageText`/`ImageTextLarge`, `MetricIndicatorInline`/`MetricIndicatorWithStrikethrough`, and the `Snippet`/`Overview`/`Context`/`Composite`/`Visual` card blocks with their items.

`FormControl` now accepts `Chips` and `OptionCards` inputs in both libraries, which let the chat library drop its `ChatForm`/`ChatFormControl` duplicates and register the base `Form`/`FormControl` directly.

Fixes `IconButton`, which was registered but unreachable in the chat library (no union pointed at it) — it can now be placed as a `Card`/`Stack` child in both libraries.
