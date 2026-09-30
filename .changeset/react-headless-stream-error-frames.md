---
"@openuidev/react-headless": patch
---

Surface in-stream error frames as `RUN_ERROR`. `openAIAdapter`, `openAIReadableStreamAdapter`, `agUIAdapter` and `openAIResponsesAdapter` now map an OpenAI-style `{"error":{"message","code"}}` record delivered inside an HTTP 200 stream — the shape the OpenAI SDK, OpenRouter and OpenUI Gateway emit for a rejected request, an upstream provider failure or a post-stream error — to an AG-UI `RUN_ERROR` event. Previously the record had no `choices` (or no AG-UI `type`) and was skipped, so `AgentInterface` ended the turn with no message and no error.
