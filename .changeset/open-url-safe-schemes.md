---
"@openuidev/react-ui": patch
"@openuidev/assistant-ui": patch
"@openuidev/a2ui": patch
---

`@OpenUrl` actions now go through the same scheme check as every other URL sink: `javascript:`, `data:`, `vbscript:` and `file:` URLs are ignored instead of being passed to `window.open`, and tabs open with `noopener,noreferrer`.
