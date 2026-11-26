# @openuidev/channels

## 0.2.0

### Minor Changes

- [#1724](https://github.com/thesysdev/openui/pull/1724) [`c30e80e`](https://github.com/thesysdev/openui/commit/c30e80ebf307af97d940901b4a44133eca668d19) Thanks [@vishxrad](https://github.com/vishxrad)! - WhatsApp: `Option` takes an optional `description` (the second line of a list row), `Select` takes an optional `header` and `footer`, and `Card` takes an optional `footer`. `Chart` takes an optional `caption`, and chart captions are now sent inside `image.caption`, where the Cloud API reads them. New `typingIndicator(messageId)` builds the request that marks a message as read and shows "typing…". `Card` takes an optional `image` (a photo shown above the text), and the new `Location(latitude, longitude, name?, address?)` component sends a native map pin. `renderChartPng` takes an optional `{ theme: "dark" }`, and chart PNGs now use larger text on a smaller canvas rendered at 2x, so labels stay readable at chat-image size.
