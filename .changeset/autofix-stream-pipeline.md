---
"@openuidev/server": minor
---

Add `createAutofix` to validate and repair completed or streaming OpenUI output.
Select `chatCompletionsAdapter` or `responsesAdapter` to preserve the model's
stream protocol, append the complete corrected program as native text deltas,
and keep completion snapshots consistent while preserving tool calls and metadata.
