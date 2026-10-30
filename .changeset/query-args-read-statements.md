---
"@openuidev/lang-core": minor
---

Query and Mutation arguments, tool names, and Query defaults and refresh intervals can use values from other statements (`filters = {region: $region}` then `Query("sales", filters)`). A `$state` read through another statement now triggers a refetch when it changes, the same as one written in the Query itself.
