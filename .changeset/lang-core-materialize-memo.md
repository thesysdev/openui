---
"@openuidev/lang-core": patch
---

Materialize each referenced statement once per parse, so programs that reuse a statement many times no longer take exponential time, and stop rescanning child elements when computing `hasDynamicProps` (deep trees were quadratic). Validation errors inside a statement referenced more than once are now reported once instead of once per use.
