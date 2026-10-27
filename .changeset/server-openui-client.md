---
"@openuidev/server": patch
---

Add `OpenUIClient` for creating and editing artifacts (`openui.artifacts.createLive`, `createStatic`, `createSlides`, `createReport`, `edit`), and `createInterpreter` for running an artifact's data tools on your server. Tools receive `(context, args, { signal })`, and the interpreter accepts requests by artifact `id` or saved content. Live and static artifacts send your library, data tools and `promptOptions` as OpenUI Cloud's config block, built with `generateSystemPrompt({ cloud: true })`. `mcpTools(client)` turns an MCP server's tools into data tools, calling each through `connect(context)` for per-user credentials.
