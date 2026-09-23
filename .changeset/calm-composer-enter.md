---
"@openuidev/react-ui": patch
---

Prevent Enter from submitting either built-in composer while IME composition is active, including browsers that report the keyCode 229 fallback. Enter after composition finishes still submits, and Shift+Enter continues to insert a newline.
