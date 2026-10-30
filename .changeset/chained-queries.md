---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
---

Chained queries: a Query whose tool name or arguments read another query's result now waits for that result, runs with it, and runs again whenever it changes.

Chained queries work in react-lang. Other renderers that drive the query manager get them by calling `queryManager.evaluateStatements(parseResult.queryStatements, evaluationContext)`; `evaluateQueries` still works but does not wait.

Queries that read each other's results cannot run, and report the new `query-cycle` validation error code. TypeScript code with an exhaustive `switch` over `ValidationErrorCode` needs a case for it.
