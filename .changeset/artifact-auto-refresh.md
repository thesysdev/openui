---
"@openuidev/react-headless": patch
"@openuidev/react-ui": patch
---

Open artifacts stay current. While shown, a renderer checks every 30 seconds (`pollInterval`, at least 10s, `false` to turn off) for a newer version, a rename, or a change to the user's access, and pauses while the tab is hidden. A newer version streams in live as it's generated, the same way the person editing sees it, without losing filters; a failed edit goes back to the version before it; and the new `EditedNotice` slot says "Edited just now" once it's done. A deleted or unshared artifact shows its error and leaves every list until it's shared again. `useArtifactRenderer()` adds `isOwner`, `isEditable`, and `justEdited`. Saving content with `useArtifactUpdate` loads the new version in every renderer at once. `ArtifactStorage.stream` takes `fetchLatest` and can answer `unchanged`, and artifacts carry their `version`.
