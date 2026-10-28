---
"@openuidev/react-ui": patch
---

New `@openuidev/react-ui/cloud` entry for artifacts from OpenUI Cloud: `LiveArtifactRenderer` and `StaticArtifactRenderer` stream an artifact in from an artifact tool's response (or an `id`), run its live data through your interpreter, and show it as a preview card that opens under itself or in your own element, or inline with `preview={false}`. Every part is a slot (`Preview`, `Chrome`, `Content`, `Loading`, `Error`, …) with AgentInterface's omit / props / children modes, and `useArtifactRenderer()` exposes the renderer's state. `onError` gets `Renderer`'s errors plus an `ArtifactError` (`source: "artifact"`) when the artifact can't be shown. The `@openuidev/react-headless` peer window moves to `>=0.18.2`.
