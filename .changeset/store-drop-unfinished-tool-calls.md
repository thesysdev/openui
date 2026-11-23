---
"@openuidev/server": patch
---

`storeChatCompletionHistory` and `storeLangGraphHistory` (and their `…ToItems` converters) store a tool call only together with its result. A turn stopped mid tool call used to save the call on its own, and the model API then rejected every later message in that thread. Now the turn is saved without that call. Results without a call are dropped too.
