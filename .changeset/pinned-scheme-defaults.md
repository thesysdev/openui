---
"@openuidev/react-ui": minor
---

Adds `@openuidev/react-ui/defaults-light.css` and `@openuidev/react-ui/defaults-dark.css`: complete, scheme-pinned token sets in a plain unlayered `:root` block with no `prefers-color-scheme` guard. `defaults.css` only applies the dark tokens under `@media (prefers-color-scheme: dark)`, so an app that forces `<ThemeProvider mode="dark">` rendered the stock light tokens on devices whose system scheme is light. Import `defaults-dark.css` (or `defaults-light.css`) instead of `defaults.css` to pin the scheme.
