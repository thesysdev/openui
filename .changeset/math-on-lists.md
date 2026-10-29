---
"@openuidev/lang-core": minor
---

`@Round`, `@Abs`, `@Floor` and `@Ceil` given a list now apply to each element (nested lists too, null counts as 0) instead of returning 0. Their prompt signatures read `number | number[]`.
