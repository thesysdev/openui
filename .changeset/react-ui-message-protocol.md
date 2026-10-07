---
"@openuidev/react-ui": patch
---

The chat components read and write stored messages with `parseMessage` and `buildMessage` from react-lang instead of their own marker parser. Stored bytes are unchanged, and older messages in the `<content>`/`<context>` XML envelope still read. A complete message whose content ends in `]` (or any other start of a marker) is no longer cut short, and `]]>openui:end` text in the middle of a line stays in the content.
