# @openuidev/dashboard-library

## 1.0.1

### Patch Changes

- [#1632](https://github.com/thesysdev/openui/pull/1632) [`0c067d8`](https://github.com/thesysdev/openui/commit/0c067d8113a9bb5a008342f087c12fc005e9972e) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - Fixes from live tests of 1.0.0. Table, KeyValues and Donut cards fit their content instead of a fixed row height, and a row mixing a Table with a chart sizes from the table's rows. Paged tables keep their column widths and height, and a narrow table's scroll arrows sit beside the pager. The seventh series colour is now sienna, so it no longer looks like the first. Cohort and Heatmap headers no longer overlap in narrow cards. Axes show dates as "May 14" or "Nov 2025", and en-US `toLocaleString` date strings format as dates. A derived KPI shows a loading bar instead of `$0.00` during its first fetch. Bar axes use round steps, tooltips with no previous value say "Value", target chips move away from the data, and a `%` suffix format shows changes in points.

## 1.0.0

### Major Changes

- [#1620](https://github.com/thesysdev/openui/pull/1620) [`12dcdb6`](https://github.com/thesysdev/openui/commit/12dcdb66b06deb6129b66eb019c644eed349773c) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - The new and improved dashboard library. 45 components in 10 groups replace the 0.0.x components: Dashboard, Section, Row and Card for layout; KPIs and stats; time series and small multiples; bar comparisons and ranked lists; donuts, segmented bars and treemaps; scatter plots, heatmaps, cohorts and flows; US and world maps; tables with totals; and a FilterBar with select, multi-select, chip, date range and search filters. Values are raw numbers with a Format, cards can show previous values and a Compare mode, and `goodWhen` sets which direction is good. `ThemeProvider` takes `mode`, `lightTheme` and `darkTheme`, and themes server-rendered HTML before it hydrates. `promptOptions` carries generation rules and examples and loads no component code, so a server can import it. The export names are unchanged, but programs written for 0.0.x no longer render.

### Patch Changes

- Updated dependencies [[`c782147`](https://github.com/thesysdev/openui/commit/c78214746c306491745e4f008593f3bc34c51671)]:
  - @openuidev/react-lang@1.1.1

## 0.0.2

### Patch Changes

- [#1581](https://github.com/thesysdev/openui/pull/1581) [`2bc06b5`](https://github.com/thesysdev/openui/commit/2bc06b5bfc79fe99c22ebef094bac65c7c599280) Thanks [@i-subham23](https://github.com/i-subham23)! - `DashboardCardHeader` titles and `EntityList` values accept numbers and show them formatted. A number the model passed from a query (a star count, a fork count) made the component fail to render and the value disappear; a `0` showed as blank. Numbers now read like "4.1B", and timestamps like "Apr 1, 2026" ([#1552](https://github.com/thesysdev/openui/issues/1552)).
