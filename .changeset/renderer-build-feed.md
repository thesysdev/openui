---
"@openuidev/react-ui": patch
---

`LiveArtifactRenderer` and `StaticArtifactRenderer`: a build's feed. The card and the open dashboard show what a build is doing: "Thinking…", the calls by name, "Building dashboard…", then "Ready", "Stopped" or "Couldn't build". The feed opens to every call with its time, and stays on the card after the build. `Pending` is now a dotted sketch of a dashboard drawn widget by widget; its `shapeColor`, `cardColor`, `borderColor`, `cols` and `rows` props are deprecated and ignored, and `label` replaces the feed with a note.
