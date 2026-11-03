---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
---

Where a component's data comes from. `dataSources(parseResult, statementId)` in lang-core returns the queries a statement reads (chained queries included), the statements in between, and the `$variables` it uses. For a component it also gives the same for each prop, and marks a prop whose value is written in the program rather than read from anything. `useDataSources(props.statementId)` in react-lang adds each query's tool, current arguments and current result, for a "where did this number come from" view. Nothing is computed until it is asked for.
