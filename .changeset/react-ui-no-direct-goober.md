---
"@openuidev/react-ui": patch
---

The artifact renderer, pending loader and agent-interface styles now use `css` and `keyframes` from `@openuidev/react-components` instead of importing goober directly, so they go into react-components' shared style sheet (`#openui-styles`) rather than a separate `_goober` tag. An app that calls `configureStyles({ layer })` now gets these styles in that cascade layer too, like the rest of the components. react-ui no longer depends on `goober`.
