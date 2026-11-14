---
"@openuidev/react-ui": patch
---

The OpenUI Lang `ScatterChart` now shows its `xLabel` and `yLabel`. The prompt offered both arguments, but the component never passed them to the chart, so the labels were dropped.
