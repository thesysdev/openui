---
"@openuidev/lang-core": patch
---

`excess-args` is reported with `severity: "warning"` when every dropped argument is the literal `null`, because the element still renders in full and nothing the model wrote is lost. When a dropped argument has a value, it stays an error, so hosts and autofix loops can tell the two cases apart from the severity alone.
