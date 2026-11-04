---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
---

Where a component's data comes from. `dataSources(parseResult, statementId)` in lang-core returns the queries a statement reads (chained queries included), the statements in between and the `$variables` it uses, and the same for each prop of a component. `useDataSources(props.statementId)` in react-lang adds each query's tool name and arguments, whether it is loading, and its result, for a "where did this number come from" view. Other renderers can call `dataSources` and their query manager's `getCall(statementId)`.

`QueryManager` has a new method, `getCall(statementId)`: the tool name and arguments a query was last evaluated with. Code that implements `QueryManager` itself needs to add it.
