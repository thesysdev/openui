---
"@openuidev/server": patch
---

Dashboard `create` and `edit` now send `context.userId` to OpenUI Cloud as `user_id`, instead of minting a frontend token for the user first. One request per call instead of two. The client's `appId` is no longer attached to dashboards.
