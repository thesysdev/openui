---
"@openuidev/server": patch
---

Dashboard `create` and `edit` now send `context.userId` to OpenUI Cloud as `user_id` (and the client's `appId` as `app_id`), instead of minting a frontend token for the user first. One request per call instead of two.
