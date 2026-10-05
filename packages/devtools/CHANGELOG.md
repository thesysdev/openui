# @openuidev/devtools

## 0.2.2

### Patch Changes

- [#1207](https://github.com/thesysdev/openui/pull/1207) [`1b1f3ba`](https://github.com/thesysdev/openui/commit/1b1f3ba95ace51402b0104a47a37a7391e6e8f23) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Split the reliability banner CTA into a primary "Get API key" button linking to the Thesys Console and a secondary "View docs" button.

- [#1208](https://github.com/thesysdev/openui/pull/1208) [`21d8df3`](https://github.com/thesysdev/openui/commit/21d8df3f9cbce6201871f26c7d3479648a7e8c9f) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Bundle Inter (latin variable subset) with the devtools widget so it renders in Inter regardless of the host app's fonts, instead of silently falling back to the system font.

## 0.2.1

### Patch Changes

- [#1172](https://github.com/thesysdev/openui/pull/1172) [`6de371d`](https://github.com/thesysdev/openui/commit/6de371d4e8ffe9f1e07023899afa4f8212e297ab) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Add dismissible local deployment prompts and align Inspect card spacing.

## 0.2.0

### Minor Changes

- [#1159](https://github.com/thesysdev/openui/pull/1159) [`0a46d6f`](https://github.com/thesysdev/openui/commit/0a46d6f2b665adcf677d7ab87b78800703e65809) Thanks [@abhithesys](https://github.com/abhithesys)! - Internal peer dependencies now declare bounded tested-compatibility ranges:
  `@openuidev/react-lang` requires `">=0.3.0 <0.4.0"`. Minor (breaking) rather
  than patch on purpose: react-lang 0.2.x depends on devtools with `^0.1.0`, so
  a 0.1.x release would be pulled into existing react-lang 0.2.x installs and
  fail them with an unsatisfiable peer. Bumping to 0.2.0 keeps old react-lang
  paired with old devtools; react-lang >=0.3.0 picks up the new line.

### Patch Changes

- Updated dependencies [[`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/react-lang@0.3.0
