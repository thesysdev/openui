---
"@openuidev/react-headless": patch
"@openuidev/react-ui": patch
---

An open dashboard keeps showing its data while an edit streams in. Until now the renderer told its library the program was still being written, so every query read as loading and KPIs and charts turned into skeletons until the new version arrived. `useArtifactStream` now returns `isEditing`, which is `true` while a newer version streams in behind the one on screen, from the edit's tool response on. The renderer passes `isStreaming` to the content only while the program on screen is still being written. `useArtifactRenderer().isStreaming` is unchanged, so loaders still show the edit.
