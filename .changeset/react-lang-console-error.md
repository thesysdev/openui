---
"@openuidev/react-lang": patch
---

When `Renderer` has no `onError`, its errors are now logged as a single `console.error` that lists every error and links to https://www.openui.com/docs/openui-lang/reliability, instead of one `console.warn` per error.
