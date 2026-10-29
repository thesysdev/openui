---
"@openuidev/a2ui": minor
---

Compile OpenUI Lang to standard A2UI. `createA2UIStream` and `compileToA2UI` turn OpenUI Lang, limited to what an A2UI catalog can express, into A2UI v1.0 or v0.9 messages with component JSON objects, so A2UI's own renderers can draw them. `a2uiPromptOptions()` keeps a model to that subset, and `openUIToExpress` and `expressToOpenUI` translate between OpenUI Lang and A2UI Express.
