---
"@openuidev/lang-core": patch
"@openuidev/react-lang": minor
"@openuidev/a2ui": minor
"@openuidev/server": minor
---

Add optional Renderer slots for content, query loading, errors, and retry controls. Preserve the default rendering behavior and the fully supported `queryLoader` prop on `Renderer` and `A2UIRenderer`.

Improve query loading and retry behavior, preserve successful data and mounted input state, and ignore obsolete query responses.
