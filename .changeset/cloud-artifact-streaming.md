---
"@openuidev/react-headless": patch
---

Stream OpenUI Cloud artifacts into any renderer. `ArtifactStorage` gains an optional `stream(id)` method, which `useOpenuiCloudStorage`'s artifact storage implements over SSE, resuming with `Last-Event-ID`. The new `useArtifactStream({ id, version })` hook shares one stream per artifact across every component showing it, keeps the current version on screen while an edit streams in, and falls back to `get(id)` for storages without `stream`. Also new: `parseArtifactReference()` to read an artifact tool's response, `createInterpreterToolProvider()` to run an artifact's `Query()` calls through your interpreter, and `<OpenUICloudProvider token>` to connect renderers to OpenUI Cloud outside `ChatProvider`. `ArtifactStorage` also gains optional `pin`, `unpin` and `delete`, which the cloud storage implements; summaries say whether they're `pinned`, and `list` filters by it. Existing exports are unchanged.
