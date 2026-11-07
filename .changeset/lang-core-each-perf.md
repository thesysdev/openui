---
"@openuidev/lang-core": patch
---

Speed up `@Each` evaluation: a loop variable field access such as `r.name` now converts only that field instead of the whole row.
