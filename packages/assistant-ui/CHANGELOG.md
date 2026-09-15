# @openuidev/assistant-ui

## 0.1.1

### Patch Changes

- [#1186](https://github.com/thesysdev/openui/pull/1186) [`0227ad7`](https://github.com/thesysdev/openui/commit/0227ad77ed79a6292802960c69b61e6a75e0fcae) Thanks [@abhithesys](https://github.com/abhithesys)! - Widen the internal `react-headless`/`react-ui` peer windows to include the
  0.16.x line, fixing an install-time peer mismatch where these packages
  required a `react-headless`/`react-ui` version older than the one they ship
  against.
- Updated dependencies [[`0227ad7`](https://github.com/thesysdev/openui/commit/0227ad77ed79a6292802960c69b61e6a75e0fcae)]:
  - @openuidev/react-ui@0.16.1
  - @openuidev/react-headless@0.16.1

## 0.1.0

### Minor Changes

- [#1184](https://github.com/thesysdev/openui/pull/1184) [`5cde7c3`](https://github.com/thesysdev/openui/commit/5cde7c36ccd419570dd6b2653fc88dc4f6471964) Thanks [@abhithesys](https://github.com/abhithesys)! - Widen peer dependency ranges for `@openuidev/react-headless` and `@openuidev/react-ui` to allow `0.15.x` (`>=0.14.0 <0.16.0`).

### Patch Changes

- Updated dependencies [[`5cde7c3`](https://github.com/thesysdev/openui/commit/5cde7c36ccd419570dd6b2653fc88dc4f6471964)]:
  - @openuidev/react-ui@0.16.0
  - @openuidev/react-headless@0.16.0

## 0.0.4

### Patch Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - Internal `@openuidev/*` peer dependencies now declare bounded
  tested-compatibility ranges (e.g. `">=0.3.0 <0.4.0"`) instead of `workspace:`
  ranges, so a mismatched pair is caught at install time instead of failing at
  runtime.
- Updated dependencies [[`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503), [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/react-lang@0.3.0
  - @openuidev/react-headless@0.14.0
  - @openuidev/react-ui@0.14.0
