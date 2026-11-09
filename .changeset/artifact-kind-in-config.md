---
"@openuidev/server": patch
---

Dashboards now send `kind: "dashboard"` in the config block. OpenUI Cloud requires it, so dashboards from 0.4.0 and earlier stop working once Cloud rolls out the check; upgrade before then.
