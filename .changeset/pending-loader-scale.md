---
"@openuidev/react-ui": patch
---

The pending loader keeps its shape at any size: it scales to fit, like an SVG, instead of stretching its cards on a wide or tall space. It also fits a space shorter than 400px instead of overflowing it. `Pending` also takes `cols` and `rows` to fix its grid.
