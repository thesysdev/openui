---
"@openuidev/server": patch
---

Remove Autofix character limits for direct and streamed generations. Preserve the full text of the latest 20 context messages instead of truncating them to 8,000 characters.
