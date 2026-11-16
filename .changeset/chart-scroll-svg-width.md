---
"@openuidev/react-components": patch
---

Bar, line and area charts that scroll sideways keep their full width when the app's CSS has an `svg { max-width: 100% }` reset. Before, the reset squeezed the chart to its box, cutting off the last categories with nothing left to scroll.
