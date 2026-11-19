---
"@openuidev/server": minor
---

Add `openui.artifacts` to list, read, update, delete, pin, unpin, share, and unshare saved artifacts from your server. Without `userId`, a call covers your whole org; with it (and the user's `groupIds`), the call acts as that user and gets what their frontend token would. Artifacts carry `isOwner`, `isEditable`, and, for editors, their `shares`; `list` takes `isOwner`.
