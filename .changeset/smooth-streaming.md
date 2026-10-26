---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
---

Add `smoothStreaming` to `Renderer`. While streaming, content shows in the order it was written: anything after a child that has not arrived yet is held back, so nothing jumps. Everything held is shown when the stream ends. Off by default; with it off, rendering is unchanged.

lang-core adds the pieces it is built on: a `pendingSlots` option on the streaming parsers (`createStreamParser`, `createStreamingParser`) that keeps a `{ type: "pending", ref }` slot in arrays for refs not written yet while streaming, `isPendingSlot`, the `PendingSlot` type, and `revealInOrder()`.
