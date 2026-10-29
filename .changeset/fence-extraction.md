---
"@openuidev/lang-core": patch
---

Code fences: a fence opens and closes on lines that start with ` ``` `, so an inline ` ```openui``` ` mention in prose no longer swallows the real fence after it. Code on the opener's line (` ```openui root = ... `) is kept. ` ```openui-js ` script blocks are skipped. A program written outside fences now renders when the fences around it hold no program, such as a lone closing fence after the program or ` ```js ` helper blocks.
