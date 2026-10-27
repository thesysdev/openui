---
"@openuidev/lang-core": patch
---

`OpenUIError` gains the `"artifact"` source, with codes `not-found`, `generation-failed` and `network-error`, so artifact renderers can report why an OpenUI Cloud artifact couldn't be shown through the same `onError` as parser and query errors.
