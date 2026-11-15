---
"@openuidev/react-lang": patch
---

Fix `ElementErrorBoundary` re-presenting stale children after a render error, which could crash the host app with a commit-phase `NotFoundError: insertBefore` during streaming or re-renders. The boundary now unmounts the failing subtree and recovers on the next valid render, instead of re-inserting element instances React has already reconciled.
