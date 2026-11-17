---
"@openuidev/server": patch
---

`createFrontendToken` and the dashboard `context` take an optional `groupIds`: the groups the user is in, from your own system. Dashboards shared with one of those groups open, edit and run for the user. The token sends them as `group_ids`, and so do `dashboards.edit` and `interpreter.execute`; `dashboards.create` doesn't. `groupIds`, when set, must be an array of non-empty strings.
