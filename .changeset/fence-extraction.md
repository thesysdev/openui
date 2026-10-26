---
"@openuidev/lang-core": patch
---

Code fences: an inline ```` ```openui``` ```` mention in prose no longer swallows the real fence after it, a one-line fence (```` ```openui root = ...``` ````) renders, and a program followed by a lone closing fence renders instead of showing nothing. A fence opener after prose on the same line keeps working.
