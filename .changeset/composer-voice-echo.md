---
"@openuidev/react-ui": patch
---

Fix Windows Voice Typing leaving duplicate or reappearing text in both built-in composers. The first Enter now commits exactly one copy and stops the session, the second Enter sends it, Send snapshots the committed draft, and late composition echoes are swallowed so the cleared draft stays clear.
