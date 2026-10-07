---
"@openuidev/lang-core": patch
"@openuidev/react-lang": minor
"@openuidev/a2ui": minor
"@openuidev/server": minor
---

Add optional Renderer slots for content, query loading, errors, and retry controls. Keep `queryLoader` supported on `Renderer` and `A2UIRenderer`. Loading and error/retry views render nothing unless supplied by the application.

Preserve the existing query lifecycle while waiting for generation to finish. Keep mounted input state through retries and refresh query results when generated scripts change.
