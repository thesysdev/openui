# @openuidev/observability-cloud

## 0.0.3

### Patch Changes

- [#1070](https://github.com/thesysdev/openui/pull/1070) [`2fac47a`](https://github.com/thesysdev/openui/commit/2fac47a8274d56e3e315989c6b21fd73832a3ddd) Thanks [@abhithesys](https://github.com/abhithesys)! - `SDK_VERSION` is now derived from package.json at build time instead of a
  hardcoded constant that had drifted (wire envelopes previously reported
  `0.0.1` regardless of the released version).
