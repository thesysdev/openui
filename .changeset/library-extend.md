---
"@openuidev/lang-core": minor
"@openuidev/react-lang": patch
---

Add `library.extend()`, which derives a new library from an existing one (the base stays untouched): `lib.extend({ components: { add: [ProductCard], remove: ["Image"] }, functions: { add: [percent] }, actions: { add: [copy] } })`. Components support `add` (to the library only, or into content slots with `{ component, slots: ["Card"] }` or `"Card.children"`), `override` (every parent points at the replacement) and `remove` (dropped from every parent union and from `componentGroups`; removing the root or a slot's only type throws, and a removed name still in prompt notes, examples or rules warns once). Added functions and actions work like those passed to `createLibrary`. The result has no public `id`. Adding a name that already exists throws. The typed `onAction` event includes added actions and keeps the built-in events. Create derived libraries once at module scope, since parsers memoize by library identity. In development, react-lang registers each derived library with devtools under its own key.
