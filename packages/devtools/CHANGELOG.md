# @openuidev/devtools

## 0.1.3

### Patch Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - Internal `@openuidev/*` peer dependencies now declare bounded
  tested-compatibility ranges (e.g. `">=0.3.0 <0.4.0"`) instead of `workspace:`
  ranges, so a mismatched pair is caught at install time instead of failing at
  runtime.
- Updated dependencies [[`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/react-lang@0.3.0
