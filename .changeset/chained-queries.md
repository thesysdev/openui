---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
---

Chained queries: a Query whose tool name or arguments read another query's result now waits for that result, runs with it, and runs again whenever it changes.

Chained queries work in react-lang. Other renderers that drive the query manager get them by calling `queryManager.evaluateStatements(parseResult.queryStatements, evaluationContext)`; `evaluateQueries` still works but does not wait. Code that implements `QueryManager` itself needs to add `evaluateStatements`.

Queries that read each other's results cannot run, and report the new `query-cycle` validation error code. A query that reads one of them waits and does not run either. TypeScript code with an exhaustive `switch` over `ValidationErrorCode` needs a case for it.

A failed fetch now stays failed until the query is run again (`@Run`, its refresh interval, or `invalidate`); it is no longer retried on every evaluation. Queries that read it keep waiting meanwhile.
