---
"@openuidev/react-ui": patch
---

Share one `ThemeContext` across every entry. A `ThemeProvider` rendered from `@openuidev/react-ui` now themes `useTheme` and themed components imported from `@openuidev/react-ui/genui-lib` or a component subpath such as `@openuidev/react-ui/ThemeProvider`, in ESM and CJS alike; before, each bundle created its own context and silently fell back to the default theme. Component subpaths also load under Node's ESM loader now: their `import` condition points at a bundled `.mjs` build instead of tsc output with extensionless imports.
