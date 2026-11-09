---
"@openuidev/react-headless": patch
"@openuidev/react-ui": patch
---

An open dashboard follows edits: the artifact stream records the versions it delivers, a reopened panel waits for the newer version before running its queries, and a query refused for an old version (`ARTIFACT_VERSION_MISMATCH`) reads the dashboard again and re-runs instead of showing an error. The artifact's store runs that recovery once for every renderer showing it: `useArtifactStream` gets `reportVersionMismatch`, `reportDataSuccess`, `rerun` and `versionMismatch`. New: `InterpreterError`, and `onSettle` gets a `detail` with the error code and the version the call ran against.
