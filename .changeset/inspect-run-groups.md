---
"@openuidev/devtools": patch
"@openuidev/observability-cloud": patch
"@openuidev/react-headless": patch
"@openuidev/react-lang": patch
"@openuidev/react-ui": patch
---

Group OpenUI Inspect events by LLM run, with the user's prompt as the group title and request, response, and stream details shown together. Expand groups and settled stream details when errors arrive.

Carry the run identity through assistant messages. Standalone `Renderer` users can pass `devtools={{ run: { id, title } }}` to group rendered responses in Inspect without additional instrumentation. Keep distinct renderer streams in the same group, preserve the run identity across assistant message segments, and avoid duplicate stream identities when unchanged historical content is marked streaming again.
