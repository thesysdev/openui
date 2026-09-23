---
"@openuidev/react-ui": patch
---

Reset the textarea after submitting a draft that used IME composition so late dictation input events cannot restore the sent text. Apply the reset to both built-in composers, including controlled welcome drafts, while preserving focus and ordinary typing behavior.
