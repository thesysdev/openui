---
"@openuidev/server": minor
---

Add `openui.conversations` to manage conversations and their items with the API key: `list`, `create`, `get`, `update`, `delete`, and `items.list` / `create` / `get` / `update`. `create` names the owner with `userId` (and the client's `appId`), so the user's frontend token can read the conversation, and `list` takes `userId` to list only theirs. Calls by id act as your org: check a conversation's `userId` before trusting an id from the browser.

Add `openui.chat.conversations` and `openui.langgraph.conversations`: the same calls, with items in your SDK's messages. `items.create` takes Chat Completions or LangChain messages, and `items.list` reads the whole thread back as them. The conversions are exported as `chatCompletionsConverter` and `langGraphConverter`, with `toItems` and `fromItems`.

Deprecate `storeChatCompletionHistory`, `chatCompletionMessagesToItems`, `storeLangGraphHistory` and `langGraphMessagesToItems` in favour of those. They still work; `storeChatCompletionHistory` and `storeLangGraphHistory` now throw `OpenUIApiError` (with `code` and `status`) instead of a plain `Error`, and `@openuidev/server/langgraph` no longer loads `@langchain/core` at runtime.
