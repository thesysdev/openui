---
"@openuidev/lang-core": patch
---

Code fences are matched by line: inline ` ```openui``` ` mentions, code on the opener line, a stray closing fence and ` ```js ` helper blocks no longer lose the program. ` ```openui-js ` blocks are skipped.
