---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
---

Derive query loading from the selected cache entry so switching back to cached or in-flight results and receiving stale responses cannot leave loaders stuck. Allow query evaluation to pause execution while retaining cached data.

Preserve completed query values while MiniApp edits stream. Show queryLoader while queries await generation, and placeholders for widgets without successful data, keeping static layout and titles visible. Refresh script-backed queries after completed script updates without discarding their previous results.
