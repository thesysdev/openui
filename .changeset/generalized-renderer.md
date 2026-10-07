---
"@openuidev/lang-core": patch
"@openuidev/react-lang": minor
"@openuidev/a2ui": minor
"@openuidev/server": minor
---

Add optional Renderer slots for content, query loading, errors, and retry controls. Keep `queryLoader` supported on `Renderer` and `A2UIRenderer`. Loading and error/retry views render nothing unless supplied by the application.

Improve query loading and retry behavior, preserve successful data and mounted input state, and ignore obsolete query responses.
