---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
---

Add `smoothStreaming` to `Renderer`. While streaming, content shows in the order it was written: anything after a child that has not arrived yet waits for it, so nothing jumps. Off by default; with it off, rendering is unchanged.

`createStreamingParser` takes the same option: `{ smoothStreaming: true }`.
