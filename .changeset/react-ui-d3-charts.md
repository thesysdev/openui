---
"@openuidev/react-ui": patch
---

Charts are now drawn with D3 instead of Recharts. Every chart keeps its name and export (`AreaChart`, `AreaChartCondensed`, `BarChart`, `BarChartCondensed`, `HorizontalBarChart`, `LineChart`, `LineChartCondensed`, `PieChart`, `RadarChart`, `RadialChart`, `ScatterChart`, `SingleStackedBar`, the Mini charts and the scatter helpers) and takes the same `data` + `categoryKey` / `dataKey` shape; genui-lib's chart components and their props are unchanged. New charts: `HeatmapChart`, `FunnelChart`, `SegmentedBar` (the same component as `SingleStackedBar`), `CalendarHeatmap`, plus `StackedLegend` with `LegendStoreProvider`.

Changes for direct users:

- `theme` (named palettes) is gone; set colors with `customPalette` or the ThemeProvider's chart palettes (`defaultChartPalette`, `barChartPalette`, …).
- `height` is the whole chart: the x-axis labels and legend fit inside it instead of being added below. Labels take at most half of it and truncate when they don't fit.
- Renamed: bar `radius` → `barRadius`; SingleStackedBar `animated` → `isAnimationActive`.
- Dropped: line and radar `strokeWidth`; HorizontalBarChart `showXAxis`; Pie and Radial `onMouseEnter` / `onMouseLeave`; scatter `shape` and `xAxisDataKey` / `yAxisDataKey` (points always read `x` / `y`).
- `recharts` is no longer a dependency.
