# @openuidev/react-headless

## 0.16.3

No changes in this release.

## 0.16.2

No changes in this release.

## 0.16.1

No changes in this release.

## 0.16.0

No changes in this release.

## 0.15.0

### Patch Changes

- [#1179](https://github.com/thesysdev/openui/pull/1179) [`bad6e49`](https://github.com/thesysdev/openui/commit/bad6e492b38bfb1da05e6e6976ae6a23244a4af0) Thanks [@vishxrad](https://github.com/vishxrad)! - Export `useOpenuiCloudStorage`, `OpenuiCloudOptions`, and `OpenuiCloudFeatures` from `@openuidev/react-headless`, also available through `@openuidev/react-ui`. Cloud storage no longer requires importing the hook from `@openuidev/thesys`. The existing options, frontend-token refresh and retry behavior, conversation history, and optional artifact storage are preserved.

## 0.14.0

### Minor Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - Adopt automated release management via changesets. `react-headless` and
  `react-ui` now version together as a fixed group; this release unifies them on
  a single version line.
