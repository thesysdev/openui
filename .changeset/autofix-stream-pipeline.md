---
"@openuidev/server": minor
---

Add `createAutofix` to validate and repair completed or streaming OpenUI output.
Select `openAIAdapter` (the default), `responsesAdapter`, or `vercelAIAdapter` to preserve the model's
stream protocol, append the complete corrected program as native text deltas,
and keep completion snapshots consistent while preserving tool calls and metadata.
The Vercel AI SDK 7 adapter accepts `toUIMessageStream({ stream: result.stream })` output and returns AI SDK UI message SSE.
Export the `Adapter<Input, Output>` type for writing custom stream adapters.
