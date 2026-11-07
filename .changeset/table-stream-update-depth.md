---
"@openuidev/react-ui": patch
---

A streaming `Table` no longer trips React's "Maximum update depth exceeded" when a burst of chunks arrives at once. The scroll controls are measured when the table mounts and whenever the table or its container resizes, instead of on every render.
