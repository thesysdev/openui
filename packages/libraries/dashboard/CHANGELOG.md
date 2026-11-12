# @openuidev/dashboard-library

## 0.0.2

### Patch Changes

- [#1581](https://github.com/thesysdev/openui/pull/1581) [`2bc06b5`](https://github.com/thesysdev/openui/commit/2bc06b5bfc79fe99c22ebef094bac65c7c599280) Thanks [@i-subham23](https://github.com/i-subham23)! - `DashboardCardHeader` titles and `EntityList` values accept numbers and show them formatted. A number the model passed from a query (a star count, a fork count) made the component fail to render and the value disappear; a `0` showed as blank. Numbers now read like "4.1B", and timestamps like "Apr 1, 2026" ([#1552](https://github.com/thesysdev/openui/issues/1552)).
