---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
---

Chained queries: a Query whose tool name or arguments read another query's result now waits for that result, then runs, and runs again whenever it changes. Queries that read each other report `query-cycle` and do not run. Chained queries run in react-lang in 1.1; vue-lang, svelte-lang and angular-lang do not wait yet.
