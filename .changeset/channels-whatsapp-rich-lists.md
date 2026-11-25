---
"@openuidev/channels": minor
---

WhatsApp: `Option` takes an optional `description` (the second line of a list row), `Select` takes an optional `header` and `footer`, and `Card` takes an optional `footer`. `Chart` takes an optional `caption`, and chart captions are now sent inside `image.caption`, where the Cloud API reads them. New `typingIndicator(messageId)` builds the request that marks a message as read and shows "typing…". `Card` takes an optional `image` (a photo shown above the text), and the new `Location(latitude, longitude, name?, address?)` component sends a native map pin. `renderChartPng` takes an optional `{ theme: "dark" }`.
