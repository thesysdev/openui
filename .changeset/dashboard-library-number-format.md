---
"@openuidev/dashboard-library": patch
---

KPI values that are plain numbers are shortened with K, M and B: `MetricIndicator`, `SmallCard`'s metric and `OverviewCardBlock` show "48496340" as "48.5M" and "69582" as "69.6K". Other values ("$1.2K", "12%") and numbers below 10,000, such as a year, are shown as written.
