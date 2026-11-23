---
"@openuidev/react-headless": patch
---

The artifact stream now reads the `step` event a dashboard's build sends while it calls data tools and saves scripts. `useArtifactStream` returns it as `step: { tools, scripts }` until the dashboard starts writing, and the new `ArtifactBuildStep` type describes it. Custom storages may yield `step` events too; ones that don't work as before.
