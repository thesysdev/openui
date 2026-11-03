---
"@openuidev/react-headless": patch
---

Stream OpenUI Cloud artifacts into any renderer. `ArtifactStorage` gains an optional `stream(id)` method, which `useOpenuiCloudStorage`'s artifact storage implements over SSE: every connection starts from the artifact's whole program, so a reconnect picks up where it is. New `<OpenUICloudProvider token>` connects `@openuidev/react-ui/cloud`'s renderers to OpenUI Cloud outside `ChatProvider`. `ArtifactStorage` also gains optional `pin`, `unpin` and `delete`, which the cloud storage implements; summaries say whether they're `pinned`, and `list` filters by it. `update` can take a `title` to rename an artifact, with or without new `content`. Existing exports are unchanged.
