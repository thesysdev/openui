---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
---

A Query that reads another query's result waits for it and reruns when it changes (react-lang; other renderers call `queryManager.evaluateStatements`).

- `QueryManager` implementations must add `evaluateStatements`.
- Queries that read each other report the new `query-cycle` error and do not run.
- A failed fetch is retried only by `@Run`, a refresh interval or `invalidate`, not on every evaluation.
