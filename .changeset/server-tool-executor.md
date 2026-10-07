---
"@openuidev/server": minor
---

Add provider-independent tool registration through `openUIClient.tools.create`, exposing generation definitions and an executor from one registry. Execute direct server tools or scripts from complete OpenUI responses using request-scoped context, cancellation, a total deadline, and bounded sandbox continuations without replaying tools after snapshot failures. Keep `openUIClient.tools.execute` for existing handler maps.
