# @openuidev/channels

## 0.3.0

### Minor Changes

- [#1748](https://github.com/thesysdev/openui/pull/1748) [`039dd48`](https://github.com/thesysdev/openui/commit/039dd484b6420ee1b7801c43fac22eb7f2ad6bc1) Thanks [@vishxrad](https://github.com/vishxrad)! - Add `@openuidev/channels/discord`: renders OpenUI Lang as Discord Components V2 messages (an accent-colored container with text, sections, media galleries, separators, buttons, and selects). Forms open as modals, interactions update the message in place, charts are uploaded as `attachment://` files, and `createCardPreview` streams partial cards through message edits.

### Patch Changes

- [#1740](https://github.com/thesysdev/openui/pull/1740) [`83408bf`](https://github.com/thesysdev/openui/commit/83408bf293e96e1db5b27079da9fa04f53e6430d) Thanks [@vishxrad](https://github.com/vishxrad)! - `renderChartPng` (`@openuidev/channels/ui/charts`) needs recharts 2. recharts 3 lays charts out in effects, which never run in `renderToStaticMarkup`, so it rendered an empty chart and `renderChartPng` threw "chart produced no <svg>". That error now says to install `recharts@^2.15`, and the README and docs say recharts 2 is required. The peer range still accepts recharts 3, so apps that use recharts 3 elsewhere and never rasterize charts keep installing cleanly.

## 0.2.0

### Minor Changes

- [#1724](https://github.com/thesysdev/openui/pull/1724) [`c30e80e`](https://github.com/thesysdev/openui/commit/c30e80ebf307af97d940901b4a44133eca668d19) Thanks [@vishxrad](https://github.com/vishxrad)! - WhatsApp: `Option` takes an optional `description` (the second line of a list row), `Select` takes an optional `header` and `footer`, and `Card` takes an optional `footer`. `Chart` takes an optional `caption`, and chart captions are now sent inside `image.caption`, where the Cloud API reads them. New `typingIndicator(messageId)` builds the request that marks a message as read and shows "typing…". `Card` takes an optional `image` (a photo shown above the text), and the new `Location(latitude, longitude, name?, address?)` component sends a native map pin. `renderChartPng` takes an optional `{ theme: "dark" }`, and chart PNGs now use larger text on a smaller canvas rendered at 2x, so labels stay readable at chat-image size.
