---
"@openuidev/lang-core": patch
---

Fix streaming parsing so the latest definition of a repeated statement ID renders progressively as it arrives, matching how new statements stream. Completed programs use the last definition, matching the non-streaming parser.
