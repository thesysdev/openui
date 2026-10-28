---
"@openuidev/cli": minor
---

`generate-api-key` now starts the project's `dev` script after writing the key, and stops it with an error if the server doesn't start within 5 seconds. Pass `--no-dev` to skip it.
