---
"@openuidev/react-headless": patch
"@openuidev/react-ui": patch
---

Artifacts can be shared with a user, a group, or everyone in their app, to view or edit. `useArtifactShares(id)` reads an artifact's shares, and `useArtifactShare()` and `useArtifactUnshare()` change them, showing the change at once and reverting if it fails. `useArtifactList` lists the artifacts shared with the user too, and takes `isOwner` to show only theirs (`true`) or only shared ones (`false`). Artifacts carry `isOwner`, `isEditable`, and, for users who can edit them, `shares`; `pinned` is now the user's own pin. `ArtifactStorage` gets two optional methods for this, `share` and `unshare`, and `cloudArtifactStorage` implements them.
