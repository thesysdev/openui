# @openuidev/lang-core

## 0.3.2

### Patch Changes

- [#1287](https://github.com/thesysdev/openui/pull/1287) [`7c8f5e9`](https://github.com/thesysdev/openui/commit/7c8f5e9ae2e914063f7b47fc131fd46a7e178985) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Report data (an object, array, string, number or boolean) in a slot that only takes components as a `type-mismatch` and prune it, instead of passing it through to render as a blank component or stray text. Slots whose schema also allows data are unchanged.

## 0.3.1

### Patch Changes

- [#1140](https://github.com/thesysdev/openui/pull/1140) [`55df79c`](https://github.com/thesysdev/openui/commit/55df79c2ff645b4c24b03be9c798f57cdf36dd99) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Fix streaming parsing so the latest definition of a repeated statement ID renders progressively as it arrives, matching how new statements stream. Completed programs use the last definition, matching the non-streaming parser.

## 0.3.0

### Minor Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - Adopt automated release management via changesets. The lang-family packages
  (`lang-core`, `react-lang`, `svelte-lang`, `vue-lang`) now version together as
  a fixed group; this release unifies them on a single version line.
