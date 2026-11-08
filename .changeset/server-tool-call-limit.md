---
"@openuidev/server": patch
---

A dashboard script's tool calls are limited by OpenUI Cloud's sandbox (48 per run), no longer by this package (was 16). The package keeps only a high backstop (256), so a later change to the sandbox's limit needs no upgrade. Rounds stay at 8.
