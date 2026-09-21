---
"@openuidev/server": minor
---

Add `createAutofix` from `@openuidev/server/openai` for Chat Completions and
`@openuidev/server/vercel` for Vercel AI SDK UI message streams.
Both expose `fix({ generation, messages, signal })` for completed text.
Streaming uses `chat.completions({ stream, messages, signal })` for Chat Completions,
`responses()` for OpenAI Responses (not yet supported), and `ai({ stream, messages, signal })`
for Vercel AI SDK UI message streams. Validate locally and call Autofix only for invalid UI.
Streaming appends the complete corrected program as native text deltas before completion,
preserving tool calls and metadata. A repair after a closed ```openui-lang fence is
wrapped in a second fence so the parser does not ignore it. The Vercel AI SDK 7 helper accepts
`toUIMessageStream({ stream: result.stream })` output and returns AI SDK UI message SSE.
`@openuidev/server/openai` also exports `storeChatCompletionHistory` and
`chatCompletionMessagesToItems` (moved off the package root).
