---
"@openuidev/devtools": patch
"@openuidev/observability-cloud": patch
"@openuidev/react-headless": patch
"@openuidev/react-lang": patch
"@openuidev/react-ui": patch
---

Group OpenUI Inspect events by LLM run, with the user's prompt as the group title and request, response, and stream details shown together. Expand groups and settled stream details when errors arrive.

Carry `runId` through assistant messages and renderer observability events. Standalone `Renderer` users can pass `runId` and emit matching request and response events to enable grouping. Preserve the ID across assistant message segments and avoid duplicate stream identities when unchanged historical content is marked streaming again.
