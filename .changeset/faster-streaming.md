---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
---

Faster streaming: each statement is built once per parse, and react-lang skips elements whose props did not change. Treat parse results as immutable. A component that reads values outside its props, `$state`, queries or context no longer re-renders on every chunk.
