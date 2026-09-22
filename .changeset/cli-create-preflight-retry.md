---
"@openuidev/cli": patch
---

Add a preflight git check with per-OS install hints, retry network failures with backoff during source checkout, catalog fetch, and dependency installation, and record retry attempts in failure telemetry alongside a new `cli_network_retry` event.
