# @openuidev/react-ui

## 0.20.1

### Patch Changes

- [#1729](https://github.com/thesysdev/openui/pull/1729) [`8eda6b9`](https://github.com/thesysdev/openui/commit/8eda6b93d2cca13f079aae510145594a05af6ace) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - Sources shows where a dashboard's data comes from in place, next to the thing it explains. With `enableProvenance`, the bar's Sources is a split button: its main half turns inspect mode on and off and looks pressed while it's on (`aria-pressed`, `data-state="on" | "off"`), and its chevron opens the All sources menu under it (`aria-expanded`, `data-state="open" | "closed"`). Inspect mode outlines every data-bound component (each number, table or chart that reads a query, directly or through a formula) with a blue dotted outline, all at once; headings, text and layout containers get none. Hovering one turns its outline solid, with no hover card. A click, or Enter or Space on a focused one, opens its Sources popover beside it: a Sources chip at its corner that the card grows out of, on the list of its sources, then each source's Query or Formula with copy and its Result. A click outside closes it, and Escape steps back one level at a time. The All sources menu lists every query and formula once with how many items use it, and a source's Used by links open that item's popover on that source. Below 640px the popover and the menu open in a bottom sheet. With reduced motion everything fades instead of growing or sliding.

  `useArtifactProvenance()` adds `openAllSources`, `isPopoverOpen` and `isAllSourcesOpen`. The Sources panel docked beside the dashboard is removed. New class names: `openui-artifact-sources-split`, `openui-artifact-sources-chevron`, `openui-sources-popover` and `openui-sources-menu` (with their `__header`, `__body` and other parts). The default contents' parts are renamed from `openui-data-sources-panel__*` to `openui-data-sources-dialog__*`, and the dock's class names `openui-data-sources-workspace` and `openui-data-sources-slot` are removed. Hosts that styled them, or that relied on `Provenance` children rendering inline beside the dashboard, need to update: they now render inside the open popover or menu, under its header.

- Updated dependencies []:
  - @openuidev/react-headless@0.20.1

## 0.20.0

### Minor Changes

- [#1713](https://github.com/thesysdev/openui/pull/1713) [`e2aa773`](https://github.com/thesysdev/openui/commit/e2aa7736700181ef47813d7238d7aa57afdc5fea) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - `LiveArtifactRenderer` and `StaticArtifactRenderer`: a build's feed. The card and the open dashboard show one animated line saying what a build is doing now: "Thinking…", the calls by name, then "Building dashboard…". `Pending` is now a dotted sketch of a dashboard drawn widget by widget, and `label` replaces the feed with a note. Its new `heading` draws a dotted title and description at the top, for a page that shows the dashboard's title but doesn't have it yet. **Breaking:** `Pending` and `PendingLoader` no longer take `shapeColor`, `cardColor`, `borderColor`, `cols` or `rows`; the sketch is drawn in `color` and follows the area's width. `Loading` is now the same small pill as the feed, at the bottom of what's visible, instead of a badge in the corner. Both float over the dashboard whether the content or the page scrolls, and take the page's light or dark colors from its `color-scheme`, as the sketch does, without a `ThemeProvider`. `useArtifactRenderer()` gains `isEditing`: a new version is streaming in over the one on screen.

### Patch Changes

- [#1713](https://github.com/thesysdev/openui/pull/1713) [`e2aa773`](https://github.com/thesysdev/openui/commit/e2aa7736700181ef47813d7238d7aa57afdc5fea) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - `LiveArtifactRenderer` and `StaticArtifactRenderer`: one status everywhere. The card, the bar and the pending skeleton show the same line, and a build names its tools and scripts ("Calling list_orders…", "Writing and testing revenueByDay…"). The card's status is a pill in the theme's colors, and a new `PreviewError` part shows the error there. The open dashboard drops its second loading pill, its bar's loader waits while `Pending` shows, and a long error message wraps inside the alert.
- Updated dependencies [[`e2aa773`](https://github.com/thesysdev/openui/commit/e2aa7736700181ef47813d7238d7aa57afdc5fea)]:
  - @openuidev/react-headless@0.20.0

## 0.19.0

### Minor Changes

- [#1544](https://github.com/thesysdev/openui/pull/1544) [`cebe02b`](https://github.com/thesysdev/openui/commit/cebe02b1c38eb7177a69d49fd7cf10a5f8a20b66) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Show where a live artifact's numbers come from. `LiveArtifactRenderer` takes `enableProvenance`: the bar gets an inspect toggle (`ProvenanceToggle`), a click on a component or a number while inspecting selects it instead of acting, and `Provenance` shows your panel for it. By default it shows a Sources panel docked beside the dashboard, opened by the bar's "Sources" button: every query, and for a click its query, result and formula; pass `describeSource` to `Provenance` to name your tools, or children to use your own panel. `useArtifactProvenance()` returns the selection and the program's sources: each component's queries with their calls and results, the formula in between and its filters. Style inspect mode with `[data-openui-hover]`, `[data-openui-selected]` and `.openui-artifact-inspecting`.

  In lang-core, a component written inside a statement gets an id, `componentId` (`lead.2`: the third component inside `lead`), and `dataSources` lists it. In react-lang, components may receive `bindSource`, which marks their root element (`bindSource()`) and a prop's element (`bindSource("value")`); `readSourceTarget(element)` finds the component and prop under a click, also for components that don't call `bindSource`. `useDataSources()` returns `DataSources`. `Renderer.DefaultContent` is what `Renderer` shows without children. In the dashboard library, `Kpi`, `Stat` and `Kpis` mark their value and comparison. `@openuidev/react-ui` now needs `@openuidev/react-lang` 1.2.0 or later, for these APIs: update both together (`pnpm add @openuidev/react-ui@^0.19 @openuidev/react-lang@^1.2`). `@openuidev/assistant-ui` accepts `@openuidev/react-ui` and `@openuidev/react-headless` 0.19.

### Patch Changes

- [#1679](https://github.com/thesysdev/openui/pull/1679) [`1ff6b26`](https://github.com/thesysdev/openui/commit/1ff6b265c5af6f242b4f5949c8db36db2c51f5ea) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Open artifacts stay current. While open, a renderer checks every 30 seconds (`pollInterval` on `OpenUICloudProvider` or the renderer, at least 3s, `false` to turn off) for a newer version, a rename, or a change to the user's access, and pauses while the tab is hidden. A newer version streams in live as it's generated, the same way the person editing sees it, without losing filters; a failed edit goes back to the version before it; and the new `EditedNotice` slot says "Edited just now" once it's done. A deleted or unshared artifact clears, shows its error in the middle, and leaves every list. It keeps checking and comes back if it's shared again. Failed checks retry less often each time, at most 5 minutes apart, and at once when the tab is shown again. `useArtifactRenderer()` adds `isOwner`, `isEditable`, and `justUpdated`. Saving content with `useArtifactUpdate` loads the new version in every renderer at once. `ArtifactStorage.stream` takes `fetchLatest` and can answer `unchanged`, and artifacts carry their `version`. While an artifact is pending, the chrome bar no longer shows its own loader next to `Pending`'s.

- [#1709](https://github.com/thesysdev/openui/pull/1709) [`bbc525d`](https://github.com/thesysdev/openui/commit/bbc525d919cd622f18d6b111d4db26fb7538b94f) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - The artifact renderer's `Pending` skeleton now stays up through a dashboard's build, until the dashboard starts streaming, instead of ending when the tool returns. Its note says what the build is doing: "Reading your data" while it calls tools, "Preparing your data" while it saves scripts. The card's, bar's and content's loaders say the same, which covers edits too. The card's status text shimmers, and a new status drifts in, except under reduced motion. `useArtifactRenderer()` adds `step`, and `isPending` now also covers a build that hasn't started writing.

- [#1706](https://github.com/thesysdev/openui/pull/1706) [`a8ba1dd`](https://github.com/thesysdev/openui/commit/a8ba1dde96a59e5f7a66276c79114e98b946ab83) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - The artifact renderer, pending loader and agent-interface styles now use `css` and `keyframes` from `@openuidev/react-components` instead of importing goober directly, so they go into react-components' shared style sheet (`#openui-styles`) rather than a separate `_goober` tag. An app that calls `configureStyles({ layer })` now gets these styles in that cascade layer too, like the rest of the components. react-ui no longer depends on `goober`.
- Updated dependencies [[`1ff6b26`](https://github.com/thesysdev/openui/commit/1ff6b265c5af6f242b4f5949c8db36db2c51f5ea), [`cebe02b`](https://github.com/thesysdev/openui/commit/cebe02b1c38eb7177a69d49fd7cf10a5f8a20b66), [`cebe02b`](https://github.com/thesysdev/openui/commit/cebe02b1c38eb7177a69d49fd7cf10a5f8a20b66), [`bbc525d`](https://github.com/thesysdev/openui/commit/bbc525d919cd622f18d6b111d4db26fb7538b94f)]:
  - @openuidev/react-headless@0.19.0
  - @openuidev/react-lang@1.2.0

## 0.18.12

### Patch Changes

- [#1689](https://github.com/thesysdev/openui/pull/1689) [`aa3f9fe`](https://github.com/thesysdev/openui/commit/aa3f9feeab0cfa5bbfd9aa50690abca01b20510d) Thanks [@mlubbad](https://github.com/mlubbad)! - Use CSS logical start alignment (`text-align: start`, `justify-content: flex-start`, and `border-inline-end`) for default unaligned text blocks, table headers/cells, option cards, citations, follow-up items, and tooltips so RTL (`dir="rtl"`) interfaces align naturally to the inline start while keeping LTR rendering unchanged.
- Updated dependencies [[`aa3f9fe`](https://github.com/thesysdev/openui/commit/aa3f9feeab0cfa5bbfd9aa50690abca01b20510d)]:
  - @openuidev/react-components@0.0.5
  - @openuidev/react-headless@0.18.12

## 0.18.11

### Patch Changes

- [#1700](https://github.com/thesysdev/openui/pull/1700) [`75684e7`](https://github.com/thesysdev/openui/commit/75684e773976525e442ed885c416ad8da0e2a756) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - react-ui and react-components now share one theme provider. react-ui re-exports `ThemeProvider`, `useTheme`, the default themes, swatches and theme hooks from react-components, so a single `ThemeProvider` from either package themes the components of both, including charts, markdown and popups that read the theme in JavaScript. react-ui's exports are unchanged. react-components adds a `@openuidev/react-components/theme` entry with only the theme code, and exports `ThemeContext`.
- Updated dependencies [[`75684e7`](https://github.com/thesysdev/openui/commit/75684e773976525e442ed885c416ad8da0e2a756)]:
  - @openuidev/react-components@0.0.4
  - @openuidev/react-headless@0.18.11

## 0.18.10

### Patch Changes

- [#862](https://github.com/thesysdev/openui/pull/862) [`23e3b39`](https://github.com/thesysdev/openui/commit/23e3b39dc0b7fe589c8bde3f941436e967e97bd4) Thanks [@Shinyaigeek](https://github.com/Shinyaigeek)! - `Accordion` now opens its first item when it mounts with every item already present, instead of the last. While streaming it still opens each new item, and it keeps that item open while the item's `value` is still streaming in.

- [#1659](https://github.com/thesysdev/openui/pull/1659) [`1f4f17b`](https://github.com/thesysdev/openui/commit/1f4f17ba4905a2ece9d55558c4dff8acd54ad9e3) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Artifacts can be shared with a user or a group, to view or edit. `useArtifactShares(id)` reads an artifact's shares, and `useArtifactShare()` and `useArtifactUnshare()` change them, showing the change at once and reverting if it fails. `useArtifactList` lists the artifacts shared with the user too, and takes `isOwner` to show only theirs (`true`) or only shared ones (`false`). Artifacts carry `isOwner`, `isEditable`, and, for users who can edit them, `shares`; `pinned` is now the user's own pin. `ArtifactStorage` gets two optional methods for this, `share` and `unshare`, and `cloudArtifactStorage` implements them.

- [#1665](https://github.com/thesysdev/openui/pull/1665) [`ee03004`](https://github.com/thesysdev/openui/commit/ee030041bcd2821cc20fd25d6c8df690566dd101) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - The pending loader keeps its shape at any size: it scales to fit, like an SVG, instead of stretching its cards on a wide or tall space. It also fits a space shorter than 400px instead of overflowing it. `Pending` also takes `cols` and `rows` to fix its grid.

- [#820](https://github.com/thesysdev/openui/pull/820) [`d8a6c73`](https://github.com/thesysdev/openui/commit/d8a6c7333c3ede29c3cd8accf7bb28903ff4939f) Thanks [@Shinyaigeek](https://github.com/Shinyaigeek)! - `Tabs` now opens on its first tab when it mounts with every tab already present, whether the response is static or a stream delivered it in one chunk. It follows the tab the model is writing into only while the response streams, so a `Query` that resolves inside another tab afterwards no longer switches tabs.
- Updated dependencies [[`1f4f17b`](https://github.com/thesysdev/openui/commit/1f4f17ba4905a2ece9d55558c4dff8acd54ad9e3)]:
  - @openuidev/react-headless@0.18.10

## 0.18.9

### Patch Changes

- [#1644](https://github.com/thesysdev/openui/pull/1644) [`29b9de0`](https://github.com/thesysdev/openui/commit/29b9de0e3236d7a584358b4aef97471faac88a5e) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - `LiveArtifactRenderer` and `StaticArtifactRenderer` can mount before the tool returns: without `response`, `id` or `content` they're pending instead of showing "This response doesn't reference an artifact.", and `useArtifactRenderer()` reports `isPending`. The new `Pending` slot shows a skeleton dashboard that rearranges itself under a note; it takes `label`, `color`, `shapeColor`, `cardColor` and `borderColor`, or children to replace it. `defineLiveArtifactRenderer` shows the card and panel as soon as a dashboard tool call starts.
- Updated dependencies []:
  - @openuidev/react-headless@0.18.9

## 0.18.8

### Patch Changes

- Updated dependencies [[`d3763f5`](https://github.com/thesysdev/openui/commit/d3763f531b833e804e86d2059902d3f302cc7754)]:
  - @openuidev/react-headless@0.18.8

## 0.18.7

### Patch Changes

- [#1607](https://github.com/thesysdev/openui/pull/1607) [`63a9c39`](https://github.com/thesysdev/openui/commit/63a9c39c26ba0d8ad130158e8cdb69b619aa2ae9) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - A dashboard shows its last results while it reloads. Pass `cacheQueryResults: false` to `cloudArtifactStorage` to turn this off. `ArtifactStorage` gets two optional methods for this, `getQueryResults` and `putQueryResult`.
- Updated dependencies [[`63a9c39`](https://github.com/thesysdev/openui/commit/63a9c39c26ba0d8ad130158e8cdb69b619aa2ae9), [`c782147`](https://github.com/thesysdev/openui/commit/c78214746c306491745e4f008593f3bc34c51671)]:
  - @openuidev/react-headless@0.18.7
  - @openuidev/react-lang@1.1.1

## 0.18.6

### Patch Changes

- [#1594](https://github.com/thesysdev/openui/pull/1594) [`19bb0c9`](https://github.com/thesysdev/openui/commit/19bb0c9849c3669d26da9eb5287178be7f5fb081) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - An open dashboard follows edits: the artifact stream records the versions it delivers, a reopened panel waits for the newer version before running its queries, and a query refused for an old version (`ARTIFACT_VERSION_MISMATCH`) runs again instead of showing an error, after one re-read shared by every renderer of the artifact. `useArtifactStream` gets `reportVersionMismatch`, and `onSettle` gets a `detail` with the error's code and the artifact id and version the call ran with.
- Updated dependencies [[`19bb0c9`](https://github.com/thesysdev/openui/commit/19bb0c9849c3669d26da9eb5287178be7f5fb081)]:
  - @openuidev/react-headless@0.18.6

## 0.18.5

### Patch Changes

- [#1575](https://github.com/thesysdev/openui/pull/1575) [`adec1c1`](https://github.com/thesysdev/openui/commit/adec1c1525800729d60a9975e183b3fa82eba726) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - `defineLiveArtifactRenderer` (`@openuidev/react-ui/cloud/agent-interface`) shows OpenUI Cloud dashboards in `AgentInterface`: the dashboard tools' results become a card in the chat that opens the live dashboard in the side panel, and saved dashboards open in the artifact browser.
- Updated dependencies []:
  - @openuidev/react-headless@0.18.5

## 0.18.4

### Patch Changes

- [#1565](https://github.com/thesysdev/openui/pull/1565) [`18af788`](https://github.com/thesysdev/openui/commit/18af78876e0f49813b4089cc09be6ce16d1c7666) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Cloud artifact renderers read the artifact reference from OpenUI Cloud's content line (`]]>openui:content?artifact_id=…`) in a tool response.
- Updated dependencies []:
  - @openuidev/react-headless@0.18.4

## 0.18.3

### Patch Changes

- [#1493](https://github.com/thesysdev/openui/pull/1493) [`f5ff998`](https://github.com/thesysdev/openui/commit/f5ff998d0ae139cdafa3508436a2c91284f28fd1) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - New `@openuidev/react-ui/cloud` entry: `LiveArtifactRenderer` and `StaticArtifactRenderer` for OpenUI Cloud artifacts, plus `useArtifactList`, `useArtifactPin`, `useArtifactUnpin`, `useArtifactDelete` and `useArtifactUpdate`. The `@openuidev/react-headless` peer window moves to `>=0.18.2`.
- Updated dependencies []:
  - @openuidev/react-headless@0.18.3

## 0.18.2

### Patch Changes

- Updated dependencies [[`da5ea77`](https://github.com/thesysdev/openui/commit/da5ea770eb4284d8d1a08471d46f5bf6fe6a8b0f)]:
  - @openuidev/react-headless@0.18.2

## 0.18.1

### Patch Changes

- [#1327](https://github.com/thesysdev/openui/pull/1327) [`86da07f`](https://github.com/thesysdev/openui/commit/86da07f6266887ff819cd5a8e295c75b2edc8251) Thanks [@shubham-thesys](https://github.com/shubham-thesys)! - Refresh the AgentInterface shell: a collapsed sidebar rail with a History menu and a draggable, remembered width; a pill composer and a shared ~72ch reading column; a centred welcome screen with starter tabs and a `card` starter variant; `AgentInterface.ThreadHeader` gains `start` / `center` / `end` slots, the chat title and a Rename/Delete menu; a Rename option in the thread menu; a shared menu style for Select, ModelSwitcher and dropdowns; a mascot loader in place of the dot-matrix loader; an exported `WelcomeMascot` (blinks, follows the cursor, squishes on click); an `AgentInterface.SidebarFooter` slot with `AgentInterface.ThemeModeToggle`, backed by the new `useThemeModePreference` hook; a redesigned tool call timeline with animated tool glyphs, plain-language labels (`toolLabel`, `ToolLabelsProvider`) and a live "Working" row; `defaultLabel` is deprecated in favour of `toolLabel`; and server-rendering support: the saved sidebar and theme preferences are restored just after hydration, before paint, with the interface's contents hidden until then so the first visible frame is already correct.

- [#1394](https://github.com/thesysdev/openui/pull/1394) [`5186585`](https://github.com/thesysdev/openui/commit/51865854eb16e259089b736bf480b10b2e42b2ad) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Update the README for OpenUI Lang 1.0: working snippets and links to the new docs pages.
- Updated dependencies [[`5186585`](https://github.com/thesysdev/openui/commit/51865854eb16e259089b736bf480b10b2e42b2ad), [`86da07f`](https://github.com/thesysdev/openui/commit/86da07f6266887ff819cd5a8e295c75b2edc8251)]:
  - @openuidev/react-lang@1.0.1
  - @openuidev/react-headless@0.18.1

## 0.18.0

### Minor Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Add custom actions: `defineAction({ name, description, params })` plus `createLibrary({ actions })`. Programs use them like the built-in steps, alone or in `Action([...])`, for example `Button("Copy", @CopyToClipboard(order.id))`, with positional arguments in `params` key order. On click the step reaches the host `onAction` as `{ type: name, params }` (schema defaults applied), in order with the other steps, and the event is typed from the library so `params` narrows by `type`. Args are validated like library function args, and a step with invalid args is a no-op. Only a real call produces a custom step: a plan read from data (an object literal, `$state`, an `@Each` item) loses its custom steps, and a legacy action object whose type names a custom action is ignored. `library.toJSONSchema()` lists actions under `actions`, the prompt lists them with the built-in action steps, and `toSpec()` includes them. The React `Renderer` and the server autofix parser pick them up automatically, and the react-ui `Button` validates its form before a custom action.

  Types: the exported `ActionStep` union adds `{ type: "custom_action"; name; params }`, so a `switch` over `ActionStep` types needs a case for it.

  In react-ui, `AgentInterface` takes `onAction`, which receives the actions the chat does not handle itself, such as custom actions.

  The built-in steps (`@Run`, `@ToAssistant`, `@OpenUrl`, `@Set`, `@Reset`) are now defined like custom actions and live in the same call registry, so their prompt lines are generated too (for example `@OpenUrl(url: string)`). `ACTION_NAMES` is removed.

  A defined action has a `.ref` for slots that take only some actions, for example `share: z.union([copy.ref, steps.OpenUrl.ref]).optional()`: the prompt signature prints `share?: @CopyToClipboard | @OpenUrl`, and the JSON gets a `CopyToClipboard` `$defs` entry `{ type: "CopyToClipboard", params }`.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI Lang 1.0.

  - Upgrade `@openuidev/lang-core` and `@openuidev/react-lang` together, and together with the server that generates the system prompt. A 1.0 prompt teaches bare action steps (`@ToAssistant("Hi")` without `Action([...])`), which a 0.x client does not run.
  - react-ui 0.18 requires react-lang 1.0 (peer `>=1.0.0 <2.0.0`); upgrade them together.
  - browser-bundle 0.2 bundles react-lang 1.0 and react-ui 0.18.
  - server 0.3 uses lang-core 1.0 for autofix (parser and system prompt); stay on server 0.2 with a 0.x client. Autofix ignores warnings and accepts a ternary entry, so a program that renders does not start a fix round.
  - vue-lang, svelte-lang and angular-lang stay on 0.4 (OpenUI Lang 0.x). Keep `@openuidev/lang-core` ^0.4 for the prompts they render.
  - A program whose `root` statement is written last shows nothing while it streams, until the `root` line arrives. Write `root` first, as the system prompt asks.
  - A cut-off output that never reached its `root` statement, or any statement calling the root component, now renders blank instead of a partial tree.

### Patch Changes

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Action steps are plans. Every step call now evaluates to a one-step plan (`{ steps: [step] }`), so a single step needs no wrapper: `Button("Ask", @ToAssistant("Tell me more"))`. Several steps still need `Action([...])`, for example `Button("Save", Action([@Set($saved, true), @ToAssistant("Saved")]))`; a plain list of steps stays a plain array. An invalid step evaluates to an empty plan (a no-op) instead of null, and `Action([...])` flattens nested plans. Legacy `{ type, params }` action configs are unchanged.

  New `action()` helper (lang-core, re-exported by react-lang), like `reactive()`: it returns the action prop schema, already tagged `ActionExpression`, so libraries write `action: action().optional()` instead of calling `tagSchemaId(..., "ActionExpression")` themselves. react-ui's action props use it.

  Prompt change: for libraries with action props (`ActionExpression`), the system prompt teaches one step bare and several steps in `Action([...])`. The react-ui prompt examples, including the chat library examples, use step calls instead of legacy objects.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - Stored messages and Cloud responses whose second content line starts mid-line, after a cut-off first attempt, read the second attempt, as before.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - `parseMessage` reads a content line that starts mid-line as a new content section, so a regenerated response wins over the cut-off one, also while streaming. react-lang and react-ui drop their own copies of this step, and a Cloud response keeps the second attempt's scripts.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - OpenUI 1.0 review fixes:

  - lang-core: the built-in functions prompt no longer uses react-ui's `Col` in its `@Each` example, and names Query only when tool calls are on.
  - lang-core: `JSONSchemaDef` adds `type` and `anyOf`, so the CLI's spec for a library that uses `action()` passes to `generateSystemPrompt` without a cast.
  - react-ui: the chat prompt's button rules name `@ToAssistant` and `@OpenUrl`.
  - react-ui, a2ui, assistant-ui, devtools, react-email: the `@openuidev/react-lang` peer window now covers the version this release publishes.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - The chat components read and write stored messages with `parseMessage` and `buildMessage` from react-lang instead of their own marker parser. Stored bytes are unchanged, and older messages in the `<content>`/`<context>` XML envelope still read. A complete message whose content ends in `]` (or any other start of a marker) is no longer cut short, and `]]>openui:end` text in the middle of a line stays in the content.

- [#1348](https://github.com/thesysdev/openui/pull/1348) [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2) Thanks [@Aditya-thesys](https://github.com/Aditya-thesys)! - `@ToAssistant(message, context)` passes its context through unchanged as any value (object, array, number, string, including falsy ones). The `continue_conversation` step's `context` is now typed `unknown`, and react-lang forwards it in `params.context` whenever it is set. The react-ui chat adds it as the third element of the chat context, and card blocks append their item context to it as text, as before. The system prompt documents the context argument.
- Updated dependencies [[`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2), [`9e76b1d`](https://github.com/thesysdev/openui/commit/9e76b1d0b48238e339918c5097f3adc54d88eba2)]:
  - @openuidev/react-lang@1.0.0
  - @openuidev/react-headless@0.18.0

## 0.17.1

### Patch Changes

- [#1343](https://github.com/thesysdev/openui/pull/1343) [`497681e`](https://github.com/thesysdev/openui/commit/497681eefecf7d61b863e98af7dec98555941cf8) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Widen the internal `react-lang` peer windows to include the 0.4.x line that the
  Renderer slots release (a minor bump of the lang family) publishes.
- Updated dependencies [[`f1f66c4`](https://github.com/thesysdev/openui/commit/f1f66c4266d6d76d73b94530b32653fecd1f6c01)]:
  - @openuidev/react-lang@0.4.0
  - @openuidev/react-headless@0.17.1

## 0.17.0

### Minor Changes

- [#1248](https://github.com/thesysdev/openui/pull/1248) [`301d668`](https://github.com/thesysdev/openui/commit/301d66856835a81211628212f11833fe56a57dd4) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - Charts are now drawn with D3 instead of Recharts. Every chart keeps its name and export (`AreaChart`, `AreaChartCondensed`, `BarChart`, `BarChartCondensed`, `HorizontalBarChart`, `LineChart`, `LineChartCondensed`, `PieChart`, `RadarChart`, `RadialChart`, `ScatterChart`, `SingleStackedBar`, the Mini charts and the scatter helpers) and takes the same `data` + `categoryKey` / `dataKey` shape; genui-lib's chart components and their props are unchanged. New charts: `HeatmapChart`, `FunnelChart`, `SegmentedBar` (the same component as `SingleStackedBar`), `CalendarHeatmap`, plus `StackedLegend` with `LegendStoreProvider`.

  Changes for direct users:

  - `theme` (named palettes) is gone; set colors with `customPalette` or the ThemeProvider's chart palettes (`defaultChartPalette`, `barChartPalette`, …).
  - `height` is the whole chart: the x-axis labels and legend fit inside it instead of being added below. Labels take at most half of it and truncate when they don't fit.
  - Renamed: bar `radius` → `barRadius`; SingleStackedBar `animated` → `isAnimationActive`.
  - Dropped: line and radar `strokeWidth`; HorizontalBarChart `showXAxis`; Pie and Radial `onMouseEnter` / `onMouseLeave`; scatter `shape`.
  - Legend and tooltip text is shown as given, no longer capitalized ("iOS" stays "iOS"; a lowercase data key shows lowercase).
  - `recharts` is no longer a dependency.

### Patch Changes

- [#1273](https://github.com/thesysdev/openui/pull/1273) [`d51a09c`](https://github.com/thesysdev/openui/commit/d51a09cd4ed9639f5e606a9c07faef352672a164) Thanks [@ankit-thesys](https://github.com/ankit-thesys)! - Scrolling `BarChart`, `AreaChart` and `LineChart` lay out long category lists faster: only a label that widens the categories is measured in full, so the layout stays cheap as a long chart streams in. Widened categories are sized to the exact label width.

- [#1269](https://github.com/thesysdev/openui/pull/1269) [`dd4f450`](https://github.com/thesysdev/openui/commit/dd4f45074ac50b59d78e2855bd203e0e0562c95b) Thanks [@i-subham23](https://github.com/i-subham23)! - Fixes to the D3 charts from QA:

  - Area and line charts with `variant="step"` step halfway between points, as the Recharts charts did, so the first and last values get a flat run too.
  - The scrolling `BarChart`, `AreaChart` and `LineChart` widen their categories so long x-axis labels show in full, and scroll further. A category grows to at most three times its usual width and at most half the chart; longer labels, and labels in the condensed charts, are truncated with the full text on hover.
  - The donut `PieChart` is a thin band in the slice colors over grey track wedges again, with slices 0.5° apart; `paddingAngle` sets the pie's gaps only.
  - `RadarChart` marks the hovered axis with a dot on each series. The dots glide between axes and fade in and out, like the line and area charts' hover dots.

- Updated dependencies []:
  - @openuidev/react-lang@0.3.1
  - @openuidev/react-headless@0.17.0

## 0.16.3

### Patch Changes

- [#1068](https://github.com/thesysdev/openui/pull/1068) [`a935fcd`](https://github.com/thesysdev/openui/commit/a935fcd56ea38eb45e13c2192a43b9e0e94ffd51) Thanks [@iambharathpadhu](https://github.com/iambharathpadhu)! - Prevent Enter from submitting either built-in composer while IME composition is active, including browsers that report the keyCode 229 fallback. Enter after composition finishes still submits, and Shift+Enter continues to insert a newline.
- Updated dependencies []:
  - @openuidev/react-headless@0.16.3

## 0.16.2

### Patch Changes

- [#1170](https://github.com/thesysdev/openui/pull/1170) [`6060bf5`](https://github.com/thesysdev/openui/commit/6060bf58e62cdd30d085c10b9f436959f901b164) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Add an `AgentInterface` turn-level tool timeline override, allowing applications
  to replace the default live tool-activity UI without rebuilding the thread.
- Updated dependencies []:
  - @openuidev/react-headless@0.16.2

## 0.16.1

### Patch Changes

- [#1186](https://github.com/thesysdev/openui/pull/1186) [`0227ad7`](https://github.com/thesysdev/openui/commit/0227ad77ed79a6292802960c69b61e6a75e0fcae) Thanks [@abhithesys](https://github.com/abhithesys)! - Widen the internal `react-headless`/`react-ui` peer windows to include the
  0.16.x line, fixing an install-time peer mismatch where these packages
  required a `react-headless`/`react-ui` version older than the one they ship
  against.
- Updated dependencies []:
  - @openuidev/react-headless@0.16.1

## 0.16.0

### Minor Changes

- [#1184](https://github.com/thesysdev/openui/pull/1184) [`5cde7c3`](https://github.com/thesysdev/openui/commit/5cde7c36ccd419570dd6b2653fc88dc4f6471964) Thanks [@abhithesys](https://github.com/abhithesys)! - Widen peer dependency ranges for `@openuidev/react-headless` and `@openuidev/react-ui` to allow `0.15.x` (`>=0.14.0 <0.16.0`).

### Patch Changes

- Updated dependencies []:
  - @openuidev/react-headless@0.16.0

## 0.15.0

### Minor Changes

- [#1182](https://github.com/thesysdev/openui/pull/1182) [`b4aa87c`](https://github.com/thesysdev/openui/commit/b4aa87cb2d0bc32434cec806658286a8744cd514) Thanks [@abhithesys](https://github.com/abhithesys)! - Add the new card and form components to `openuiLibrary` (the base, non-chat library), so they're available outside `AgentInterface` too: `InlineHeader`, `EditableTable`, `Chips`/`ChipItem`, `OptionCards`/`OptionCard`, `IconButton`, `EntityList`, `Text`/`BoldText`, `IconText`/`ImageText`/`ImageTextLarge`, `MetricIndicatorInline`/`MetricIndicatorWithStrikethrough`, and the `Snippet`/`Overview`/`Context`/`Composite`/`Visual` card blocks with their items.

  `FormControl` now accepts `Chips` and `OptionCards` inputs in both libraries, which let the chat library drop its `ChatForm`/`ChatFormControl` duplicates and register the base `Form`/`FormControl` directly.

  Fixes `IconButton`, which was registered but unreachable in the chat library (no union pointed at it) — it can now be placed as a `Card`/`Stack` child in both libraries.

- [#1173](https://github.com/thesysdev/openui/pull/1173) [`8e0d1c8`](https://github.com/thesysdev/openui/commit/8e0d1c81bdbbd24647cad61a98e345f2f0de40bd) Thanks [@abhithesys](https://github.com/abhithesys)! - Add new components to `openuiChatLibrary`.

  New chat components: `InlineHeader`, `EditableTable`, `Chips`/`ChipItem`, `OptionCards`/`OptionCard`, `Icon`, `IconButton`, `EntityList`, `Text`, `BoldText`, `IconText`, `ImageText`, `ImageTextLarge`, `MetricIndicatorInline`, `MetricIndicatorWithStrikethrough`, and the `Snippet`/`Overview`/`Context`/`Composite`/`Visual` card blocks with their items. Each ships as a react-ui primitive under `components/` plus a genui-lib wrapper.

  Citations: the chat `Card` accepts `sources`, renders a Sources strip, and `[n]` markers in `TextContent` become citation chips. New `TextContentWrapper`, `Citation`, `Sources`, `SourceFaviconImage`, `InlineMarkdownRenderer` and `TooltipWrapper` primitives.

  Card block clicks attach per-item context (`itemIndex`, `itemId`, `itemTitle`, ...) to the block action. Chat-only variants of `Form`, `FormControl`, `Tabs`, `Accordion`, `Carousel` and `SectionBlock` accept the new blocks as nested content.

  Prompt: chat examples and rules rewritten to cover cards, forms, citations and actions. The action prop schema now carries the `open_url` / `continue_conversation` / custom object contract in the generated JSON schema.

  Breaking: `Tag.icon` is now an `Icon` reference instead of a string. `TagBlock` gains `size`, `ListBlock` gains `size`, condensed charts gain `height`. Typography map gains `number/title` and `number/title-medium`; several components that referenced a non-existent `primary` font family now use `body`.

  Dependencies: adds `@tanstack/react-table` and `unist-util-visit`.

### Patch Changes

- Updated dependencies [[`bad6e49`](https://github.com/thesysdev/openui/commit/bad6e492b38bfb1da05e6e6976ae6a23244a4af0)]:
  - @openuidev/react-headless@0.15.0

## 0.14.0

### Minor Changes

- [#1069](https://github.com/thesysdev/openui/pull/1069) [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503) Thanks [@abhithesys](https://github.com/abhithesys)! - Adopt automated release management via changesets. `react-headless` and
  `react-ui` now version together as a fixed group; this release unifies them on
  a single version line.

### Patch Changes

- Updated dependencies [[`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503), [`f8d9b92`](https://github.com/thesysdev/openui/commit/f8d9b92ff11d7aa0789d9c57e0a2d78cce817503)]:
  - @openuidev/react-lang@0.3.0
  - @openuidev/react-headless@0.14.0
