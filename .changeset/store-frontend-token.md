---
"@openuidev/server": patch
---

Allow `storeChatCompletionHistory` to authenticate with either `frontendToken` or `apiKey`. Require exactly one credential in TypeScript and at runtime, rejecting both or neither before sending a request. Existing API-key callers continue to work.
