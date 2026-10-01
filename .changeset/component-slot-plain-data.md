---
"@openuidev/lang-core": patch
---

Report a plain object in a component slot as a `type-mismatch` and prune it, instead of passing it through to render as a blank component. Strings, numbers and booleans in component slots are unchanged.
