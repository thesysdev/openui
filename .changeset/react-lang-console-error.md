---
"@openuidev/react-lang": patch
---

`Renderer` now logs every reported error with `console.error` (`[openui] <source>/<code>: <message>`) before calling `onError`. Previously errors were only logged, as `console.warn`, when no `onError` was passed.
