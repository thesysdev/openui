---
"@openuidev/server": minor
---

Add `openui.conversations` to manage conversations and their items with the API key: `list`, `create`, `get`, `update`, `delete`, and `items.list` / `create` / `get` / `update`. Pass `userId` to act as that user, as with `openui.artifacts`; `create` always needs one, so the user's frontend token can read the conversation.

Add `openui.chat.conversations` and `openui.langgraph.conversations`: the same calls, with items in your SDK's messages. `items.create` takes Chat Completions or LangChain messages, and `items.list` reads the whole thread back as them.

Deprecate `storeChatCompletionHistory`, `chatCompletionMessagesToItems`, `storeLangGraphHistory` and `langGraphMessagesToItems` in favour of those. They still work; `storeChatCompletionHistory` and `storeLangGraphHistory` now throw `OpenUIApiError` (with `code` and `status`) instead of a plain `Error`, and `@openuidev/server/langgraph` no longer loads `@langchain/core` at runtime.
