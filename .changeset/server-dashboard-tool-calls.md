---
"@openuidev/server": minor
---

Dashboards are built on `/v1/dashboard/chat/completions`, which needs an OpenUI Cloud that has it. While a dashboard is built, the model can call your data tools and save and run its own data scripts against them, so charts and tables match the data's real shape and every script has run once before the dashboard is saved. `create` and `edit` now return after these rounds, so they take longer and call your tools during the build.

`create` and `edit` take an `onProgress` option that reports each tool call, each script the model checks, and the dashboard starting, so your UI can show the build as it goes; `describeDashboardProgress` turns a step into a short label.
