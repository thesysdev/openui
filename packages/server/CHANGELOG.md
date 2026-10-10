# @openuidev/server

## 0.1.1

### Patch Changes

- [#1325](https://github.com/thesysdev/openui/pull/1325) [`23f985a`](https://github.com/thesysdev/openui/commit/23f985af5c706788da4ab9870425e9bbfe57c1a1) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Add LangGraph message conversion and conversation-history storage through the new langgraph entry point.
- Updated dependencies [[`7c8f5e9`](https://github.com/thesysdev/openui/commit/7c8f5e9ae2e914063f7b47fc131fd46a7e178985)]:
  - @openuidev/lang-core@0.3.2

## 0.1.0

### Minor Changes

- [#1194](https://github.com/thesysdev/openui/pull/1194) [`68c9280`](https://github.com/thesysdev/openui/commit/68c9280106387f5a4571408c03501bff82a1b450) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Add `createAutofix` from `@openuidev/server/openai` for Chat Completions and
  `@openuidev/server/vercel` for Vercel AI SDK UI message streams.
  Both expose `fix({ generation, messages, signal })` for completed text.
  Streaming uses `chat.completions({ stream, messages, signal })` for Chat Completions,
  `responses()` for OpenAI Responses (not yet supported), and `ai({ stream, messages, signal })`
  for Vercel AI SDK UI message streams. Validate locally and call Autofix only for invalid UI.
  Streaming appends the complete corrected program as native text deltas before completion,
  preserving tool calls and metadata. A closed ```openui-lang fence is held back so the
  repair is inserted inside that same fence. The Vercel AI SDK 7 helper accepts
  `toUIMessageStream({ stream: result.stream })` output and returns AI SDK UI message SSE.
  `@openuidev/server/openai` also exports `storeChatCompletionHistory` and
  `chatCompletionMessagesToItems` (moved off the package root).
