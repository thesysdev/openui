# @openuidev/dashboard-library

## 0.0.2

### Patch Changes

- [#1535](https://github.com/thesysdev/openui/pull/1535) [`3be6979`](https://github.com/thesysdev/openui/commit/3be69794ee2e7130c3aba223cf010414199cd3a8) Thanks [@i-subham23](https://github.com/i-subham23)! - An expanded Medium or Large card closes from a ✕ button in its top-right corner, replacing the Minimize button centered above it.

- [#1538](https://github.com/thesysdev/openui/pull/1538) [`12fca37`](https://github.com/thesysdev/openui/commit/12fca37caba0f071f762467f5e0802b49b1b1182) Thanks [@i-subham23](https://github.com/i-subham23)! - ISO dates show as a day: "2016-10-05T23:32:51Z" reads "Oct 5, 2016" in KPI values and subtexts (`MetricIndicator`, `SmallCard`, `OverviewCardBlock`) and in `Table` cells. Dates print in UTC, so the server and the browser show the same day.

- [#1538](https://github.com/thesysdev/openui/pull/1538) [`12fca37`](https://github.com/thesysdev/openui/commit/12fca37caba0f071f762467f5e0802b49b1b1182) Thanks [@i-subham23](https://github.com/i-subham23)! - KPI values that are plain numbers are shortened with K, M and B: `MetricIndicator`, `SmallCard`'s metric and `OverviewCardBlock` show "48496340" as "48.5M" and "69582" as "69.6K". Other values ("$1.2K", "12%") and numbers below 10,000, such as a year, are shown as written.
- Updated dependencies [[`3be6979`](https://github.com/thesysdev/openui/commit/3be69794ee2e7130c3aba223cf010414199cd3a8)]:
  - @openuidev/react-components@0.0.2
