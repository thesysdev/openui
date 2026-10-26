---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
---

Faster parsing and streaming:

- Each referenced statement is materialized once per parse, so programs that reuse a statement many times no longer take exponential time, and `hasDynamicProps` no longer rescans child elements (deep trees were quadratic). A validation error inside a statement referenced more than once is now reported once instead of once per use, unless the statement still contains unresolved references.
- The streaming parser strips markdown fences and comments only from newly received text instead of the whole buffer on every chunk, and `set()` checks the previous text with a faster comparison.
- The query manager skips the JSON comparison of the query snapshot when every value is the same object as before, so re-evaluating unchanged queries no longer stringifies all query data. Query results are treated as immutable: to change one, return a new value rather than mutating the returned object.
- `parse()` preprocesses faster: no fence scan when the text has no ``` and char-code scanning for comments, strings and brackets.
- react-lang builds the library JSON schema used to enrich parser errors once per library instead of on every pass with errors.
