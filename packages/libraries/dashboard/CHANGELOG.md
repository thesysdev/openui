# @openuidev/dashboard-library

## 1.0.0

### Major Changes

- The new and improved dashboard library. 41 components in 10 groups replace the 0.0.x components: Dashboard, Section, Row and Card for layout; KPIs and stats; time series and small multiples; bar comparisons and ranked lists; donuts, segmented bars and treemaps; scatter plots, heatmaps, cohorts and flows; US and world maps; tables with totals; and a FilterBar with select, multi-select, chip, date range and search filters. Values are raw numbers with a Format, cards can show previous values and a Compare mode, and `goodWhen` sets which direction is good. `ThemeProvider` takes `mode`, `lightTheme` and `darkTheme`, and themes server-rendered HTML before it hydrates. `promptOptions` carries new generation rules and examples. The export names are unchanged, but programs written for 0.0.x no longer render.

## 0.0.2

### Patch Changes

- [#1581](https://github.com/thesysdev/openui/pull/1581) [`2bc06b5`](https://github.com/thesysdev/openui/commit/2bc06b5bfc79fe99c22ebef094bac65c7c599280) Thanks [@i-subham23](https://github.com/i-subham23)! - `DashboardCardHeader` titles and `EntityList` values accept numbers and show them formatted. A number the model passed from a query (a star count, a fork count) made the component fail to render and the value disappear; a `0` showed as blank. Numbers now read like "4.1B", and timestamps like "Apr 1, 2026" ([#1552](https://github.com/thesysdev/openui/issues/1552)).
