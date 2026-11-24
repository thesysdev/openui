---
"@openuidev/react-ui": patch
---

`LiveArtifactRenderer` and `StaticArtifactRenderer`: one status everywhere. The card, the bar and the pending skeleton show the same line, and a build names its tools and scripts in words ("Calling list orders…", "Writing and testing revenue by day…"). The card's status is a pill in the theme's colors, and a new `PreviewError` part shows the error there. The open dashboard drops its second loading pill, its bar's loader waits while `Pending` shows, and a long error message wraps inside the alert.
