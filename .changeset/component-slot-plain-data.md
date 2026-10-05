---
"@openuidev/lang-core": patch
---

Report data (an object, array, string, number or boolean) in a slot that only takes components as a `type-mismatch` and prune it, instead of passing it through to render as a blank component or stray text. Slots whose schema also allows data are unchanged.
