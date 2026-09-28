---
"@openuidev/react-ui": patch
---

Add D3-based charts under `@openuidev/react-ui/D3Charts`: Area, Line, Bar (vertical and horizontal), Pie, Radial, Radar, Scatter, Heatmap, Funnel, SegmentedBar and CalendarHeatmap, plus `StackedLegend` with `LegendStoreProvider`. They take the same `data` + `categoryKey` / `dataKey` shape as the existing charts and ship alongside them with `openui-d3-` prefixed classes; the existing Recharts charts are unchanged.
