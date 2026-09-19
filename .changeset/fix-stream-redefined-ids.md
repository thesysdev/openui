---
"@openuidev/lang-core": patch
---

Fix streaming parsing so the last complete definition of a repeated statement ID wins, matching the non-streaming parser. Keep the previous completed definition while a replacement is incomplete.
