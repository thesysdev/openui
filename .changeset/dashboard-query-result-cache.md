---
"@openuidev/react-headless": patch
"@openuidev/react-ui": patch
---

A dashboard shows its last results while it reloads. Pass `cacheQueryResults: false` to `cloudArtifactStorage` to turn this off. `ArtifactStorage` gets two optional methods for this, `getQueryResults` and `putQueryResult`.
