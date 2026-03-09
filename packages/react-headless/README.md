# @openuidev/react-headless

Headless React primitives, streaming adapters, and state management for OpenUI.

<<<<<<< nit/react-headless
## Table of Contents

- [@openuidev/react-headless](#openuidevreact-headless)
  - [Table of Contents](#table-of-contents)
  - [Architecture Overview](#architecture-overview)
  - [Installation](#installation)
    - [Peer dependencies](#peer-dependencies)
  - [Quick Start](#quick-start)
    - [Minimal setup (URL-based)](#minimal-setup-url-based)
    - [Custom backend functions](#custom-backend-functions)
  - [Core Concepts](#core-concepts)
    - [ChatProvider](#chatprovider)
    - [Hooks](#hooks)
    - [Streaming](#streaming)
    - [Message Formats](#message-formats)
    - [Stream Protocol Adapters](#stream-protocol-adapters)
  - [Module Breakdown](#module-breakdown)
    - [`v2/` — Zustand Store \& Provider](#v2--zustand-store--provider)
      - [Store Internals](#store-internals)
    - [`stream/` — Streaming Engine](#stream--streaming-engine)
    - [`types/` — Type Definitions](#types--type-definitions)
    - [`hooks/` — Message Context](#hooks--message-context)
  - [API Reference](#api-reference)
    - [ChatProviderProps](#chatproviderprops)
      - [Thread API (choose one):](#thread-api-choose-one)
      - [Chat API (choose one):](#chat-api-choose-one)
      - [Optional:](#optional)
    - [useThread](#usethread)
    - [useThreadList](#usethreadlist)
    - [useMessage](#usemessage)
    - [processStreamedMessage](#processstreamedmessage)
    - [Stream Adapters](#stream-adapters)
    - [Message Format Converters](#message-format-converters)
  - [Type Reference](#type-reference)
    - [Message Types (from `@ag-ui/core`)](#message-types-from-ag-uicore)
    - [Store Types](#store-types)
    - [Adapter Types](#adapter-types)
  - [How It All Fits Together](#how-it-all-fits-together)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      <ChatProvider>                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Zustand Store (ChatStore)                  │  │
│  │                                                        │  │
│  │  ┌─────────────────┐    ┌───────────────────────────┐  │  │
│  │  │ ThreadListSlice  │    │     ThreadSlice            │  │  │
│  │  │                 │    │                           │  │  │
│  │  │ • threads[]     │    │ • messages[]              │  │  │
│  │  │ • selectedId    │    │ • isRunning               │  │  │
│  │  │ • loadThreads() │    │ • processMessage()        │  │  │
│  │  │ • createThread()│    │ • cancelMessage()         │  │  │
│  │  │ • deleteThread()│    │ • appendMessages()        │  │  │
│  │  │ • selectThread()│    │ • updateMessage()         │  │  │
│  │  │ • ...           │    │ • ...                     │  │  │
│  │  └─────────────────┘    └───────────┬───────────────┘  │  │
│  │                                     │                  │  │
│  └─────────────────────────────────────┼──────────────────┘  │
│                                        │                     │
│                           processMessage() calls:            │
│                                        │                     │
│  ┌─────────────────────────────────────▼──────────────────┐  │
│  │            Streaming Pipeline                          │  │
│  │                                                        │  │
│  │  fetch(apiUrl)  ──►  StreamProtocolAdapter.parse()     │  │
│  │                           │                            │  │
│  │                   AG-UI Events (SSE)                   │  │
│  │                           │                            │  │
│  │                processStreamedMessage()                │  │
│  │                    │         │         │                │  │
│  │             createMsg  updateMsg  deleteMsg             │  │
│  │                    └─────────┴─────────┘                │  │
│  │                           │                            │  │
│  │                   Zustand set(messages)                 │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Hooks:  useThread()  ·  useThreadList()  ·  useMessage()    │
└──────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
pnpm add @openuidev/react-headless
```

### Peer dependencies

```bash
pnpm add react react-dom zustand eventsource-parser tiny-invariant
```

---

## Quick Start

### Minimal setup (URL-based)

```tsx
import { ChatProvider, useThread, useThreadList } from "@openuidev/react-headless";

function App() {
  return (
    <ChatProvider apiUrl="/api/chat" threadApiUrl="/api/threads">
      <ChatUI />
    </ChatProvider>
  );
}

function ChatUI() {
  const { messages, processMessage, isRunning } = useThread();
  const { threads, selectThread, loadThreads } = useThreadList();

  // ... render your chat UI
}
```

### Custom backend functions

```tsx
<ChatProvider
  processMessage={async ({ threadId, messages, abortController }) => {
    return fetch("/my/custom/endpoint", {
      method: "POST",
      body: JSON.stringify({ threadId, messages }),
      signal: abortController.signal,
    });
  }}
  fetchThreadList={async () => {
    const res = await fetch("/my/threads");
    return res.json(); // { threads: Thread[], nextCursor?: any }
  }}
  createThread={async (firstMessage) => {
    const res = await fetch("/my/threads", {
      method: "POST",
      body: JSON.stringify({ message: firstMessage }),
    });
    return res.json(); // Thread
  }}
>
  <ChatUI />
</ChatProvider>
```

---

## Core Concepts

### ChatProvider

The `<ChatProvider>` is the top-level React component that creates and owns the Zustand store. It accepts configuration for how to communicate with your backend (either URL strings for convention-based REST endpoints, or custom async functions) and makes the store available to all descendant components via React context.

The store is created once on mount via `useState(() => createChatStore(config))`, so config changes after mount are not picked up.

### Hooks

The package exposes two primary hooks that select specific slices from the unified store:

- **`useThread()`** — Returns the current thread's messages, loading/running state, and actions to send/edit/delete messages.
- **`useThreadList()`** — Returns the list of threads, selection state, and actions to create/select/delete/update threads.

Both hooks use Zustand's `useShallow` for automatic shallow-equality memoization, preventing unnecessary re-renders. They also support an optional selector function for fine-grained subscriptions:

```tsx
// Only re-renders when messages change
const messages = useThread((s) => s.messages);

// Only re-renders when thread count changes
const count = useThreadList((s) => s.threads.length);
```

### Streaming

When `processMessage()` is called, the following pipeline executes:

1. An **optimistic user message** is appended to the store immediately.
2. If no thread is selected, one is created automatically (via `createThread` or `threadApiUrl`), or an `"ephemeral"` ID is used.
3. The message is sent to the backend via `fetch(apiUrl, ...)` or the custom `processMessage` function.
4. The response is piped through a **StreamProtocolAdapter** (default: AG-UI SSE format) which yields `AGUIEvent` objects.
5. **`processStreamedMessage()`** consumes these events and translates them into `createMessage`, `updateMessage`, and `deleteMessage` calls that update the Zustand store in real-time.

Supported event types:

- `TEXT_MESSAGE_START` — New assistant message begins
- `TEXT_MESSAGE_CONTENT` — Text delta appended to the current message
- `TEXT_MESSAGE_END` — Message streaming complete
- `TOOL_CALL_START` — A tool/function call begins
- `TOOL_CALL_ARGS` — Argument delta for a tool call
- `TOOL_CALL_END` — Tool call streaming complete
- `RUN_ERROR` — Error during the stream

### Message Formats

A `MessageFormat` is a bidirectional converter between the internal AG-UI message format and whatever format your backend expects. It has two methods:

- `toApi(messages)` — Converts outgoing messages (sent to your backend)
- `fromApi(data)` — Converts incoming messages (loaded from your backend/storage)

Built-in formats:
| Format | Use Case |
|--------|----------|
| `identityMessageFormat` | No conversion (default). Backend uses AG-UI format directly. |
| `openAIMessageFormat` | OpenAI Chat Completions API (`ChatCompletionMessageParam[]`) |
| `openAIConversationMessageFormat` | OpenAI Responses/Conversations API (`ResponseInputItem[]`) |

### Stream Protocol Adapters

A `StreamProtocolAdapter` parses a `Response` body into an `AsyncIterable<AGUIEvent>`. This decouples the streaming protocol from the business logic.

Built-in adapters:
| Adapter | Protocol |
|---------|----------|
| `agUIAdapter()` | AG-UI SSE format (default). Lines are `data: {JSON}\n` with `[DONE]` sentinel. |
| `openAIAdapter()` | OpenAI Chat Completions streaming format (`ChatCompletionChunk`). |
| `openAIResponsesAdapter()` | OpenAI Responses API streaming format (`ResponseStreamEvent`). |
| `openAIReadableStreamAdapter()` | OpenAI SDK's `Stream.toReadableStream()` NDJSON format (no SSE prefix). |

---

## Module Breakdown

### `v2/` — Zustand Store & Provider

This is the heart of the package. The "v2" designation indicates it's the current API, replacing an earlier hook-based approach.

| File                 | Purpose                                                                                                                                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createChatStore.ts` | Factory function that creates the unified Zustand store. Accepts config (URLs or custom functions) and returns a fully wired store with all thread list and thread actions. Contains default implementations for REST operations when `threadApiUrl` is provided. |
| `ChatProvider.tsx`   | React component that wraps `createChatStore` in a context provider. Creates the store once on mount.                                                                                                                                                              |
| `ChatContext.ts`     | React context definition + `useChatStore()` hook that retrieves the raw Zustand `StoreApi`. Throws if used outside `<ChatProvider>`.                                                                                                                              |
| `hooks.ts`           | `useThread()` and `useThreadList()` — typed selector hooks that project the unified store into focused slices. Uses `useShallow` for memoization.                                                                                                                 |
| `types.ts`           | All TypeScript types for the v2 API: `Thread`, `ThreadState`, `ThreadActions`, `ThreadListState`, `ThreadListActions`, `ChatStore`, `ChatProviderProps`. Also defines the discriminated union config types (`ThreadApiConfig`, `ChatApiConfig`).                  |

#### Store Internals

The store is a single flat Zustand store combining two logical slices:

**ThreadListSlice** manages the sidebar/thread list:

- `threads: Thread[]` — sorted by `createdAt` descending
- `isLoadingThreads` / `threadListError` / `hasMoreThreads` — loading state
- `selectedThreadId` — the active thread
- `_nextCursor` — internal pagination cursor
- Actions: `loadThreads`, `loadMoreThreads`, `switchToNewThread`, `createThread`, `selectThread`, `updateThread`, `deleteThread`

**ThreadSlice** manages the active conversation:

- `messages: Message[]` — the current thread's messages
- `isRunning` — whether a stream is in progress
- `isLoadingMessages` / `threadError` — loading state
- `_abortController` — internal abort controller for cancellation
- Actions: `processMessage`, `appendMessages`, `updateMessage`, `setMessages`, `deleteMessage`, `cancelMessage`

Key behaviors:

- **Optimistic updates**: `processMessage` appends the user message instantly before the network call.
- **Auto thread creation**: If no thread is selected when sending a message, the store auto-creates one (or uses `"ephemeral"` if no create function is configured).
- **Abort on switch**: `selectThread` and `switchToNewThread` cancel any in-flight stream via `AbortController`.
- **Deduplication**: `mergeThreadList` uses a `Map` keyed by `threadId` to merge paginated results without duplicates.
- **Pending state**: `deleteThread` and `updateThread` set `isPending: true` on the thread while the operation is in flight.

### `stream/` — Streaming Engine

| File                                             | Purpose                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `processStreamedMessage.ts`                      | Core function that consumes an `AsyncIterable<AGUIEvent>` (from an adapter) and translates events into message CRUD operations. Manages a running `currentMessage` that accumulates text deltas and tool calls.                                                                                   |
| `adapters/ag-ui.ts`                              | Default adapter. Parses SSE lines (`data: {...}\n`) from a `Response` body and yields `AGUIEvent` objects.                                                                                                                                                                                        |
| `adapters/openai-completions.ts`                 | Parses OpenAI Chat Completions streaming chunks (`ChatCompletionChunk`) and translates them to AG-UI events. Handles content deltas, tool call start/args/end, and finish reasons.                                                                                                                |
| `adapters/openai-responses.ts`                   | Parses OpenAI Responses API streaming events (`ResponseStreamEvent`) and translates them to AG-UI events. Handles output items, text deltas, function call arguments, and error events.                                                                                                           |
| `adapters/openai-message-format.ts`              | `MessageFormat` implementation for OpenAI Chat Completions. Bidirectional conversion between AG-UI `Message[]` and `ChatCompletionMessageParam[]`. Handles user (including multipart/image), assistant (including tool calls), tool, system, and developer messages.                              |
| `adapters/openai-conversation-message-format.ts` | `MessageFormat` implementation for OpenAI Responses/Conversations API. Converts AG-UI messages to `ResponseInputItem[]` (flattening assistant tool calls into sibling items) and converts `ConversationItem[]` back to AG-UI messages (grouping adjacent function_calls into assistant messages). |

### `types/` — Type Definitions

| File               | Purpose                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message.ts`       | Re-exports all message types from `@ag-ui/core`: `Message`, `UserMessage`, `AssistantMessage`, `ToolMessage`, `SystemMessage`, `DeveloperMessage`, `ReasoningMessage`, `ActivityMessage`, `ToolCall`, `FunctionCall`, `InputContent`, `TextInputContent`, `BinaryInputContent`. Also defines `CreateMessage = Omit<UserMessage, "id">`. |
| `messageFormat.ts` | Defines the `MessageFormat` interface (`toApi`/`fromApi`) and the default `identityMessageFormat` (pass-through).                                                                                                                                                                                                                       |
| `stream.ts`        | Defines the `StreamProtocolAdapter` interface (a `parse(response) → AsyncIterable<AGUIEvent>` contract). Re-exports `EventType` enum and `AGUIEvent` type from `@ag-ui/core`.                                                                                                                                                           |

### `hooks/` — Message Context

| File             | Purpose                                                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useMessage.tsx` | `MessageContext`, `MessageProvider`, and `useMessage` hook. Provides a React context for passing the current `Message` down to child components (used by `react-ui` when rendering individual messages). Uses `useShallow` for stable context values. |

---

## API Reference

### ChatProviderProps

The provider accepts a **discriminated union** config — you provide either URL strings or custom functions, but not both:

#### Thread API (choose one):

| Prop              | Type                                             | Description                                                                                                |
| ----------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `threadApiUrl`    | `string`                                         | Base URL for convention-based REST endpoints (`/get`, `/create`, `/delete/:id`, `/update/:id`, `/get/:id`) |
| **— or —**        |                                                  |                                                                                                            |
| `fetchThreadList` | `(cursor?) => Promise<{ threads, nextCursor? }>` | Custom function to load threads with pagination                                                            |
| `createThread`    | `(firstMessage) => Promise<Thread>`              | Custom function to create a thread                                                                         |
| `deleteThread`    | `(id) => Promise<void>`                          | Custom function to delete a thread                                                                         |
| `updateThread`    | `(thread) => Promise<Thread>`                    | Custom function to update a thread                                                                         |
| `loadThread`      | `(threadId) => Promise<Message[]>`               | Custom function to load a thread's messages                                                                |

#### Chat API (choose one):

| Prop             | Type                                                             | Description                                                                                 |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `apiUrl`         | `string`                                                         | URL to POST messages to. Sends `{ threadId, messages }` and expects an SSE stream response. |
| **— or —**       |                                                                  |                                                                                             |
| `processMessage` | `({ threadId, messages, abortController }) => Promise<Response>` | Custom function to send messages. Must return a `Response` with a readable stream body.     |

#### Optional:

| Prop             | Type                    | Default                 | Description                                           |
| ---------------- | ----------------------- | ----------------------- | ----------------------------------------------------- |
| `streamProtocol` | `StreamProtocolAdapter` | `agUIAdapter()`         | How to parse the streaming response                   |
| `messageFormat`  | `MessageFormat`         | `identityMessageFormat` | How to convert messages to/from your backend's format |

### useThread

```tsx
function useThread(): ThreadState & ThreadActions;
function useThread<T>(selector: (state: ThreadState & ThreadActions) => T): T;
```

**State:**
| Field | Type | Description |
|-------|------|-------------|
| `messages` | `Message[]` | Messages in the current thread |
| `isRunning` | `boolean` | Whether a message is being streamed |
| `isLoadingMessages` | `boolean` | Whether messages are being loaded from the backend |
| `threadError` | `Error \| null` | Error from the last operation |

**Actions:**
| Method | Signature | Description |
|--------|-----------|-------------|
| `processMessage` | `(msg: CreateMessage) => Promise<void>` | Send a user message and stream the response |
| `appendMessages` | `(...msgs: Message[]) => void` | Append messages to the thread |
| `updateMessage` | `(msg: Message) => void` | Replace a message by ID |
| `setMessages` | `(msgs: Message[]) => void` | Replace all messages |
| `deleteMessage` | `(id: string) => void` | Remove a message by ID |
| `cancelMessage` | `() => void` | Abort the in-flight stream |

### useThreadList

```tsx
function useThreadList(): ThreadListState & ThreadListActions;
function useThreadList<T>(selector: (state: ThreadListState & ThreadListActions) => T): T;
```

**State:**
| Field | Type | Description |
|-------|------|-------------|
| `threads` | `Thread[]` | All loaded threads, sorted by `createdAt` desc |
| `isLoadingThreads` | `boolean` | Whether the thread list is loading |
| `threadListError` | `Error \| null` | Error from thread list operations |
| `selectedThreadId` | `string \| null` | Currently active thread ID |
| `hasMoreThreads` | `boolean` | Whether more pages are available |

**Actions:**
| Method | Signature | Description |
|--------|-----------|-------------|
| `loadThreads` | `() => void` | Fetch the first page of threads |
| `loadMoreThreads` | `() => void` | Fetch the next page (uses cursor) |
| `switchToNewThread` | `() => void` | Deselect current thread, clear messages |
| `createThread` | `(firstMessage: UserMessage) => Promise<Thread>` | Create a new thread |
| `selectThread` | `(threadId: string) => void` | Select a thread and load its messages |
| `updateThread` | `(thread: Thread) => void` | Update thread metadata (e.g., title) |
| `deleteThread` | `(threadId: string) => void` | Delete a thread |

### useMessage

```tsx
function useMessage(): { message: Message };
```

Returns the current message from `MessageContext`. Must be used inside a `<MessageProvider>`. This is primarily used by `@openuidev/react-ui` when rendering individual message components.

### processStreamedMessage

```tsx
function processStreamedMessage(params: {
  response: Response;
  createMessage: (msg: AssistantMessage) => void;
  updateMessage: (msg: AssistantMessage) => void;
  deleteMessage: (id: string) => void;
  adapter?: StreamProtocolAdapter;
}): Promise<AssistantMessage | void>;
```

Low-level utility that consumes an SSE response via the given adapter and calls the provided callbacks as the message is built up incrementally. Used internally by the store's `processMessage` action, but exported for advanced use cases.

### Stream Adapters

```tsx
import {
  agUIAdapter,
  openAIAdapter,
  openAIReadableStreamAdapter,
  openAIResponsesAdapter,
} from "@openuidev/react-headless";

// Use with ChatProvider
<ChatProvider streamProtocol={openAIAdapter()} apiUrl="/api/chat">
  ...
</ChatProvider>;
```

### Message Format Converters

```tsx
import {
  openAIMessageFormat,
  openAIConversationMessageFormat,
  identityMessageFormat,
} from "@openuidev/react-headless";

// For OpenAI Chat Completions backends
<ChatProvider messageFormat={openAIMessageFormat} streamProtocol={openAIAdapter()} apiUrl="/api/chat">
  ...
</ChatProvider>

// For OpenAI Responses API backends
<ChatProvider
  messageFormat={openAIConversationMessageFormat}
  streamProtocol={openAIResponsesAdapter()}
  apiUrl="/api/chat"
>
  ...
</ChatProvider>
```

---

## Type Reference

### Message Types (from `@ag-ui/core`)

| Type               | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `Message`          | Union of all message types                                 |
| `UserMessage`      | User-sent message (text or multipart content with images)  |
| `AssistantMessage` | LLM response (text content + optional tool calls)          |
| `ToolMessage`      | Tool/function result message                               |
| `SystemMessage`    | System prompt message                                      |
| `DeveloperMessage` | Developer instruction message                              |
| `ReasoningMessage` | Chain-of-thought reasoning                                 |
| `ActivityMessage`  | Status/activity indicator                                  |
| `ToolCall`         | A tool call within an assistant message                    |
| `FunctionCall`     | The function name + arguments within a ToolCall            |
| `CreateMessage`    | `Omit<UserMessage, "id">` — used when sending new messages |

### Store Types

| Type                | Description                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Thread`            | `{ threadId, title, createdAt, isPending? }`                                                                  |
| `ThreadState`       | `{ messages, isRunning, isLoadingMessages, threadError }`                                                     |
| `ThreadActions`     | `{ processMessage, appendMessages, updateMessage, setMessages, deleteMessage, cancelMessage }`                |
| `ThreadListState`   | `{ threads, isLoadingThreads, threadListError, selectedThreadId, hasMoreThreads }`                            |
| `ThreadListActions` | `{ loadThreads, loadMoreThreads, switchToNewThread, createThread, selectThread, updateThread, deleteThread }` |
| `ChatStore`         | `ThreadListState & ThreadListActions & ThreadState & ThreadActions` (plus internal fields)                    |
| `ChatProviderProps` | Configuration for `<ChatProvider>`                                                                            |

### Adapter Types

| Type                    | Description                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `StreamProtocolAdapter` | `{ parse(response: Response): AsyncIterable<AGUIEvent> }`                                                                                       |
| `MessageFormat`         | `{ toApi(msgs: Message[]): unknown; fromApi(data: unknown): Message[] }`                                                                        |
| `AGUIEvent`             | Event emitted by stream adapters (from `@ag-ui/core`)                                                                                           |
| `EventType`             | Enum: `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT`, `TEXT_MESSAGE_END`, `TOOL_CALL_START`, `TOOL_CALL_ARGS`, `TOOL_CALL_END`, `RUN_ERROR`, etc. |

---

## How It All Fits Together

1. **You wrap your app** in `<ChatProvider>` with your backend config.
2. **The provider creates a Zustand store** with all thread and message management baked in.
3. **Your UI components** call `useThread()` and `useThreadList()` to read state and dispatch actions.
4. **When a user sends a message**, `processMessage()`:
   - Appends an optimistic user message
   - Auto-creates a thread if needed
   - Sends the request to your backend
   - Streams the response through the adapter pipeline
   - Updates the store in real-time as tokens arrive
5. **The `MessageFormat` layer** handles serialization differences between AG-UI's internal format and your backend (OpenAI Completions, Responses API, or custom).
6. **The `StreamProtocolAdapter` layer** handles parsing differences between SSE protocols.
7. **Everything is cancellable** via `AbortController` — switching threads or calling `cancelMessage()` cleanly aborts in-flight streams.
=======
## Install

```bash
pnpm add @openuidev/react-headless
```

## Docs
>>>>>>> main

Detailed documentation is available at [openui.com](https://openui.com).
