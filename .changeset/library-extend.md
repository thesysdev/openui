---
"@openuidev/lang-core": minor
"@openuidev/react-lang": patch
---

Add `library.extend()`, which derives a new library from an existing one (the base stays untouched): `lib.extend({ components: { add: [ProductCard] }, functions: { add: [percent] }, actions: { add: [copy] } })`. Added components join the library and the prompt lists them, so the model decides where to place them; added functions and actions work like those passed to `createLibrary`. The result equals `createLibrary` of the base parts plus the additions, without the base's public `id`. A name that already exists throws. `override` and `remove` are part of the type but throw "not supported yet" in this release. The typed `onAction` event includes added actions and keeps the built-in events. Create derived libraries once at module scope, since parsers memoize by library identity. In development, react-lang registers each derived library with devtools under its own key.
