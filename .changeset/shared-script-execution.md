---
"@openuidev/server": minor
---

Export a protocol-independent executeScript helper and types for execution continuations, customer tool dispatch, cancellation, and deadlines. Applications supply adapters for their execution engine and transport.

Add createToolExecutor to dispatch registered application tools and execute generated scripts through the stateless OpenUI endpoint, including tool continuations, cancellation, deadlines, and structured execution errors.
