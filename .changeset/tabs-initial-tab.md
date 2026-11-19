---
"@openuidev/react-ui": patch
---

`Tabs` now opens on its first tab when it mounts with every tab already present, whether the response is static or a stream delivered it in one chunk. It follows the tab the model is writing into only while the response streams, so a `Query` that resolves inside another tab afterwards no longer switches tabs.
