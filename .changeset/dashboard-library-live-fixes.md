---
"@openuidev/dashboard-library": patch
---

Fixes from live tests of 1.0.0. Table, KeyValues and Donut cards fit their content instead of a fixed row height, and a row mixing a Table with a chart sizes from the table's rows. Paged tables keep their column widths and height, and a narrow table's scroll arrows sit beside the pager. The seventh series colour is now sienna, so it no longer looks like the first. Cohort and Heatmap headers no longer overlap in narrow cards. Axes show dates as "May 14" or "Nov 2025", and en-US `toLocaleString` date strings format as dates. A derived KPI shows a loading bar instead of `$0.00` during its first fetch. Bar axes use round steps, tooltips with no previous value say "Value", target chips move away from the data, and a `%` suffix format shows changes in points.
