---
"@openuidev/react-headless": patch
"@openuidev/react-ui": patch
---

Persist in-message edits through storage adapters, including `useOpenuiCloudStorage`, preserve streamed message IDs, and avoid duplicate form-state saves.

Send content-only REST message patches and retain edited messages in default in-memory storage across thread switches.
