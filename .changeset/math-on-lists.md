---
"@openuidev/lang-core": minor
---

`@Round`, `@Abs`, `@Floor` and `@Ceil` given a list now apply to each element (nested lists too, null elements stay null) instead of returning 0. Their prompt signatures read `number | number[]`.
