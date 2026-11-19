---
"@openuidev/react-ui": patch
---

`useArtifactList` keeps showing its current list while `refresh()` reloads it, and swaps in the first page when it arrives. Lists filtered by `pinned` used to show every cached artifact, in the cache's order, during a refresh, so the list reshuffled and settled back.
