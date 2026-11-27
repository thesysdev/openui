---
"@openuidev/lang-core": patch
---

A ternary whose `:` ends a line (`label = $on ? "yes" :` with `"no"` on the next line) now keeps its else branch. The parser, the streaming parser and `mergeStatements` ended the statement at that newline, so the else branch became `null` and its line was dropped without an error. Spec section 1.4 continues a statement while either branch of a ternary is still empty.
