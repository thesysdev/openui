---
"@openuidev/react-ui": patch
---

`LiveArtifactRenderer` and `StaticArtifactRenderer`: a build's feed. The card and the open dashboard show one animated line saying what a build is doing now: "Thinking…", the calls by name, then "Building dashboard…". `Pending` is now a dotted sketch of a dashboard drawn widget by widget; its `shapeColor`, `cardColor`, `borderColor`, `cols` and `rows` props are deprecated and ignored, and `label` replaces the feed with a note. `useArtifactRenderer()` gains `isEditing`: a new version is streaming in over the one on screen.
