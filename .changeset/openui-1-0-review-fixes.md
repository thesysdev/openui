---
"@openuidev/lang-core": patch
"@openuidev/react-ui": patch
"@openuidev/a2ui": patch
"@openuidev/assistant-ui": patch
"@openuidev/devtools": patch
"@openuidev/react-email": patch
---

OpenUI 1.0 review fixes:

- lang-core: the built-in functions prompt no longer uses react-ui's `Col` in its `@Each` example, and names Query only when tool calls are on.
- lang-core: `JSONSchemaDef` adds `type` and `anyOf`, so the CLI's spec for a library that uses `action()` passes to `generateSystemPrompt` without a cast.
- react-ui: the chat prompt's button rules name `@ToAssistant` and `@OpenUrl`.
- react-ui, a2ui, assistant-ui, devtools, react-email: the `@openuidev/react-lang` peer window now covers the version this release publishes.
