---
"@openuidev/react-ui": patch
---

`Accordion` now opens its first item when it mounts with every item already present, instead of the last. While streaming it still opens each new item, and it keeps that item open while the item's `value` is still streaming in.
