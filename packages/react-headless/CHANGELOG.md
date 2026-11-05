# @openuidev/react-headless

## 0.18.2

### Patch Changes

- [#1487](https://github.com/thesysdev/openui/pull/1487) [`da5ea77`](https://github.com/thesysdev/openui/commit/da5ea770eb4284d8d1a08471d46f5bf6fe6a8b0f) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Stream OpenUI Cloud artifacts by id. The cloud artifact storage can now stream, pin, unpin, delete and rename artifacts, and `OpenUICloudProvider` connects renderers outside `ChatProvider`.

## 0.18.1

### Patch Changes

- [#1394](https://github.com/thesysdev/openui/pull/1394) [`5186585`](https://github.com/thesysdev/openui/commit/51865854eb16e259089b736bf480b10b2e42b2ad) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Update the README for OpenUI Lang 1.0: working snippets and links to the new docs pages.

- [#1327](https://github.com/thesysdev/openui/pull/1327) [`86da07f`](https://github.com/thesysdev/openui/commit/86da07f6266887ff819cd5a8e295c75b2edc8251) Thanks [@shubham-thesys](https://github.com/shubham-thesys)! - Publish a tool call before its result: `processStreamedMessage` flushes the pending assistant update before a tool result arrives, so a server-side tool's result never shows up ahead of (or without) its call.

## 0.18.0

No changes in this release.

## 0.17.1

No changes in this release.

## 0.17.0

No changes in this release.

## 0.16.3

No changes in this release.

## 0.16.2

No changes in this release.

## 0.16.1

No changes in this release.

## 0.16.0

No changes in this release.

## 0.15.0

### Patch Changes

- [#1179](https://github.com/thesysdev/openui/pull/1179) [`bad6e49`](https://github.com/thesysdev/openui/commit/bad6e492b38bfb1da05e6e6976ae6a23244a4af0) Thanks [@vishxrad](https://github.com/vishxrad)! - Export `useOpenuiCloudStorage`, `OpenuiCloudOptions`, and `OpenuiCloudFeatures` from `@openuidev/react-headless`, also available through `@openuidev/react-ui`. Cloud storage no longer requires importing the hook from `@openuidev/thesys`. The existing options, frontend-token refresh and retry behavior, conversation history, and optional artifact storage are preserved.

## 0.14.0

### Minor Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - Adopt automated release management via changesets. `react-headless` and
  `react-ui` now version together as a fixed group; this release unifies them on
  a single version line.
