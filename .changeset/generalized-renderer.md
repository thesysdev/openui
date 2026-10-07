---
"@openuidev/lang-core": patch
"@openuidev/react-lang": minor
"@openuidev/a2ui": minor
"@openuidev/server": minor
---

Add composable Renderer slots for content, query loading, errors, and retry controls. Replace the `queryLoader` prop on `Renderer` and `A2UIRenderer` with `Renderer.QueryLoading` children.

Improve query loading and retry behavior, preserve successful data and mounted input state, and ignore obsolete query responses.
