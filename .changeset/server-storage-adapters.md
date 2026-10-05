---
"@openuidev/server": minor
---

Add native Responses, Vercel AI SDK UIMessage, and LangGraph SDK message persistence through client.conversations.appendMessages. Retain Completions as the OpenAI default and require format: "responses" for native Responses items. Preserve text/media and tool ordering, share cancellable append transport, and reject unsupported representations before writing.
