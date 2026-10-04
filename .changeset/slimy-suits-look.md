---
"@openuidev/react-ui": patch
---

Fixes to the D3 charts from QA:

- Area and line charts with `variant="step"` step halfway between points, as the Recharts charts did, so the first and last values get a flat run too.
- The scrolling `BarChart`, `AreaChart` and `LineChart` widen their categories so long x-axis labels show in full, and scroll further. A category grows to at most three times its usual width and at most half the chart; longer labels, and labels in the condensed charts, are truncated with the full text on hover.
- The donut `PieChart` is a thin band in the slice colors over grey track wedges again, with slices 0.5° apart; `paddingAngle` sets the pie's gaps only.
- `RadarChart` marks the hovered axis with a dot on each series. The dots glide between axes and fade in and out, like the line and area charts' hover dots.
