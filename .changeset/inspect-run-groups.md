---
"@openuidev/devtools": patch
"@openuidev/observability-cloud": patch
"@openuidev/react-headless": patch
"@openuidev/react-lang": patch
"@openuidev/react-ui": patch
---

Group OpenUI Inspect events by LLM run, with the user's prompt as the group title and request, response, and stream details shown together. Expand groups and settled stream details when errors arrive.

Carry the run ID and title through assistant messages. Standalone users can wrap their renderers in `RendererDevtoolsProvider` and supply `run={{ id, title }}` once to group rendered responses in Inspect without additional instrumentation. AgentInterface provides the run around each turn, including custom message and tool renderers. A Renderer can override the inherited run with `devtools={{ run: { id, title } }}`. Keep distinct renderer streams in the same group, preserve the run metadata across assistant message segments, and avoid duplicate stream identities when unchanged historical content is marked streaming again.
