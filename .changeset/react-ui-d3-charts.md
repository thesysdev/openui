---
"@openuidev/react-ui": patch
---

Add D3-based charts under `@openuidev/react-ui/D3Charts`: Area, Line, Bar (vertical and horizontal), Pie, Radial, Radar, Scatter, Heatmap, Funnel, SegmentedBar, CalendarHeatmap and the MiniArea / MiniBar / MiniLine sparklines, plus `StackedLegend` with `LegendStoreProvider`. They take the same `data` + `categoryKey` / `dataKey` shape and default to the same look as the existing charts (stacked-area totals, Pie/Radial stacked legend, SingleStackedBar compact legend, outline radar), and ship alongside them with `openui-d3-` prefixed classes; the existing Recharts charts are unchanged. Area, Line and Bar keep a fixed height: their x-axis labels never take more than half of it and truncate when they don't fit.
