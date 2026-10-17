---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
---

Add a `validators` prop to `Renderer` for registering custom form validators, and pass a `{ fieldName, values }` context as the third argument to `ValidatorFn` so validators can implement cross-field rules.
