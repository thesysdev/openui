---
"@openuidev/cli": minor
---

Internal restructure of the CLI: each command is a folder, shared process state is a `CliContext` passed top-down, and telemetry is a `Telemetry` class with typed per-command methods.

`openui create --help` loads template and backend-framework names from the catalog (bundled keys if the fetch fails). `--template` and `--backend-framework` accept catalog keys only (`openui-cloud`, `openui-self-hosted`, `default`, `langgraph`, `vercel-ai-sdk`, `vercel-eve`); short names like `cloud` and `eve` no longer resolve. `--verbose` is a global flag, so it works before or after the command.
