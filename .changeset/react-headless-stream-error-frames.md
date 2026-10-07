---
"@openuidev/react-headless": patch
---

Stream adapters no longer end a turn silently when something went wrong:

- In-stream `{"error":{…}}` records (and the same object as a plain JSON body under HTTP 200) now surface as `RUN_ERROR` in `openAIAdapter`, `openAIReadableStreamAdapter`, `openAIResponsesAdapter` and `agUIAdapter`; `vercelAIAdapter` handles the JSON body too.
- Responses cut short by a token limit or content filter (`finish_reason: length | content_filter`, `response.incomplete`, Vercel `finish` with `length` / `content-filter`) and Vercel `abort` chunks end with `RUN_ERROR`, keeping the text that already streamed.
- Refusals (`delta.refusal`, `response.refusal.*`) render as text instead of an empty message.
- Chat Completions tool calls are closed on any `finish_reason`, so a tool turn that finishes with `stop` no longer stays "streaming".
- `openAIResponsesAdapter` shows `file_search_call`, `code_interpreter_call` and `image_generation_call` as tool calls with results, and `custom_tool_call` / `computer_call` as client tool calls.
- The SSE adapters accept `data:` without the optional space; `langGraphAdapter` accepts CRLF line endings and announces complete `tool_calls` when `tool_call_chunks` is empty.
- `eveAdapter` flags a failed `action.result` with `isError`, so the tool shows as failed.
