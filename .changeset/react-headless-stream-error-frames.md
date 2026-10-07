---
"@openuidev/react-headless": patch
---

Stream adapters no longer end a turn silently when something went wrong:

- In-stream `{"error":{…}}` records (and the same object as a plain JSON body under HTTP 200) now surface as `RUN_ERROR` in `openAIAdapter`, `openAIReadableStreamAdapter`, `openAIResponsesAdapter` and `agUIAdapter`; `vercelAIAdapter` handles the JSON body too. Only a real error counts: a non-empty string, or an object with a message or code.
- Responses cut short by a token limit or content filter (`finish_reason: length | content_filter`, `response.incomplete`, Vercel `finish` with `length` / `content-filter`) and Vercel `abort` chunks end with `RUN_ERROR` (`code` = the provider's reason, or `"abort"`), keeping the text that already streamed. Tool calls left open by a truncation are not ended.
- Refusals (`delta.refusal`, `response.refusal.*`) render as text instead of an empty message.
- Chat Completions tool calls are closed on any other `finish_reason`, so a tool turn that finishes with `stop` no longer stays "streaming"; the turn's message now also gets its `TEXT_MESSAGE_END`.
- `openAIResponsesAdapter` shows `file_search_call`, `code_interpreter_call` and `image_generation_call` as tool calls with results.
- The SSE adapters accept `data:` without the optional space; `langGraphAdapter` accepts CRLF line endings and announces complete `tool_calls` when `tool_call_chunks` is empty.
- `eveAdapter` flags an `action.result` whose status is not `completed` with `isError`, so the tool shows as failed.
- Every adapter now stops reading at its first `RUN_ERROR`, and `agUIAdapter` skips (and logs) records that have no AG-UI `type` instead of passing them on.
