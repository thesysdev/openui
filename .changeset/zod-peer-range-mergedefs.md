---
"@openuidev/lang-core": patch
"@openuidev/react-lang": patch
"@openuidev/react-ui": patch
"@openuidev/vue-lang": patch
"@openuidev/svelte-lang": patch
"@openuidev/angular-lang": patch
"@openuidev/a2ui": patch
"@openuidev/assistant-ui": patch
"@openuidev/react-email": patch
"@openuidev/dashboard-library": patch
"@openuidev/react-components": patch
---

The `zod` peer range is now `^4.0.17`, previously `^3.25.0 || ^4.0.0`. `lang-core` calls `z.util.mergeDefs` from `zod/v4/core`, which first shipped in zod 4.0.17. With zod 3.25.x or 4.0.0 to 4.0.16, OpenUI installed without a warning and then failed at build time (`'util'.'mergeDefs' is not exported from 'zod/v4/core'`). Those versions now get a peer dependency warning at install time instead.
