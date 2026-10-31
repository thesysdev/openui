---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
---

Faster parsing and streaming:

- Each referenced statement is materialized once per parse instead of once per use, so programs that reuse a statement many times are no longer exponential. A validation error inside a statement referenced more than once is now reported once, unless the statement still contains unresolved references. Unchanged query snapshots skip the JSON comparison.
- While streaming, react-lang skips rendering an element whose type and props did not change since the last chunk; it still re-renders when `$state`, query results or context change.
- Query results are treated as immutable: to change one, return a new value instead of mutating the returned object.
