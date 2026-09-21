---
"@openuidev/server": minor
---

Add `createAutofix` from `@openuidev/server/openai` for Chat Completions and
`@openuidev/server/vercel` for Vercel AI SDK UI message streams.
Both expose `fix({ generation, messages, signal })` for completed text and
`stream({ stream, messages, signal })` for SDK events, with no adapter configuration.
Validate locally and call Autofix only for invalid UI. Streaming appends the complete
corrected program as native text deltas before completion, preserving tool calls
and metadata. The Vercel AI SDK 7 helper accepts
`toUIMessageStream({ stream: result.stream })` output and returns AI SDK UI message SSE.
