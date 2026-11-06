---
"@openuidev/dashboard-library": patch
---

`DashboardCardHeader` titles and `EntityList` values accept numbers and show them formatted. A number the model passed from a query (a star count, a fork count) made the component fail to render and the value disappear; a `0` showed as blank. Numbers now read like "4.1B", and timestamps like "Apr 1, 2026" (#1552).
