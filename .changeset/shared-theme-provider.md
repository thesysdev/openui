---
"@openuidev/react-ui": patch
"@openuidev/react-components": patch
---

react-ui and react-components now share one theme provider. react-ui re-exports `ThemeProvider`, `useTheme`, the default themes, swatches and theme hooks from react-components, so a single `ThemeProvider` from either package themes the components of both, including charts, markdown and popups that read the theme in JavaScript. react-ui's exports are unchanged. react-components adds a `@openuidev/react-components/theme` entry with only the theme code, and exports `ThemeContext`.
