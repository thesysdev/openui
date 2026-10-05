---
"@openuidev/react-lang": patch
---

Build the library JSON schema used to enrich parser errors once per library instead of on every error pass (it took about 1 ms for the react-ui library on each state change while parse errors existed).
