---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
---

Where a program's data comes from. `dataSources(parseResult)` in lang-core returns, for each component and each of its props, the queries it reads (chained queries included), the statements in between with their text, the `$variables` it uses and the components written in it. `useDataSources()` in react-lang adds each query's tool name and arguments, whether it is loading, and its result, and each `$variable`'s value, for a "where did this number come from" view. Other renderers can call `dataSources` and their query manager's `getCall(statementId)`.

`QueryManager` has a new method, `getCall(statementId)`: the tool name and arguments a query was last evaluated with. It is optional, so code that implements `QueryManager` itself still type-checks.
