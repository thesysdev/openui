---
"@openuidev/a2ui": patch
---

Reject `__proto__`, `constructor` and `prototype` segments in `updateDataModel` JSON Pointer paths and bound array indexes to the array length, so a data-model update can no longer write to `Object.prototype` or create huge sparse arrays.
