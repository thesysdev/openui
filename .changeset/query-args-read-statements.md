---
"@openuidev/lang-core": minor
---

Query and Mutation arguments can read other statements (`filters = {region: $region}` then `Query("sales", filters)`), and a `$state` read that way refetches on change.
