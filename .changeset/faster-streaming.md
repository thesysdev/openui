---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
---

Faster parsing and streaming:

- Each referenced statement is materialized once per parse instead of once per use, so parsing programs that reuse a statement many times is no longer exponential. A statement used more than once is now the same object at every use: treat parse results and element props as immutable. A validation error inside such a statement is reported once, unless the statement still contains unresolved references. Unchanged query snapshots skip the JSON comparison.
- react-lang skips rendering an element whose type and props did not change since the last render; it still re-renders when `$state`, query results or context change. Components reading `useOpenUI()` now also re-render on every `$state` write and query result change.
- Query results are treated as immutable: to change one, return a new value instead of mutating the returned object.
