---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
---

Values the parser and evaluator build (elements, reactive bindings, action steps) now carry a provenance brand, and the runtime only evaluates or renders branded values. Data that merely looks like an element or an AST node — for example a tool/query result containing `{ type: "element", ... }` or `{ k: "Ref", ... }` — stays data: its props are not evaluated, `renderNode` does not render it, a data `__reactive` marker is not written to the store, and `set`/`run`/custom steps in a data `{ steps: [...] }` object are dropped. `isElementNode` now requires the brand; `isElementShaped` keeps the shape-only check (used by `jsonToOpenUI`).
