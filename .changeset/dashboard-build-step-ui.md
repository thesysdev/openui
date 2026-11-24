---
"@openuidev/react-ui": patch
---

The artifact renderer's `Pending` skeleton now stays up through a dashboard's build, until the dashboard starts streaming, instead of ending when the tool returns. Its note says what the build is doing: "Reading your data" while it calls tools, "Preparing your data" while it saves scripts. The card's, bar's and content's loaders say the same, which covers edits too. The card's status text shimmers, and a new status drifts in, except under reduced motion. `useArtifactRenderer()` adds `step`, and `isPending` now also covers a build that hasn't started writing.
