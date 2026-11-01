---
"@openuidev/server": minor
---

Add `OpenUIClient` for live dashboards. `openui.defineDashboard({ library, model, tools?, mcp?, promptOptions? })` takes your app's config once and returns `create({ userId, title, prompt })` and `edit({ userId, id, prompt })`, which resolve with `{ id, response }` as soon as the artifact has an id, plus `interpreter`, which runs that dashboard's data tools and generated scripts. Tools receive `(context, args, { signal })`. `mcp` takes an MCP client, or `{ client, include?, outputs?, connect? }`: its tools are listed on first use, offered read-only unless you pick them with `include`, and each call goes through `connect(context)` for per-user credentials. `openui.createFrontendToken({ userId })` mints the signed-in user's frontend token for your token endpoint. The config block is built with `generateSystemPrompt({ cloud: true })`.
