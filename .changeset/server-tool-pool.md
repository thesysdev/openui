---
"@openuidev/server": patch
---

Your tools from one script round now run at most 16 at a time, in order, instead of the whole batch at once, and no new tool starts after the run times out or is aborted.
