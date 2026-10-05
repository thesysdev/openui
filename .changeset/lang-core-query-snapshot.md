---
"@openuidev/lang-core": patch
---

Query manager: skip the JSON comparison of the query snapshot when every value is the same object as before, so re-evaluating unchanged queries on each state change no longer stringifies all query data.
