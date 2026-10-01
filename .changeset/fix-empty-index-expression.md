---
"@openuidev/lang-core": patch
---

Report empty index expressions such as `rows[].field` as statement-level parser errors with guidance to use `rows.field` for array projection. Preserve streaming tolerance for unfinished indexes and clear diagnostics when a statement is corrected.

Also report unsupported function calls, incomplete ternaries, missing member names, and missing operands. Include supported alternatives in diagnostics and defer unfinished trailing expressions during streaming.
