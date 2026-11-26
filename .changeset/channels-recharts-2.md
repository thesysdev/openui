---
"@openuidev/channels": patch
---

The chart rasterizer at `@openuidev/channels/ui/charts` now declares `recharts@^2.15.0` as its peer instead of `^2.15.0 || ^3.0.0`. recharts 3 lays charts out in effects, which never run in `renderToStaticMarkup`, so it rendered an empty chart and `renderChartPng` threw "chart produced no <svg>". That error now says to install recharts 2.
