---
"@openuidev/server": patch
---

A dashboard script's tool calls are limited by OpenUI Cloud's sandbox (48 per run), no longer by this package (was 16). The package keeps only a high backstop (256), so a later change to the sandbox's limit needs no upgrade. Rounds stay at 8. A run over the sandbox's limit fails with code `SCRIPT_ERROR` (message "TOO_MANY_TOOL_CALLS: …") instead of `script_limit`. A round can now run up to 48 of your tools at once. Your tools from one round now run at most 16 at a time (the batch was run all at once before).
