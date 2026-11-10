---
"@openuidev/react-headless": patch
"@openuidev/react-ui": patch
---

An open dashboard follows edits: the artifact stream records the versions it delivers, a reopened panel waits for the newer version before running its queries, and a query refused for an old version (`ARTIFACT_VERSION_MISMATCH`) runs again instead of showing an error, after one re-read shared by every renderer of the artifact. `useArtifactStream` gets `reportVersionMismatch`, and `onSettle` gets a `detail` with the error's code and the artifact id and version the call ran with.
