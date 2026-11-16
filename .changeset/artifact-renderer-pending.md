---
"@openuidev/react-ui": patch
---

`LiveArtifactRenderer` and `StaticArtifactRenderer` can mount before the tool returns: without `response`, `id` or `content` they're pending instead of showing "This response doesn't reference an artifact.", and `useArtifactRenderer()` reports `isPending`. The new `Pending` slot shows a skeleton dashboard that rearranges itself under a note; it takes `label`, `color`, `shapeColor`, `cardColor` and `borderColor`, or children to replace it. `defineLiveArtifactRenderer` shows the card and panel as soon as a dashboard tool call starts.
