# @openuidev/react-headless

Headless React state and streaming primitives for OpenUI chat experiences. Bring your own UI; this package handles threads, messages, adapters, and message format conversion.

[![npm version](https://img.shields.io/npm/v/@openuidev/react-headless)](https://www.npmjs.com/package/@openuidev/react-headless)
[![monthly downloads](https://img.shields.io/npm/dm/@openuidev/react-headless)](https://www.npmjs.com/package/@openuidev/react-headless)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [Package docs](https://openui.com/docs/api-reference/react-headless) | [Chat docs](https://openui.com/docs/chat) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

```bash
npm install @openuidev/react-headless
# or
pnpm add @openuidev/react-headless
```

**Peer dependencies:** `react >=19.0.0`, `react-dom >=19.0.0`, `zustand ^4.5.5`

The Vercel AI SDK integration has one optional peer dependency:

```bash
npm install ai@^6
# or, on Node.js 22+ with ESM
npm install ai@^7
```

Both AI SDK 6 and 7 are supported. AI SDK 7 requires Node.js 22 or later and
is ESM-only.

## Overview

Use `@openuidev/react-headless` when you want OpenUI's chat behavior without OpenUI's visual components:

- **`ChatProvider`** manages threads, messages, and streaming state through a Zustand store.
- **Selector hooks** expose thread and thread-list state without coupling you to a layout.
- **Streaming adapters** parse SSE or SDK responses from OpenAI, Vercel AI SDK, AG-UI, or custom backends.
- **Message formats** convert between your API shape and OpenUI's internal AG-UI shape.

## Quick Start

### URL-based setup

The simplest configuration points to your API and lets the provider handle the requests and streaming automatically:

```tsx
import { agUIAdapter, ChatProvider, fetchLLM, restStorage } from "@openuidev/react-headless";

const llm = fetchLLM({ url: "/api/chat", streamAdapter: agUIAdapter() });
const storage = restStorage({ baseUrl: "/api/threads" });

function App() {
  return (
    <ChatProvider llm={llm} storage={storage}>
      <YourChatUI />
    </ChatProvider>
  );
}
```

### Custom functions

For full control, implement the `ChatLLM` interface instead:

```tsx
import { openAIAdapter, openAIMessageFormat, type ChatLLM } from "@openuidev/react-headless";

const llm: ChatLLM = {
  send: ({ threadId, messages, signal }) =>
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, messages: openAIMessageFormat.toApi(messages) }),
      signal,
    }),
  streamProtocol: openAIAdapter(),
};
```

## Hooks

### `useThread()`

Access the current thread's messages, send new messages, and check streaming state:

```tsx
import { useThread } from "@openuidev/react-headless";

function ChatMessages() {
  const { messages, isRunning, processMessage, cancelMessage } = useThread();

  const handleSend = (text: string) => {
    processMessage({ role: "user", content: text });
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      {isRunning && <button onClick={cancelMessage}>Stop</button>}
    </div>
  );
}
```

**Returns:** `ThreadState & ThreadActions`

| Field | Type | Description |
| :--- | :--- | :--- |
| `messages` | `Message[]` | Messages in the current thread |
| `isRunning` | `boolean` | Whether the model is currently streaming |
| `isLoadingMessages` | `boolean` | Whether messages are being fetched |
| `threadError` | `Error \| null` | Error from the last operation |
| `processMessage(msg)` | `(msg) => Promise<void>` | Send a message and stream the response |
| `cancelMessage()` | `() => void` | Abort the current stream |
| `appendMessages(...msgs)` | `(...msgs) => void` | Append messages locally |
| `updateMessage(msg)` | `(msg) => void` | Update a message in place |
| `deleteMessage(id)` | `(id) => void` | Remove a message |
| `setMessages(msgs)` | `(msgs) => void` | Replace all messages |

### `useThreadList()`

Manage multiple conversation threads:

```tsx
import { useThreadList } from "@openuidev/react-headless";

function ThreadSidebar() {
  const { threads, selectedThreadId, selectThread, switchToNewThread, deleteThread } =
    useThreadList();

  return (
    <nav>
      <button onClick={switchToNewThread}>New Chat</button>
      {threads.map((t) => (
        <div key={t.id} onClick={() => selectThread(t.id)}>
          {t.title}
          <button onClick={() => deleteThread(t.id)}>Delete</button>
        </div>
      ))}
    </nav>
  );
}
```

**Returns:** `ThreadListState & ThreadListActions`

| Field | Type | Description |
| :--- | :--- | :--- |
| `threads` | `Thread[]` | All loaded threads |
| `selectedThreadId` | `string \| null` | Currently selected thread |
| `isLoadingThreads` | `boolean` | Whether the thread list is loading |
| `hasMoreThreads` | `boolean` | Whether more threads can be loaded |
| `loadThreads()` | `() => void` | Fetch the thread list |
| `loadMoreThreads()` | `() => void` | Load the next page of threads |
| `selectThread(id)` | `(id) => void` | Select a thread |
| `switchToNewThread()` | `() => void` | Deselect and start a new conversation |
| `createThread(msg)` | `(msg) => Promise<Thread>` | Create a thread with a first message |
| `updateThread(thread)` | `(thread) => void` | Update thread metadata |
| `deleteThread(id)` | `(id) => void` | Delete a thread |

### `useMessage()`

Access the current message inside a message component:

```tsx
import { useMessage } from "@openuidev/react-headless";

function MessageBubble() {
  const { message } = useMessage();
  return <div className="bubble">{message.content}</div>;
}
```

## Streaming Adapters

Adapters transform HTTP responses into the internal event stream. They are factories — call one and pass the result to `fetchLLM` via `streamAdapter`:

```tsx
import { fetchLLM, openAIAdapter } from "@openuidev/react-headless";

const llm = fetchLLM({ url: "/api/chat", streamAdapter: openAIAdapter() });
```

| Adapter | Description |
| :--- | :--- |
| `agUIAdapter()` | Parses AG-UI SSE events (`data: {json}\n`) |
| `openAIAdapter()` | Parses OpenAI Chat Completions streaming (`ChatCompletionChunk`) |
| `openAIResponsesAdapter()` | Parses OpenAI Responses API streaming (`ResponseStreamEvent`) |
| `openAIReadableStreamAdapter()` | Parses OpenAI SDK's `Stream.toReadableStream()` NDJSON output |
| `vercelAIAdapter()` | Parses Vercel AI SDK v6 and v7 UIMessage streams |

For a Vercel AI SDK route, use its stream adapter and message format together:

```tsx
import { fetchLLM, vercelAIAdapter, vercelAIMessageFormat } from "@openuidev/react-headless";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: vercelAIAdapter(),
  messageFormat: vercelAIMessageFormat,
});
```

This integration supports app-executed tools. Provider-executed tools
(`providerExecuted: true`, such as provider-hosted built-ins) throw an error because
the AG-UI message model cannot preserve their assistant-contained result semantics.

### Custom adapter

Implement the `StreamProtocolAdapter` interface:

```ts
import type { StreamProtocolAdapter, AGUIEvent } from "@openuidev/react-headless";

const myAdapter: StreamProtocolAdapter = {
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    // parse the response stream and yield AGUIEvent objects
  },
};
```

## Message Formats

Message formats convert between your API's message shape and the internal AG-UI format. Pass one to `fetchLLM` via the `messageFormat` option:

```tsx
import { fetchLLM, openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIAdapter(),
  messageFormat: openAIMessageFormat,
});
```

| Format | Description |
| :--- | :--- |
| `identityMessageFormat` | Default format when messages are already AG-UI shaped |
| `openAIMessageFormat` | Converts to/from OpenAI `ChatCompletionMessageParam[]` |
| `openAIConversationMessageFormat` | Converts to/from OpenAI Responses API `ResponseInputItem[]` |
| `vercelAIMessageFormat` | Converts to/from Vercel AI SDK v6 and v7 `UIMessage[]` |

### Custom format

Implement the `MessageFormat` interface:

```ts
import type { MessageFormat } from "@openuidev/react-headless";

const myFormat: MessageFormat = {
  toApi: (messages) => messages.map(convertToMyFormat),
  fromApi: (data) => data as Message[],
};
```

## Types

```ts
import type {
  ChatProviderProps,
  ChatStore,
  Thread,
  ThreadState,
  ThreadActions,
  ThreadListState,
  ThreadListActions,
  CreateMessage,
  Message,
  UserMessage,
  AssistantMessage,
  SystemMessage,
  ToolMessage,
  ToolCall,
  FunctionCall,
  MessageFormat,
  StreamProtocolAdapter,
  AGUIEvent,
  EventType,
} from "@openuidev/react-headless";
```

## Documentation

- [React Headless API reference](https://openui.com/docs/api-reference/react-headless)
- [Chat guides](https://openui.com/docs/chat)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/react-headless)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
