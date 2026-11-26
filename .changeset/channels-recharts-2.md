---
"@openuidev/channels": patch
---

`renderChartPng` (`@openuidev/channels/ui/charts`) needs recharts 2. recharts 3 lays charts out in effects, which never run in `renderToStaticMarkup`, so it rendered an empty chart and `renderChartPng` threw "chart produced no <svg>". That error now says to install `recharts@^2.15`, and the README and docs say recharts 2 is required. The peer range still accepts recharts 3, so apps that use recharts 3 elsewhere and never rasterize charts keep installing cleanly.
