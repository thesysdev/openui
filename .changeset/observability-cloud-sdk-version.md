---
"@openuidev/observability-cloud": patch
---

`SDK_VERSION` is now derived from package.json at build time instead of a
hardcoded constant that had drifted (wire envelopes previously reported
`0.0.1` regardless of the released version).
