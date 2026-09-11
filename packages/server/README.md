# `@openuidev/server`

Server utilities for OpenUI & OpenUI Gateway.

```bash
npm install @openuidev/server
```

Persist a Chat Completions turn as Conversations API items. Chat Completions has no `conversation` + `store: true`. Use the master API key (Cloud rejects frontend tokens on create). Pass only the new turn — last user message plus the assembled assistant reply — not the client’s full `messages` array.

```ts
import { storeChatCompletionHistory } from "@openuidev/server";

await storeChatCompletionHistory({
  apiKey: process.env.THESYS_API_KEY!,
  conversationId: threadId,
  messages: [
    { role: "user", content: lastUserText },
    { role: "assistant", content: assistantText },
  ],
});
```

Convert without posting:

```ts
import { chatCompletionMessagesToItems } from "@openuidev/server";

chatCompletionMessagesToItems([
  { role: "user", content: "hello" },
  { role: "assistant", content: "hi" },
]);
```
