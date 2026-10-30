---
"@openuidev/lang-core": patch
---

Keep parentheses around a right operand of equal precedence in `jsonToOpenUI`, so `$a - ($b - $c)` no longer serializes as `$a - $b - $c`.
