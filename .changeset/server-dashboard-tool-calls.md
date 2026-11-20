---
"@openuidev/server": patch
---

Dashboards are built on `/v1/dashboard/chat/completions`, which needs an OpenUI Cloud that has it. While a dashboard is built, the model can call your data tools and save and run its own data scripts against them, so charts and tables match the data's real shape and every script has run once before the dashboard is saved. `create` and `edit` now return after these rounds, so they take longer and call your tools during the build.

`create` and `edit` take `{ stream: true }` and then yield two messages: one as soon as the dashboard has an id, so renderers can show it building, and one once it is saved or failed. Without it, they resolve once the dashboard starts, as before.

`defineDashboard` takes `reasoningEffort` (`"minimal" | "low" | "medium" | "high"`), sent as `reasoning_effort` with every round, for models that can think.

`defineDashboard` takes `maxToolRounds`: how many rounds of tool calls the model may make before it must write the dashboard (OpenUI Cloud's default: 20). With `0` the model calls none of your tools directly; it still saves and runs its data scripts, which call them.
