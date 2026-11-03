---
"@openuidev/dashboard-library": patch
---

ISO dates show as a day: "2016-10-05T23:32:51Z" reads "Oct 5, 2016" in KPI values and subtexts (`MetricIndicator`, `SmallCard`, `OverviewCardBlock`) and in `Table` cells. Dates print in UTC, so the server and the browser show the same day.
