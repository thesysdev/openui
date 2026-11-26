---
"@openuidev/react-ui": minor
---

`LiveArtifactRenderer` and `StaticArtifactRenderer`: a build's feed. The card and the open dashboard show one animated line saying what a build is doing now: "Thinking…", the calls by name, then "Building dashboard…". `Pending` is now a dotted sketch of a dashboard drawn widget by widget, and `label` replaces the feed with a note. **Breaking:** `Pending` and `PendingLoader` no longer take `shapeColor`, `cardColor`, `borderColor`, `cols` or `rows`; the sketch is drawn in `color` and follows the area's width. `useArtifactRenderer()` gains `isEditing`: a new version is streaming in over the one on screen.
