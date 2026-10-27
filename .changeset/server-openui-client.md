---
"@openuidev/server": patch
---

Add `OpenUIClient` for creating and editing artifacts (`openui.artifacts.createLive`, `createStatic`, `createSlides`, `createReport`, `edit`), and `createInterpreter` for running an artifact's data tools on your server. Tools receive `(context, args, { signal })`, and the interpreter accepts requests by artifact `id` or saved content.
