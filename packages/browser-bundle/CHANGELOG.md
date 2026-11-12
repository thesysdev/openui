# @openuidev/browser-bundle

## 0.2.2

### Patch Changes

- [#1480](https://github.com/thesysdev/openui/pull/1480) [`eaac246`](https://github.com/thesysdev/openui/commit/eaac2468cb7248f69bcd2097c017a40ac5280868) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Bundles @openuidev/react-lang and @openuidev/lang-core 1.1.
- Updated dependencies [[`eaac246`](https://github.com/thesysdev/openui/commit/eaac2468cb7248f69bcd2097c017a40ac5280868), [`eaac246`](https://github.com/thesysdev/openui/commit/eaac2468cb7248f69bcd2097c017a40ac5280868)]:
  - @openuidev/react-lang@1.1.0

## 0.2.1

### Patch Changes

- [#1394](https://github.com/thesysdev/openui/pull/1394) [`5186585`](https://github.com/thesysdev/openui/commit/51865854eb16e259089b736bf480b10b2e42b2ad) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Update the README for OpenUI Lang 1.0: working snippets and links to the new docs pages.
- Updated dependencies [[`86da07f`](https://github.com/thesysdev/openui/commit/86da07f6266887ff819cd5a8e295c75b2edc8251), [`5186585`](https://github.com/thesysdev/openui/commit/51865854eb16e259089b736bf480b10b2e42b2ad)]:
  - @openuidev/react-ui@0.18.1
  - @openuidev/react-lang@1.0.1

## 0.2.0

### Minor Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI Lang 1.0.

  - Upgrade `@openuidev/lang-core` and `@openuidev/react-lang` together, and together with the server that generates the system prompt. A 1.0 prompt teaches bare action steps (`@ToAssistant("Hi")` without `Action([...])`), which a 0.x client does not run.
  - react-ui 0.18 requires react-lang 1.0 (peer `>=1.0.0 <2.0.0`); upgrade them together.
  - browser-bundle 0.2 bundles react-lang 1.0 and react-ui 0.18.
  - server 0.3 uses lang-core 1.0 for autofix (parser and system prompt); stay on server 0.2 with a 0.x client. Autofix ignores warnings and accepts a ternary entry, so a program that renders does not start a fix round.
  - vue-lang, svelte-lang and angular-lang stay on 0.4 (OpenUI Lang 0.x). Keep `@openuidev/lang-core` ^0.4 for the prompts they render.
  - A program whose `root` statement is written last shows nothing while it streams, until the `root` line arrives. Write `root` first, as the system prompt asks.
  - A cut-off output that never reached its `root` statement, or any statement calling the root component, now renders blank instead of a partial tree.

### Patch Changes

- Updated dependencies [[`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2)]:
  - @openuidev/react-lang@1.0.0
  - @openuidev/react-ui@0.18.0

## 0.1.7

### Patch Changes

- [#1349](https://github.com/thesysdev/openui/pull/1349) [`05c1b25`](https://github.com/thesysdev/openui/commit/05c1b2500275711155625d1056f46a8222b954e2) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Fix form fields without reactive bindings appearing frozen after typing or restoring saved state. Propagate form-store updates through Renderer slots even when the evaluated UI tree is unchanged, and include the fix in the browser bundle.
- Updated dependencies [[`05c1b25`](https://github.com/thesysdev/openui/commit/05c1b2500275711155625d1056f46a8222b954e2)]:
  - @openuidev/react-lang@0.4.1

## 0.1.6

### Patch Changes

- Updated dependencies [[`f1f66c4`](https://github.com/thesysdev/openui/commit/f1f66c4266d6d76d73b94530b32653fecd1f6c01), [`497681e`](https://github.com/thesysdev/openui/commit/497681eefecf7d61b863e98af7dec98555941cf8)]:
  - @openuidev/react-lang@0.4.0
  - @openuidev/react-ui@0.17.1

## 0.1.5

### Patch Changes

- Updated dependencies [[`d51a09c`](https://github.com/thesysdev/openui/commit/d51a09cd4ed9639f5e606a9c07faef352672a164), [`301d668`](https://github.com/thesysdev/openui/commit/301d66856835a81211628212f11833fe56a57dd4), [`dd4f450`](https://github.com/thesysdev/openui/commit/dd4f45074ac50b59d78e2855bd203e0e0562c95b)]:
  - @openuidev/react-ui@0.17.0
  - @openuidev/react-lang@0.3.1

## 0.1.4

### Patch Changes

- Updated dependencies [[`5cde7c3`](https://github.com/thesysdev/openui/commit/5cde7c36ccd419570dd6b2653fc88dc4f6471964)]:
  - @openuidev/react-ui@0.16.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`b4aa87c`](https://github.com/thesysdev/openui/commit/b4aa87cb2d0bc32434cec806658286a8744cd514), [`8e0d1c8`](https://github.com/thesysdev/openui/commit/8e0d1c81bdbbd24647cad61a98e345f2f0de40bd)]:
  - @openuidev/react-ui@0.15.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503), [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/react-lang@0.3.0
  - @openuidev/react-ui@0.14.0
