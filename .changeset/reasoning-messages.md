---
"@openuidev/react-headless": minor
"@openuidev/react-ui": minor
---

AG-UI reasoning events (`REASONING_MESSAGE_START`/`CONTENT`/`CHUNK`/`END`) now stream into `reasoning` messages in the thread, placed before the assistant output that follows them. `AgentInterface` shows each one as a "Thinking" row in the turn's timeline. The row stays open while the reasoning streams and folds away when a tool call or the answer begins. `openAIMessageFormat` and `langGraphMessageFormat` leave reasoning and activity messages out of outbound history. Before, each became an empty system message.
