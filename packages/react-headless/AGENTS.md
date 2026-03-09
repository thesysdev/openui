# react-headless — Agent Guide

## Build / Test / Lint

```bash
# From monorepo root:
pnpm --filter @openuidev/react-headless run build    # tsc → dist/
pnpm --filter @openuidev/react-headless run test     # vitest
pnpm --filter @openuidev/react-headless run ci       # lint:check + format:check

# Or from this directory:
pnpm build && pnpm test
```

Build order: **`react-headless`** → `lang-react` → `react-ui`. This package has no upstream workspace deps (only `@ag-ui/core` from npm), so it can always build independently.

## File Map

| Path                                                        | Purpose                                                                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                                              | Public API surface — every export consumers see. Check here first when adding/removing exports.                                             |
| `src/store/createChatStore.ts`                              | Zustand store factory. All state + actions live here. This is the most critical file.                                                       |
| `src/store/ChatProvider.tsx`                                | React provider — thin wrapper that creates the store once via `useState`.                                                                   |
| `src/store/ChatContext.ts`                                  | React context + `useChatStore()` internal hook.                                                                                             |
| `src/store/hooks.ts`                                        | `useThread()` / `useThreadList()` — selector hooks over the store.                                                                          |
| `src/store/types.ts`                                        | All store types: `ChatStore`, `ChatProviderProps`, `Thread`, state/action slices.                                                           |
| `src/store/__tests__/createChatStore.test.ts`               | Comprehensive test suite for the store (thread CRUD, message CRUD, streaming, cancellation, URL-based defaults, messageFormat round-trips). |
| `src/stream/processStreamedMessage.ts`                      | Consumes `AsyncIterable<AGUIEvent>` and drives message create/update/delete callbacks.                                                      |
| `src/stream/adapters/ag-ui.ts`                              | Default SSE adapter — parses `data: {json}\n` lines.                                                                                        |
| `src/stream/adapters/openai-completions.ts`                 | Adapter for OpenAI Chat Completions streaming (`ChatCompletionChunk`).                                                                      |
| `src/stream/adapters/openai-responses.ts`                   | Adapter for OpenAI Responses API streaming (`ResponseStreamEvent`).                                                                         |
| `src/stream/adapters/openai-readable-stream.ts`             | Adapter for OpenAI SDK's `Stream.toReadableStream()` — parses NDJSON (no SSE prefix) `ChatCompletionChunk` objects.                         |
| `src/stream/adapters/openai-message-format.ts`              | `MessageFormat` for OpenAI Completions (`ChatCompletionMessageParam[]` ↔ AG-UI).                                                           |
| `src/stream/adapters/openai-conversation-message-format.ts` | `MessageFormat` for OpenAI Responses/Conversations API (`ResponseInputItem[]` ↔ AG-UI).                                                    |
| `src/types/`                                                | Shared types: `message.ts` (re-exports from `@ag-ui/core`), `messageFormat.ts`, `stream.ts`.                                                |
| `src/hooks/useMessage.tsx`                                  | `MessageContext` / `MessageProvider` / `useMessage` — per-message React context used by `react-ui`.                                         |

## Key Patterns

### Adding a new store action

1. Add the type to the appropriate slice in `src/store/types.ts` (`ThreadActions` or `ThreadListActions`).
2. Implement it in `createChatStore.ts` inside the `createStore<ChatStore>(...)` call.
3. Add it to the selector in `src/store/hooks.ts` (`threadSelector` or `threadListSelector`).
4. Add tests in `src/store/__tests__/createChatStore.test.ts`.
5. If it should be public, export the type from `src/index.ts`.

### Adding a new stream adapter

1. Create `src/stream/adapters/my-adapter.ts` implementing `StreamProtocolAdapter` (must have `async *parse(response): AsyncIterable<AGUIEvent>`).
2. Export it from `src/stream/adapters/index.ts`.
3. Export it from `src/index.ts`.

### Adding a new message format

1. Create a file in `src/stream/adapters/` implementing the `MessageFormat` interface (`toApi` + `fromApi`).
2. Export it from `src/stream/adapters/index.ts` and `src/index.ts`.

### ChatProviderProps config pattern

`ChatProviderProps` uses a **discriminated union** so TypeScript enforces "URL string OR custom functions, not both":

- `ThreadApiConfig`: provide `threadApiUrl` string **or** individual functions (`fetchThreadList`, `createThread`, etc.)
- `ChatApiConfig`: provide `apiUrl` string **or** a `processMessage` function

When `threadApiUrl` is given, `createChatStore` generates default REST implementations (`/get`, `/create`, `/delete/:id`, `/update/:id`, `/get/:id`).

### How streaming works

`processMessage()` in the store → `fetch(apiUrl)` → `StreamProtocolAdapter.parse(response)` → yields `AGUIEvent`s → `processStreamedMessage()` accumulates text deltas and tool calls into an `AssistantMessage`, calling `createMessage` on first event and `updateMessage` on subsequent events.

### OpenAI adapter types

The `openai` package is a **devDependency** only (for type imports). It is not bundled. The adapter files import types like `ChatCompletionChunk`, `ResponseStreamEvent`, etc. using `import type` so there is no runtime dependency.

## Testing

Tests use Vitest and mock `fetch` via `vi.stubGlobal`. Streaming tests create `ReadableStream` instances with hand-crafted SSE payloads. Use `flushPromises()` (a `setTimeout(0)` wrapper) to await async store updates.

```bash
pnpm test                    # run all tests
pnpm vitest run --reporter verbose  # verbose output
```

## Do NOT Change

- **Message types** — all message types (`Message`, `UserMessage`, `AssistantMessage`, etc.) come from `@ag-ui/core`. Do not redefine them; only re-export.
- **Store shape** — `ChatStore` is a flat Zustand store. Do not nest slices into sub-objects; hooks rely on the flat structure.
- **`identityMessageFormat`** — this is the default no-op format. It must remain `{ toApi: (m) => m, fromApi: (d) => d as Message[] }`.
- **`_abortController` / `_nextCursor`** — these are internal fields prefixed with `_`. Do not expose them in hooks or types.
- **`ChatProvider` store creation** — the store is created once via `useState(() => createChatStore(config))`. It intentionally does not react to config changes after mount.
