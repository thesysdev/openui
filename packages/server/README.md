# `@openuidev/server`

Server utilities for OpenUI & OpenUI Gateway.

```bash
npm install @openuidev/server
```

Persist a Chat Completions turn as Conversations API items:

```ts
import { storeChatCompletionHistory } from "@openuidev/server";

await storeChatCompletionHistory({
  apiKey: process.env.THESYS_API_KEY!,
  conversationId: threadId,
  messages: [lastUserMessage, { role: "assistant", content: assistantContent }],
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
