---
"@openuidev/dashboard-library": major
---

The new and improved dashboard library. 45 components in 10 groups replace the 0.0.x components: Dashboard, Section, Row and Card for layout; KPIs and stats; time series and small multiples; bar comparisons and ranked lists; donuts, segmented bars and treemaps; scatter plots, heatmaps, cohorts and flows; US and world maps; tables with totals; and a FilterBar with select, multi-select, chip, date range and search filters. Values are raw numbers with a Format, cards can show previous values and a Compare mode, and `goodWhen` sets which direction is good. `ThemeProvider` takes `mode`, `lightTheme` and `darkTheme`, and themes server-rendered HTML before it hydrates. `promptOptions` carries generation rules and examples and loads no component code, so a server can import it. The export names are unchanged, but programs written for 0.0.x no longer render.
