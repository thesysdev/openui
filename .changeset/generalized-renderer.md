---
"@openuidev/lang-core": patch
"@openuidev/react-lang": minor
"@openuidev/a2ui": minor
---

Add MiniApp generation and rendering support. Cloud `generateSystemPrompt` accepts script tool definitions, a complete `baseResponse` for editing, and optional `meta.name`, with exported types for both built-in and custom libraries.

Render complete OpenUI response bundles with `Renderer`, or use `WithPreviewRenderer` for metadata-aware previews and expandable content with application-controlled presentation. Compose content, query loading, errors, and retry controls through Renderer slots. Replace the `queryLoader` prop on `Renderer` and `A2UIRenderer` with `Renderer.QueryLoading` children.

Preserve successful query data and mounted input state during streaming edits and retries. Keep static layout visible while unresolved widgets show placeholders, and display retryable query failures instead of treating defaults or cached values as current results. Track loading against the selected cache entry, ignore obsolete responses, pause tool execution during generation, and refresh query results when completed scripts change.
