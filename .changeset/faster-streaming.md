---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
---

Faster parsing and streaming:

- Large programs parse and stream faster: each referenced statement is materialized once per parse instead of once per use (programs that reuse a statement many times were exponential), preprocessing and `set()` compare text faster, unchanged query snapshots skip the JSON comparison, and react-lang builds the error-enrichment schema once per library. A validation error inside a statement referenced more than once is now reported once, unless the statement still contains unresolved references.
- While streaming, a finished statement whose inputs did not change keeps the same object on every chunk, and react-lang skips rendering it; it still re-renders when its data, `$state`, query results or context change. Treat parse results as immutable. A library function that is not pure (one using `Math.random` or the current time) now keeps its value across chunks in a finished statement until one of those changes, and a table or chart is skipped only when it is its own statement, not written inline in `root`.
- Query results are treated as immutable: to change one, return a new value instead of mutating the returned object.
