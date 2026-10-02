---
"@openuidev/devtools": patch
---

The Inspect widget applies bus events in one batch once React has finished running effects, so a streamed response that arrives as a burst of chunks no longer logs "Maximum update depth exceeded" in development.
