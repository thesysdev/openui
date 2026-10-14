---
"@openuidev/cli": minor
---

Let coding agents get through sign-in without blocking. When an agent runs a command that needs sign-in, the CLI starts it in the background, prints the link, and exits with 75. Re-running the same command waits for the sign-in to finish. The sign-in is saved, so `create` and `generate-api-key` mint keys without opening the browser again until the token expires. Adds `openui auth login` and `openui auth logout`.
