---
"@openuidev/react-headless": patch
"@openuidev/react-ui": patch
---

Open artifacts stay current. While shown, a renderer checks every 30 seconds (`pollInterval` on `OpenUICloudProvider` or the renderer, at least 3s, `false` to turn off) for a newer version, a rename, or a change to the user's access, and pauses while the tab is hidden. A newer version streams in live as it's generated, the same way the person editing sees it, without losing filters; a failed edit goes back to the version before it; and the new `EditedNotice` slot says "Edited just now" once it's done. A deleted or unshared artifact clears, shows its error in the middle, and leaves every list. It keeps checking, less often each time, and comes back if it's shared again. `useArtifactRenderer()` adds `isOwner`, `isEditable`, and `justUpdated`. Saving content with `useArtifactUpdate` loads the new version in every renderer at once. `ArtifactStorage.stream` takes `fetchLatest` and can answer `unchanged`, and artifacts carry their `version`. While an artifact is pending, the chrome bar no longer shows its own loader next to `Pending`'s.
