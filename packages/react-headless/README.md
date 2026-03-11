# @openuidev/react-headless

Headless React primitives for [OpenUI](https://openui.com) — chat state management, streaming adapters, and message format converters. Build any chat UI while OpenUI handles the streaming, threading, and state.

[![npm](https://img.shields.io/npm/v/@openuidev/react-headless)](https://www.npmjs.com/package/@openuidev/react-headless)
[![npm downloads](https://img.shields.io/npm/dm/@openuidev/react-headless)](https://www.npmjs.com/package/@openuidev/react-headless)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

## Install

```bash
npm install @openuidev/react-headless
# or
pnpm add @openuidev/react-headless
```

**Peer dependencies:** `react >=19.0.0`, `react-dom >=19.0.0`, `zustand ^4.5.5`

## Overview

`@openuidev/react-headless` gives you everything needed to build a chat experience without imposing any UI. It provides:

- **`ChatProvider`** — A React context provider that manages threads, messages, and streaming state via a Zustand store.
- **Selector hooks** — `useThread()` and `useThreadList()` to read and interact with chat state.
- **Streaming adapters** — Parse SSE or SDK responses from OpenAI, AG-UI, or custom backends.
- **Message formats** — Convert between your API's message format and the internal AG-UI format.

## Quick Start

### URL-based setup

The simplest configuration — point to your API and the provider handles REST calls and streaming automatically:

```tsx
import { ChatProvider } from "@openuidev/react-headless";

function App() {
  return (
    <ChatProvider
      apiUrl="/api/chat"
      threadApiUrl="/api/threads"
    >
      <YourChatUI />
    </ChatProvider>
  );
}
```

### Custom functions

For full control, provide your own functions instead of URLs:

```tsx
<ChatProvider
  processMessage={async ({ threadId, messages, abortController }) => {
    return fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ threadId, messages }),
      signal: abortController.signal,
    });
  }}
  fetchThreadList={async () => {
    const res = await fetch("/api/threads");
    return res.json();
  }}
  createThread={async (firstMessage) => {
    const res = await fetch("/api/threads", {
      method: "POST",
      body: JSON.stringify({ message: firstMessage }),
    });
    return res.json();
  }}
>
  <YourChatUI />
</ChatProvider>
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

Adapters transform HTTP responses into the internal event stream. Pass one to `ChatProvider` via `streamProtocol`:

```tsx
import { ChatProvider, openAIAdapter } from "@openuidev/react-headless";

<ChatProvider apiUrl="/api/chat" streamProtocol={openAIAdapter}>
  {children}
</ChatProvider>
```

| Adapter | Description |
| :--- | :--- |
| `agUIAdapter` | Default — parses AG-UI SSE events (`data: {json}\n`) |
| `openAIAdapter` | Parses OpenAI Chat Completions streaming (`ChatCompletionChunk`) |
| `openAIResponsesAdapter` | Parses OpenAI Responses API streaming (`ResponseStreamEvent`) |
| `openAIReadableStreamAdapter` | Parses OpenAI SDK's `Stream.toReadableStream()` NDJSON output |

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

Message formats convert between your API's message shape and the internal AG-UI format. Pass one to `ChatProvider` via `messageFormat`:

```tsx
import { ChatProvider, openAIMessageFormat } from "@openuidev/react-headless";

<ChatProvider apiUrl="/api/chat" messageFormat={openAIMessageFormat}>
  {children}
</ChatProvider>
```

| Format | Description |
| :--- | :--- |
| `identityMessageFormat` | Default — no conversion (messages are already AG-UI format) |
| `openAIMessageFormat` | Converts to/from OpenAI `ChatCompletionMessageParam[]` |
| `openAIConversationMessageFormat` | Converts to/from OpenAI Responses API `ResponseInputItem[]` |

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

Full documentation and guides are available at **[openui.com](https://openui.com)**.

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
