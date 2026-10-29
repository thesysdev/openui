---
"@openuidev/react-lang": patch
---

Stop retrying a broken component on every ancestor re-render. The per-element error boundary reset whenever its `children` changed, and those are a new element on every parent render, so a component that kept throwing was re-rendered (and threw again) each time anything above it re-rendered: about 1,250 failed renders in 10 seconds under a 60fps ancestor. It now retries right away when the element it renders changes (new streamed props, store or query data), and retries on parent re-renders with a backoff (50ms, doubling up to 5s), so a component waiting on something outside openui, such as a host context, still recovers.
