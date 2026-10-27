---
"@openuidev/observability-cloud": patch
---

Send artifact lifecycle events (`react-headless:artifact`) to OpenUI Cloud: one per artifact stream, with its outcome, error code, time to first content, duration, reconnects, and whether it resumed or was an edit. Minimal capture drops the free-text message.
