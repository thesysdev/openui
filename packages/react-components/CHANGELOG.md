# @openuidev/react-components

## 0.0.5

### Patch Changes

- [#1689](https://github.com/thesysdev/openui/pull/1689) [`aa3f9fe`](https://github.com/thesysdev/openui/commit/aa3f9feeab0cfa5bbfd9aa50690abca01b20510d) Thanks [@mlubbad](https://github.com/mlubbad)! - Use CSS logical start alignment (`text-align: start`, `justify-content: flex-start`, and `border-inline-end`) for default unaligned text blocks, table headers/cells, option cards, citations, follow-up items, and tooltips so RTL (`dir="rtl"`) interfaces align naturally to the inline start while keeping LTR rendering unchanged.

## 0.0.4

### Patch Changes

- [#1700](https://github.com/thesysdev/openui/pull/1700) [`75684e7`](https://github.com/thesysdev/openui/commit/75684e773976525e442ed885c416ad8da0e2a756) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - react-ui and react-components now share one theme provider. react-ui re-exports `ThemeProvider`, `useTheme`, the default themes, swatches and theme hooks from react-components, so a single `ThemeProvider` from either package themes the components of both, including charts, markdown and popups that read the theme in JavaScript. react-ui's exports are unchanged. react-components adds a `@openuidev/react-components/theme` entry with only the theme code, and exports `ThemeContext`.

## 0.0.3

### Patch Changes

- [#1651](https://github.com/thesysdev/openui/pull/1651) [`f742499`](https://github.com/thesysdev/openui/commit/f742499390d7b28250f4b4c1780ef925b4b795db) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - Bar, line and area charts that scroll sideways keep their full width when the app's CSS has an `svg { max-width: 100% }` reset. Before, the reset squeezed the chart to its box, cutting off the last categories with nothing left to scroll.

## 0.0.2

### Patch Changes

- [#1545](https://github.com/thesysdev/openui/pull/1545) [`716ce4f`](https://github.com/thesysdev/openui/commit/716ce4f2656b3ba6a27f5b97d8545ffa5f3b49c8) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - Rewrite the README for the package's users: install, usage, theming, styling and overriding styles.
