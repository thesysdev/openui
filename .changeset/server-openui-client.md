---
"@openuidev/server": minor
---

Add `OpenUIClient` for artifacts. `openui.defineArtifactTool({ kind, library, model, tools?, promptOptions? })` takes your app's config once and returns `create({ userId, title, prompt })` and `edit({ userId, id, prompt })`, each with an optional `{ signal }` as a second argument; `kind` is `"live"` (with your data tools) or `"static"`. `openui.createInterpreter({ tools })` runs an artifact's data tools on your server with the same client, and `openui.createFrontendToken({ userId })` mints the signed-in user's frontend token for your token endpoint to return to the browser. Tools receive `(context, args, { signal })`, and the interpreter runs generated scripts by artifact `id`. Artifacts send your library, data tools and `promptOptions` as OpenUI Cloud's config block, built with `generateSystemPrompt({ cloud: true })`. `mcpTools(client)` turns an MCP server's tools into data tools, calling each through `connect(context)` for per-user credentials.
