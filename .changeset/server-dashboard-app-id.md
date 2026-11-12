---
"@openuidev/server": patch
---

Dashboard `create` and `edit` send the client's `appId` as `app_id` again, next to `user_id`, as the frontend token 0.4.1 minted carried it. With an `appId` set, dashboards made before 0.4.2 stay editable, and frontend tokens minted with that `appId` can open new ones.
