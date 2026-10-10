# @openuidev/react-lang

## 0.4.1

### Patch Changes

- [#1349](https://github.com/thesysdev/openui/pull/1349) [`05c1b25`](https://github.com/thesysdev/openui/commit/05c1b2500275711155625d1056f46a8222b954e2) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Fix form fields without reactive bindings appearing frozen after typing or restoring saved state. Propagate form-store updates through Renderer slots even when the evaluated UI tree is unchanged, and include the fix in the browser bundle.
- Updated dependencies []:
  - @openuidev/lang-core@0.4.1

## 0.4.0

### Minor Changes

- [#1268](https://github.com/thesysdev/openui/pull/1268) [`f1f66c4`](https://github.com/thesysdev/openui/commit/f1f66c4266d6d76d73b94530b32653fecd1f6c01) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Add optional Renderer slots for content, query loading, errors, and retry controls. Keep `queryLoader` supported on `Renderer` and `A2UIRenderer`. Preserve the default loading spinner; error/retry views render nothing unless supplied by the application.

  Preserve the existing query lifecycle while waiting for generation to finish. Keep mounted input state through retries and refresh query results when generated scripts change.

### Patch Changes

- Updated dependencies [[`497681e`](https://github.com/thesysdev/openui/commit/497681eefecf7d61b863e98af7dec98555941cf8)]:
  - @openuidev/devtools@0.2.3
  - @openuidev/lang-core@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`7c8f5e9`](https://github.com/thesysdev/openui/commit/7c8f5e9ae2e914063f7b47fc131fd46a7e178985)]:
  - @openuidev/lang-core@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies [[`55df79c`](https://github.com/thesysdev/openui/commit/55df79c2ff645b4c24b03be9c798f57cdf36dd99)]:
  - @openuidev/lang-core@0.3.1

## 0.3.0

### Minor Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - Adopt automated release management via changesets. The lang-family packages
  (`lang-core`, `react-lang`, `svelte-lang`, `vue-lang`) now version together as
  a fixed group; this release unifies them on a single version line.

### Patch Changes

- Updated dependencies [[`0a46d6f`](https://github.com/thesysdev/openui/commit/0a46d6f2b665adcf677d7ab87b78800703e65809), [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/devtools@0.2.0
  - @openuidev/lang-core@0.3.0
