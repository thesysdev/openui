---
"@openuidev/server": minor
---

Add `openui.artifacts` to list, read, update, delete, pin, and unpin saved artifacts from your server. Without `userId`, a call covers your whole org; with it, the call acts as that user and gets what their frontend token would. Failed calls also read a top-level `code` from OpenUI Cloud's error body.
