---
"@openuidev/lang-core": patch
---

Streaming parse strips markdown fences and comments only from newly received text instead of the whole buffer on every chunk, and `set()` checks the previous text with a faster comparison.
