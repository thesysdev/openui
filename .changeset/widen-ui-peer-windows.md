---
"@openuidev/react-ui": patch
"@openuidev/assistant-ui": patch
---

Widen the internal `react-headless`/`react-ui` peer windows to include the
0.16.x line, fixing an install-time peer mismatch where these packages
required a `react-headless`/`react-ui` version older than the one they ship
against.
