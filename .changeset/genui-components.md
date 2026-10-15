---
"@openuidev/react-ui": minor
---

Rework the generative UI component library and its system prompt. New components: Section, Grid, Shell, Bleed, Heading, Metric, Avatar, AvatarStack, Emoji, Shape, Link, LeadingText, EntityTitle, ImageTitle, EntityListItem, Checklist, Timeline, InsightCard, ValueCard, ImageCard, ValueLayout and FormRow, plus a Sparkline chart. `TextContent` becomes `Text` and `MarkDownRenderer` becomes `Markdown` (with `==highlight==` and favicon links). `ContextCardBlock` and `SnippetCardBlock` are removed; `IconText` becomes the archived `IconTitle`, and CardHeader, InlineHeader, Label, BoldText, TextCallout, MetricIndicator, ImageBlock, ImageText, OverviewCardBlock and VisualCardBlock move to `openuiArchivedComponents`, out of the model-facing libraries. Cards, Callout, Tag, Chips, OptionCards, Table, EditableTable (now `EditableCol`), form fields, Calendar, Modal, Carousel, ImageGallery and lists are restyled, and the theme adds a Bold `wght` axis token.
