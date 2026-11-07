---
"@openuidev/lang-core": patch
---

Add `toMarkdown()`: converts a parsed OpenUI response (`ParseResult` or `ElementNode`) to Markdown, keeping text, headings, lists, tables, code blocks, chart data and form values while dropping layout and interactive-only components. Per-component renderers can be overridden with `options.components`.
