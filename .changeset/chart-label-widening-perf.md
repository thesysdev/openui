---
"@openuidev/react-ui": patch
---

Scrolling `BarChart`, `AreaChart` and `LineChart` lay out long category lists faster: only a label that widens the categories is measured in full, so the layout stays cheap as a long chart streams in. Widened categories are sized to the exact label width.
