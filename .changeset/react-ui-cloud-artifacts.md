---
"@openuidev/react-ui": patch
---

New `@openuidev/react-ui/cloud` entry for artifacts from OpenUI Cloud: `LiveArtifactRenderer` and `StaticArtifactRenderer` stream an artifact in from an artifact tool's response (or an `id`), run its live data through your interpreter, and show it as a preview card that opens in an overlay or your own element, or inline with `preview={false}`. Every part is a slot (`Preview`, `Chrome`, `Content`, `Loading`, `Error`, …) with AgentInterface's omit / props / children modes, and `useArtifactRenderer()` exposes the renderer's state. `useArtifactList()` lists, pins and deletes artifacts, and `createArtifactRenderer()` builds a renderer around your own viewer. The `@openuidev/react-headless` peer window moves to `>=0.18.2` and `@openuidev/react-lang` to `>=1.0.2`.
