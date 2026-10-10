---
"@openuidev/react-lang": patch
"@openuidev/browser-bundle": patch
---

Fix form fields without reactive bindings appearing frozen after typing or restoring saved state. Propagate form-store updates through Renderer slots even when the evaluated UI tree is unchanged, and include the fix in the browser bundle.
