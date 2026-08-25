---
"@openuidev/assistant-ui": patch
"@openuidev/devtools": patch
"@openuidev/react-email": patch
---

Internal `@openuidev/*` peer dependencies now declare bounded
tested-compatibility ranges (e.g. `">=0.3.0 <0.4.0"`) instead of `workspace:`
ranges, so a mismatched pair is caught at install time instead of failing at
runtime.
