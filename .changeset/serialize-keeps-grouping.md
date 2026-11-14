---
"@openuidev/lang-core": patch
---

`jsonToOpenUI` adds the parentheses an expression needs to parse back the same way. It wrote `$a - ($b - $c)` as `$a - $b - $c`, `!($a && $b)` as `!$a && $b`, `-($a + $b)` as `-$a + $b`, and `"n: " + ($n > 0 ? $n : "none")` as `"n: " + $n > 0 ? $n : "none"`, so a serialized program computed a different value. Spec section 9.2 names the first two cases.
