---
"@openuidev/server": minor
---

Add `OpenUIClient` for creating and editing artifacts (`openui.artifacts.createLive`, `createStatic`, `editLive`, `editStatic`; each takes a required `model`, as `provider/model`, and an optional `{ signal }` as a second argument), `openui.createInterpreter({ tools })` for running an artifact's data tools on your server with the same client, and `openui.createFrontendToken({ userId })`, which mints the signed-in user's frontend token for your token endpoint to return to the browser. Tools receive `(context, args, { signal })`, and the interpreter accepts requests by artifact `id` or saved content. Live and static artifacts send your library, data tools and `promptOptions` as OpenUI Cloud's config block, built with `generateSystemPrompt({ cloud: true })`. `mcpTools(client)` turns an MCP server's tools into data tools, calling each through `connect(context)` for per-user credentials.
