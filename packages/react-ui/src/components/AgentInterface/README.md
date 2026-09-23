# AgentInterface

A full, drop-in **agent-chat UI** shipped as a single compound React component. It renders the
whole shell — sidebar with thread history, a streaming conversation thread (assistant / user / tool
messages), a composer with conversation starters, an empty-state welcome screen, a global artifact
browser, and a per-thread **Workspace** rail with a resizable **detailed-view** side panel.

This document is for **contributors** working inside `AgentInterface/`. It explains the mental
model, the public API, how data and state flow, the rendering pipeline, the styling system, and the
sharp edges you will hit. If you only want to _use_ the component, the Storybook stories
(`stories/AgentInterface.stories.tsx`) are the fastest reference.

---

## Table of contents

1. [Mental model](#mental-model)
2. [Quick start](#quick-start)
3. [The slot / compound-component model](#the-slot--compound-component-model)
4. [Public API reference](#public-api-reference)
5. [Render tree & provider stack](#render-tree--provider-stack)
6. [Composition modes (A / B / C)](#composition-modes-a--b--c)
7. [State & data model](#state--data-model)
8. [Navigation & routing](#navigation--routing)
9. [Message rendering pipeline](#message-rendering-pipeline)
10. [Artifacts, the Workspace rail & DetailedView](#artifacts-the-workspace-rail--detailedview)
11. [Layout & responsiveness](#layout--responsiveness)
12. [Styling & theming](#styling--theming)
13. [Directory guide](#directory-guide)
14. [Extending the component](#extending-the-component)
15. [Gotchas & known rough edges](#gotchas--known-rough-edges)
16. [Local development](#local-development)

---

## Mental model

AgentInterface is a **pure view layer**. It owns _zero_ chat business logic. Everything stateful
comes from three external sources, all from sibling packages:

| Concern                                    | Source package                                | How AgentInterface gets it                                                                               |
| ------------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Threads, messages, streaming, artifacts    | `@openuidev/react-headless`                   | Mounts `<ChatProvider>`; reads via `useThread`, `useThreadList`, `useArtifactList`, `useDetailedView`, … |
| GenUI auto-rendering of assistant messages | `@openuidev/react-lang`                       | Optional `componentLibrary` prop → `GenUIAssistantMessage`                                               |
| Wire message shapes                        | `@ag-ui/core` (re-exported by react-headless) | `Message`, `AssistantMessage`, `UserMessage`, `ToolMessage`, `InputContent`, …                           |

What AgentInterface itself adds on top:

- A **slot-based composition API** (`<AgentInterface.Sidebar>`, `.Composer`, `.Route`, …).
- **Layout & chrome**: sidebar collapse/expand, mobile vs. desktop, the workspace rail, the
  resizable detailed-view split.
- **Navigation** (`NavContext`) including a reserved `artifacts/…` URL space.
- A handful of small **UI-only stores/contexts** (sidebar/workspace open state, starters,
  layout breakpoint).

> **Rule of thumb:** if it's _data_, it lives in react-headless. If it's _layout/chrome/UI state_,
> it lives here.

---

## Quick start

The bare form renders everything from internal defaults:

```tsx
import { AgentInterface } from "@openuidev/react-ui"; // or the local component path

<AgentInterface
  storage={storage} // ChatStorage from react-headless
  llm={llm} // LLM transport from react-headless
  logoUrl={logoUrl}
  agentName="OpenUI"
/>;
```

With GenUI auto-rendering of assistant messages:

```tsx
<AgentInterface storage={storage} llm={llm} componentLibrary={myLibrary} />
```

See `stories/AgentInterface.stories.tsx` (`Default`, `WithWelcome`, `Routing`, `ArtifactBrowser`,
`WithWorkspace`, …) for runnable examples of every feature.

---

## The slot / compound-component model

`AgentInterface` is a function component with ~17 **static members** attached
(`AgentInterface.Sidebar`, `AgentInterface.Composer`, …). At render time it walks
`props.children` once (`extractSlots`, in `AgentInterface.tsx`) and routes each child by the
**identity of its element type**:

```ts
const SLOT_KEY_BY_TYPE = new Map<unknown, SingleSlotKey>([
  [SidebarSlot, "sidebar"],
  [SidebarHeader, "sidebarHeader"],
  [MobileHeader, "mobileHeader"],
  [ThreadHeader, "threadHeader"],
  [WelcomeScreen, "welcome"],
  [Composer, "composer"],
  [Workspace, "workspace"],
]);
// <AgentInterface.Route> is collected separately into `routes[]`.
// Anything else falls through to `rest[]` and is rendered as-is at the end.
```

### ⚠️ Slots are matched by reference, not by name

A child is recognized **only** if `child.type === <the exact component reference>`. That means:

- Wrapping a slot in `React.memo`, an HOC, a styled wrapper, or re-exporting it through a _second_
  module instance **silently breaks slot detection** — the element lands in `rest[]` and the
  default is rendered instead.
- You must use the canonical `AgentInterface.*` members (e.g. `<AgentInterface.Composer>`), not a
  hand-rolled clone.

### Single-slot rules (dev warnings)

- Passing the **same slot twice** keeps the first and `console.warn`s in dev (`extractSlots`).
- A **top-level** `<AgentInterface.SidebarHeader>` is _ignored_ when `<AgentInterface.Sidebar>` is
  also present (put the header _inside_ the Sidebar instead) — also a dev warning.

The full list of static members and whether each is a top-level slot:

| Member                            | Top-level slot?     | Role                                               |
| --------------------------------- | ------------------- | -------------------------------------------------- |
| `AgentInterface.Sidebar`          | ✅ `sidebar`        | Replace the whole sidebar; you compose its insides |
| `AgentInterface.SidebarHeader`    | ✅ `sidebarHeader`¹ | Default sidebar's header (logo + name + collapse)  |
| `AgentInterface.MobileHeader`     | ✅ `mobileHeader`   | Top bar on mobile                                  |
| `AgentInterface.ThreadHeader`     | ✅ `threadHeader`   | Thread region header (actions, workspace toggle)   |
| `AgentInterface.Welcome`          | ✅ `welcome`        | Empty-state hero (`WelcomeScreen`)                 |
| `AgentInterface.Composer`         | ✅ `composer`       | Message input                                      |
| `AgentInterface.Workspace`        | ✅ `workspace`      | Per-thread artifact rail                           |
| `AgentInterface.Route`            | ✅ `routes[]`       | Custom routable view (see Routing)                 |
| `AgentInterface.SidebarContent`   | ❌ building block   | Scrollable region inside a custom Sidebar          |
| `AgentInterface.SidebarSeparator` | ❌ building block   | Divider inside a custom Sidebar                    |
| `AgentInterface.SidebarItem`      | ❌ building block   | Styled nav row (also exported standalone)          |
| `AgentInterface.ArtifactNav`      | ❌ building block   | Artifact-category nav rows                         |
| `AgentInterface.NewChatButton`    | ❌ building block   | "New chat" affordance                              |
| `AgentInterface.ThreadList`       | ❌ building block   | Date-grouped thread history                        |
| `AgentInterface.Messages`         | ❌ building block   | The message list itself                            |
| `AgentInterface.MessageLoading`   | ❌ building block   | Streaming loader row                               |
| `AgentInterface.ScrollArea`       | ❌ building block   | Auto-scroll container                              |

¹ Only honored at top level when no `Sidebar` slot is present; otherwise nest it inside `Sidebar`.

---

## Public API reference

### `<AgentInterface>` props

Defined as `AgentInterfaceProps` in `AgentInterface.tsx`. It `extends Omit<ChatProviderProps,
"children">`, so the data props below are **forwarded to react-headless's `<ChatProvider>`**.

**Forwarded to `ChatProvider`** (from `@openuidev/react-headless`):

| Prop                 | Type                                     | Notes                                                                                                |
| -------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `storage`            | `ChatStorage`                            | Thread persistence (`listThreads`, `getMessages`, …) and optional `artifact` storage for the browser |
| `llm`                | LLM transport                            | The streaming send adapter                                                                           |
| `artifactRenderers`  | `AppRenderer[]`                          | Tool-name → renderer (`parser`/`preview`/`actual`); drives inline previews + detailed view           |
| `artifactCategories` | `{ name; filter: { type: string[] } }[]` | Splits the artifact browser & workspace into sections                                                |

> ⚠️ Only those four `ChatProviderProps` are actually forwarded (they're destructured explicitly in
> `AgentInterface.tsx`). Other `ChatProviderProps` are accepted by the _type_ but not passed through.

**AgentInterface-specific:**

| Prop                   | Type                                                     | Default | Notes                                                                                                     |
| ---------------------- | -------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `componentLibrary`     | `Library` (react-lang)                                   | —       | Auto-derive assistant (and user) message rendering via GenUI when `components.AssistantMessage` is absent |
| `components`           | `{ AssistantMessage?; UserMessage?; ToolCallTimeline? }` | —       | Explicit render overrides; `ToolCallTimeline` replaces the turn-level tool activity UI                    |
| `theme`                | `ThemeProps`                                             | —       | Passed to `<ThemeProvider>`                                                                               |
| `disableThemeProvider` | `boolean`                                                | `false` | Skip the internal `<ThemeProvider>` wrapper                                                               |
| `logoUrl`              | `string`                                                 | `""`    | Brand logo (default `SidebarHeader` + `MobileHeader`)                                                     |
| `agentName`            | `string`                                                 | `""`    | Agent display name                                                                                        |
| `starters`             | `ConversationStarterProps[]`                             | —       | Global starters inherited by Welcome (if active) or the Composer                                          |
| `starterVariant`       | `"short" \| "long"`                                      | —       | Layout variant for inherited starters                                                                     |
| `path`                 | `string`                                                 | —       | **Controlled** current path (pair with `onNavigate`); `undefined` = thread view                           |
| `defaultPath`          | `string`                                                 | —       | **Uncontrolled** initial path (ignored when `onNavigate` is set)                                          |
| `onNavigate`           | `(next: string \| undefined) => void`                    | —       | Presence selects controlled mode                                                                          |
| `children`             | `ReactNode`                                              | —       | Slots (see above)                                                                                         |

### Custom message components

```ts
type AssistantMessageComponent = React.ComponentType<{
  message: AssistantMessage;
  isStreaming: boolean;
}>;
type UserMessageComponent = React.ComponentType<{ message: UserMessage }>;
type ToolCallTimelineComponent = React.ComponentType<{
  activities: ToolActivity[];
  steps: TimelineStep[];
  isLast: boolean;
  awaitingResponse: boolean;
}>;
```

Provided via `components`, these **fully replace** the default rendering (including the container
and avatar). Resolution order, per message kind:
`components.X` → GenUI (if `componentLibrary`) → built-in default.

### Named exports (from `index.ts`)

| Export                                                                         | Kind             | Purpose                                    |
| ------------------------------------------------------------------------------ | ---------------- | ------------------------------------------ |
| `AgentInterface`                                                               | component        | The compound root                          |
| `AgentInterfaceProps`, `AgentInterfaceComponents`, `ToolCallTimelineComponent` | types            | Root props / override map                  |
| `SidebarItem`, `SidebarItemProps`                                              | component + type | Standalone nav row                         |
| `ArtifactNav`, `ArtifactNavProps`                                              | component + type | Artifact-category nav                      |
| `useNav`, `NavContextValue`                                                    | hook + type      | Read/drive navigation from inside the tree |
| `RouteProps`                                                                   | type             | `<AgentInterface.Route>` props             |
| `WorkspaceProps`                                                               | type             | `<AgentInterface.Workspace>` props         |
| `artifactListPath`, `artifactViewPath`                                         | functions        | Build reserved `artifacts/…` paths         |

---

## Render tree & provider stack

`AgentInterface.tsx` mounts the providers; `Container.tsx` mounts the UI-state providers; the body
(`AgentInterfaceBody`) does the view switch.

```
<ThemeProvider>                         (skipped if disableThemeProvider)
 └ <ChatProvider>                        react-headless: threads, artifacts, detailed-view stores
   └ <NavProvider>                       path + navigate (controlled/uncontrolled)
     └ <StartersProvider>                global starters + variant
       └ AgentInterfaceBody → <Container>
          └ <AgentInterfaceStoreProvider>   sidebar/workspace open, agentName, logoUrl
            └ <ShellStoreProvider>          library-wide shell store (see State model)
              └ <LayoutContextProvider>     "mobile" | "tray" | "fullscreen"
                └ <Tooltip.Provider>        single shared Radix tooltip provider (delay 250ms)
                  └ .openui-agent-container
                       ├ <SidebarContainer> … (default sidebar OR your <Sidebar> slot)
                       └ view switch:
                          ├ reserved `artifacts/…`  → ArtifactBrowserPage | ArtifactViewPage
                          ├ matched <Route>          → route children
                          └ thread view (path===undefined):
                               <ThreadContainer>
                                  MobileHeader · ThreadHeader · [Welcome] ·
                                  <ScrollArea><Messages/></ScrollArea> · Composer
                               <Workspace/>          (rail, thread view only)
                       └ slots.rest                  (unrecognized children, rendered as-is)
```

The **view switch** (in `AgentInterfaceBody`) has a strict priority:

1. **Reserved `artifacts/` paths** are matched _before_ user routes (`parseArtifactPath`).
2. Then an exact-match user `<Route path="…">`.
3. Otherwise (`path === undefined`) the normal thread view, which is the **only** view that also
   renders the `Workspace` rail.

---

## Composition modes (A / B / C)

Most slots support three levels of customization (the codebase comments call them Modes A/B/C):

- **Mode A — omit it.** The default renders. (`Default` story.)
- **Mode B — pass props.** Tweak the default without rebuilding it, e.g.
  `<AgentInterface.SidebarHeader logo={…} agentName={…} collapseButton={false} />`
  (`CustomSidebarHeader` story).
- **Mode C — pass children.** You own the entire inside; Mode B props are ignored (and dev-warns if
  both are passed). e.g. `<AgentInterface.Sidebar>…</AgentInterface.Sidebar>` (`FullSidebarOverride`),
  `<AgentInterface.Workspace>…</AgentInterface.Workspace>` (`WorkspaceCustomChildren`),
  `<AgentInterface.Welcome>…</AgentInterface.Welcome>` (`WelcomeCustomChildren`).

When you go Mode C on the Sidebar, compose it from the building-block members:
`SidebarHeader`, `SidebarContent`, `SidebarSeparator`, `SidebarItem`, `ArtifactNav`, `NewChatButton`,
`ThreadList`.

---

## State & data model

### External (react-headless) — the data

Mounted by `<ChatProvider>`. Read via hooks:

- `useThread(selector)` — `messages`, `isRunning`, `isLoadingMessages`, `threadError`,
  `processMessage`, `cancelMessage`.
- `useThreadList(selector)` — thread history + `selectThread`.
- `useArtifactList()` / `useArtifactCategories()` / `useArtifactRendererRegistry()` /
  `useArtifactStorage()` — the artifact registry & config.
- `useDetailedView(viewId)` / `useDetailedViewStore()` / `useActiveDetailedView()` — the side-panel
  open/active state.
- `MessageProvider` wraps each message so deep children can read it.

### Internal — UI/chrome state

Two **separate** zustand stores are mounted in `Container.tsx`. They are _not_ the same store and
serve different consumers:

| Store                   | File                                                                  | Holds                                                                                              | Read with                | Used by                                                                                                |
| ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| **AgentInterfaceStore** | `_shared/store/store.tsx`                                             | `isSidebarOpen` (default **true**), `isWorkspaceOpen` (default **false**), `agentName`, `logoUrl`  | `useAgentInterfaceStore` | All AgentInterface chrome (sidebar, workspace toggles, header)                                         |
| **ShellStore**          | `../_shared/store/store.tsx` (library-wide, shared with `OpenUIChat`) | `isSidebarOpen`, `isWorkspaceOpen` (default **true**), `agentName`, `logoUrl`, `showAssistantLogo` | `useShellStore`          | The GenUI assistant-message components, which read `agentName`/`logoUrl`/`showAssistantLogo` from here |

Both are seeded from the same `logoUrl`/`agentName` and kept in sync to props via effects, but
their `isWorkspaceOpen` defaults differ and they are **not** cross-synced. See
[Gotchas](#gotchas--known-rough-edges).

Plus three React contexts:

- **`NavContext`** (`_shared/navContext.tsx`) — `{ path, navigate }`. `useNav()` (throws outside the
  tree) and `useOptionalNav()` (returns `null`).
- **`StartersContext`** (`_shared/startersContext.tsx`) — inherited `starters` + `starterVariant`.
- **`LayoutContext`** (`../../context/LayoutContext`) — `"mobile" | "tray" | "fullscreen"`, derived
  from the container's measured width.
- **`SidebarVisualStateContext`** (`Sidebar.tsx`) — the sidebar's animation state machine
  (`expanded`/`collapsing`/`collapsed`/`expanding`) so items know when to show collapsed tooltips.

### Composer draft lifecycle

Both built-in composers replace their textarea after submitting a draft that used IME
composition. This prevents late input events from the submitted composition from restoring
the cleared draft. The composition marker lasts until submission because a final input event
can arrive after `compositionend`. Ordinary typed drafts keep their textarea, and a reset
preserves focus only if the replaced textarea still owned it. Controlled welcome composers
continue to report the clear through `onChange`, and their `inputRef` points to the new textarea.

---

## Navigation & routing

Navigation is a single `path: string | undefined` string held by `NavProvider`, with the standard
controlled/uncontrolled split:

- **Uncontrolled** (default): internal state starts at `defaultPath`.
- **Controlled**: pass `onNavigate` (its presence flips the switch) and own `path` yourself.
  (`Routing` and `ControlledRouting` stories.)

`path === undefined` ⇒ the thread view. Any other string is matched in this order:

1. **Reserved artifact paths** (`_shared/artifactPaths.ts`), matched first:
   - `artifacts/{category}` → searchable list (`ArtifactBrowserPage`)
   - `artifacts/{category}/{id}` → full-page view (`ArtifactViewPage`)
   - `{category}` is URI-encoded, or the literal `all` when no categories are configured.
   - Build them with `artifactListPath(name?)` / `artifactViewPath(name, id)`; parse with
     `parseArtifactPath`. **Controlled consumers must round-trip these paths verbatim.**
2. **User `<AgentInterface.Route path="…">`** — exact match only (no params/wildcards in v1). The
   route's children replace the _entire_ thread region (header, messages, composer all hidden).
   Multiple `Route` siblings are supported.

`SidebarItem` integrates with nav: give it a `path` and it calls `navigate(path)` on click and
auto-selects when `nav.path === path` (override with the `selected` prop). On mobile it also closes
the sidebar after navigating.

---

## Message rendering pipeline

Entry point is `<Messages>` (in `Thread.tsx`), rendered inside `<ScrollArea>`:

```
<Messages>
  messages.map → <MessageProvider><RenderMessage …/></MessageProvider>
  if isRunning → loader (<MessageLoading/>)
  else if threadError → <ThreadError/>   (Callout, "Something went wrong")
```

`RenderMessage` (memoized) switches on `message.role`:

- **`tool`** → renders `null` (tool output is rendered _inline under its parent assistant message_).
- **`assistant`** → `components.AssistantMessage` if provided, else
  `AssistantMessageContainer › AssistantMessageContent`.
- **`user`** → `components.UserMessage` if provided, else `UserMessageContainer › UserMessageContent`.
- **other roles** (`system`/`developer`/`reasoning`/`activity`) → skipped.

### Assistant content + tool calls

`AssistantMessageContent`:

1. Renders `message.content` via `<MarkDownRenderer>`.
2. Renders each `message.toolCalls[]` as a `<ToolCallComponent>` (the call bubble).
3. **Pairs tool results**: scans `allMessages` for the run of consecutive `role: "tool"` messages
   immediately after this assistant message, matches each `toolMessage.toolCallId` back to a
   `toolCall`, and dispatches to `<ToolMessageRenderer>` (falling back to `<ToolResult>` when no
   renderer matches). _(This pairing is O(n) per message and is a known cleanup target — see
   Gotchas.)_

### Tool → artifact renderer dispatch

`ToolMessageRenderer` (`_shared/tool-renderer/`) looks up `toolCall.function.name` in the
`artifactRenderers` registry:

- **No match** → renders the `fallback` (`<ToolResult>`).
- **Match** → `<RendererInstance>`, which:
  1. runs `renderer.parser({ args, response }, { isStreaming })` → `{ props, meta } | null`,
  2. if `meta` is present, registers the artifact in ThreadContext (so it appears in the Workspace
     rail) and unregisters on unmount,
  3. renders `renderer.preview(props, controls)` **inline** + a `<DetailedViewPanel>` containing
     `renderer.actual(props, controls)` for the side panel.

`RendererInstance` carefully keeps an open detailed view alive as a streamed artifact's `viewId`
transitions from a temporary `useId()` to its real `${id}:${version}`, and re-points the active view
when an edit bumps the version onto a _new_ instance.

### User content

`UserMessageContent.tsx` handles the **full AG-UI `InputContent` union** (`text | image | audio |
video | document | binary`):

- String content → stripped of `<content>`/`<context>` sentinel wrappers (`separateContentAndContext`).
- Array content → each part resolved by `resolveInputPart()` into a render-ready descriptor, then
  rendered in array order (preserving text/media interleave).
- **Security is built in**: every URL is vetted by `sanitizeUrl` (only `http(s):` + allowlisted
  `data:`), base64 `data:` URIs by `buildDataUri` (`ALLOWED_DATA_MIME` = image/audio/video + PDF
  only — `text/html` and arbitrary `application/*` are deliberately excluded as XSS surface).
- Media renders as `<img>`/`<audio>`/`<video>` (lazy, with `onError` → file chip); everything else,
  or any failed/blocked source, degrades to a **downloadable file chip** rather than being dropped.
- A `default: never` exhaustiveness guard makes any new union member a compile error.

---

## Artifacts, the Workspace rail & DetailedView

There are two distinct artifact surfaces, easy to confuse:

- **Workspace rail** (`Workspace.tsx`) — a per-thread, right-edge list of artifacts _registered by
  the current thread's tool calls_ (via `RendererInstance` → ThreadContext). Renders **nothing**
  while the registry is empty, so drop-in users without `artifactRenderers` never see it. It has
  All / Artifacts / Apps tabs (an "Apps" category is detected by `category.name.toLowerCase() ===
"apps"`), an animated tab indicator, and a mobile drawer. Clicking an item opens its DetailedView;
  the rail auto-closes while a DetailedView is open. Shown only in the thread view; hidden on mobile
  and on Route/artifact pages.
- **Artifact browser** (`ArtifactBrowserPage` / `ArtifactViewPage`) — a _global_, storage-backed,
  searchable browser at the reserved `artifacts/…` paths, driven by `storage.artifact`. The
  `ArtifactNav` sidebar entries link into it.

**DetailedView** is the resizable side panel. On desktop, `ThreadContainer` splits into a chat panel

- a `ResizableSeparator` + the detailed-view panel (`useDetailedViewResize` drives the drag and
  writes width directly to the panel ref). On mobile it becomes an overlay (`DetailedViewOverlay`).
  `DetailedViewPanel` portals its content into `DetailedViewPortalTarget`.

An `AppRenderer` (consumer-defined) is the unit that powers all of this:

```ts
{
  type: "th_dashboard",
  toolName: "th_dashboard:create",      // matched against toolCall.function.name
  parser: ({ args, response }, { isStreaming }) =>
    response ? { props, meta: { id, version, heading } } : null,
  preview: (props, controls) => <InlineCard …/>,   // shown inline in the thread
  actual:  (props, controls) => <FullView …/>,      // shown in the detailed-view panel
}
```

> The `type` strings (`th_dashboard` / `th_report` / `th_presentation`) and the `${type}:create`
> tool-name convention are **consumer conventions** mirrored on the agent side — they are documented
> by the stories, not enforced by the library.

---

## Layout & responsiveness

`Container.tsx` measures its own width (`useElementSize`) and derives a layout mode:

```
width < 768            → "mobile"     (.openui-agent-container--mobile)
width > 768            → "fullscreen"
width === 768 (exact)  → "tray"       (only a 1px window; rarely hit, has no CSS; see Gotchas)
```

The breakpoint is currently a **hardcoded `768`** with a `// TODO: revisit this logic`.

Responsiveness is **class-driven, not media-query-driven.** The dominant mechanism is the ancestor
selector `.openui-agent-container--mobile &` (plus `--detailed-view-active`), used throughout the
SCSS. There are only two real `@media` queries in the whole component (and one of them is currently
a no-op). If you need responsive behavior, prefer the layout class over adding a breakpoint.

---

## Styling & theming

### Tokens

Every SCSS partial starts with `@use "../../cssUtils" as cssUtils;` and references **design tokens**
as Sass aliases that compile to CSS custom properties:

```scss
padding: cssUtils.$space-m; // → var(--openui-space-m)
color: cssUtils.$text-neutral-primary; // → var(--openui-...)
border-radius: cssUtils.$radius-xl;
@include cssUtils.typography($family, $variant); // font shorthand
```

- The token prefix is **`openui`** (not `crayon`). `cssUtils.scss` + `openui-defaults.scss` are
  **auto-generated** — don't hand-edit them. They emit `:root` custom properties (including a
  `prefers-color-scheme: dark` block) plus the `$alias` Sass layer.
- **Color discipline is total:** there are _zero_ hardcoded hex/rgb/oklch values in the component.
  Always go through a token. Radii, shadows, and most spacing are tokenized too.
- **Theme** consumers override `--openui-*` custom properties (via `theme` → `<ThemeProvider>`, or
  their own CSS).

### Build / aggregation

```
AgentInterface/agentInterface.scss   @use's the 11 root + components/ partials (sidebar, threadlist,
                                     thread, mobileHeader, resizableSeparator, conversationStarter,
                                     welcomeScreen, components/composer, components/desktopWelcomeComposer,
                                     artifactBrowser, workspaceSidebar) + the .openui-agent-container rules
   → components/index.scss           @forward "./AgentInterface/agentInterface.scss";   (line 44)
      → components/index.css          the shipped aggregate
```

Two things that chain does **not** include:

- The **detailed-view** styles (`_shared/detailed-view/*.scss`) actually ship via the _library-wide_
  `components/_shared/shared.scss` (forwarded at `components/index.scss` line 61), **not** via
  `agentInterface.scss`.
- `AgentInterface/_shared/shared.scss` is currently **orphaned** — nothing `@use`s / `@forward`s it.

There is **no** `src/styles/agentInterface.scss` entry, so AgentInterface ships only inside the
aggregate `components/index.css` — it has no granular per-component CSS twin, and is therefore **not
importable on its own** via the `./layered/styles/*` granular paths. (See Gotchas.)

### Layered CSS opt-in

The `@layer openui { … }` wrapping is applied **at build time** by `cp-css.js` (it mirrors the
unlayered output into `dist/layered/**`). **Do not write `@layer` in source SCSS** — none exists
today, and that's correct.

### Conventions when adding styles

- State via **BEM modifiers** (`--collapsed`, `--selected`, `--active`, `--animating`) and
  **data-attributes** (`[data-sidebar-visual-state]`, `[data-drafting]`, `[data-overflow-*]`).
- `:has()` is used for cross-component layout coordination.
- Hoist local layout/motion constants as `$vars` at the top of the partial (see `sidebar.scss`,
  `workspaceSidebar.scss`, `composer.scss` for the pattern).
- New partial? Add a `@use "./yourFile.scss";` line to `agentInterface.scss`.

---

## Directory guide

```
AgentInterface/
├ AgentInterface.tsx        Root: props, extractSlots, provider stack, AgentInterfaceBody view switch
├ Container.tsx             Flex shell; width→layout mode; mounts the two stores + LayoutContext + Tooltip.Provider
├ Route.tsx                 Slot marker for routable views (renders null; consumed by parent)
├ Sidebar.tsx               SidebarContainer/Header/Content/Separator + collapse/expand state machine
├ SidebarItem.tsx           Styled, nav-aware clickable row (exported)
├ SidebarSlot.tsx           The <AgentInterface.Sidebar> slot marker
├ SidebarTooltip.tsx        Collapsed-sidebar tooltip (right/center, fixed offset)
├ ThreadList.tsx            Date-grouped thread history + per-thread menu
├ Thread.tsx                ThreadContainer, ScrollArea, Messages, RenderMessage, ThreadHeader, ThreadError, loader
├ UserMessageContent.tsx    Full AG-UI InputContent union renderer (+ URL/data allowlists, file chips)
├ MobileHeader.tsx          Mobile top bar
├ NewChatButton.tsx         New-chat affordance
├ Composer.tsx              Thin re-export of components/Composer
├ ConversationStarter.tsx   Starter chips ("short" | "long" variant)
├ WelcomeScreen.tsx         Empty-state hero (title/description/image/starters or children)
├ Workspace.tsx             Per-thread artifact rail (tabs, sections, mobile drawer)
├ ArtifactBrowserPage.tsx   Global searchable artifact list (also exports preview/format helpers)
├ ArtifactNav.tsx           Sidebar category nav into the browser (exported)
├ ArtifactViewPage.tsx      Full-page artifact view
├ ResizableSeparator.tsx    Keyboard+ARIA resize handle for the detailed-view split
├ useDetailedViewResize.ts  Drag/keyboard resize logic (writes panel width imperatively)
├ components/               Composer + DesktopWelcomeComposer (and their SCSS)
├ _shared/
│  ├ store/                 AgentInterfaceStore (sidebar/workspace/agentName/logoUrl)
│  ├ navContext.tsx         NavProvider / useNav / useOptionalNav
│  ├ startersContext.tsx    StartersProvider / useStartersFromContext
│  ├ artifactPaths.ts       Reserved artifacts/… path build+parse
│  ├ tool-renderer/         ToolMessageRenderer + RendererInstance
│  ├ detailed-view/         DetailedViewOverlay/Panel/PortalTarget
│  ├ types/                 AssistantMessageComponent / UserMessageComponent
│  ├ utils/                 misc helpers
│  └ AgentInterfaceTooltip.tsx, GalleryHorizontalEndIcon.tsx
├ *.scss                    Co-located styles (aggregated by agentInterface.scss)
└ stories/                  Storybook — the de-facto usage reference
```

> Note: `_shared/` here is **AgentInterface-local**. The sibling `components/_shared/` is a
> **library-wide** shared dir (used by `OpenUIChat` too). Container pulls the `ShellStore`
> from the library-wide one; everything else AgentInterface uses comes from its own local `_shared`.

---

## Extending the component

**Add a new top-level slot**

1. Create the component and export it.
2. Attach it as a static member at the bottom of `AgentInterface.tsx`
   (`AgentInterface.MyThing = MyThing;`) and add it to the `AgentInterfaceComponent` interface.
3. Add `[MyThing, "myThing"]` to `SLOT_KEY_BY_TYPE` and a `myThing?: ReactElement` field to
   `ExtractedSlots`.
4. Render `slots.myThing ?? <Default/>` in the appropriate branch of `AgentInterfaceBody`.

**Add a custom message renderer** — pass `components={{ AssistantMessage, UserMessage }}` (replaces
default rendering entirely), or a `componentLibrary` for GenUI auto-derivation.

**Add an artifact type** — define an `AppRenderer` (`type` + `toolName` + `parser`/`preview`/`actual`),
pass it in `artifactRenderers`, and optionally group it via `artifactCategories`. The agent emits a
tool call named `toolName`; the rest is automatic (inline preview, workspace entry, detailed view).

**Add a route** — drop `<AgentInterface.Route path="/x">…</AgentInterface.Route>` as a child and
navigate to `/x` (e.g. a `SidebarItem path="/x"`).

---

## Gotchas & known rough edges

These are real, current sharp edges — worth knowing before you touch the area. Deeper analysis and
prioritization live in `.workspace/2026-06-21-agentinterface-study.md` and
`.workspace/2026-06-21-usermessagecontent-research.md`.

- **Slot identity** — see the warning above; `memo`/HOC/duplicate-module wrapping silently drops a
  slot. Use the canonical `AgentInterface.*` members.
- **Two stores** — `AgentInterfaceStore` vs library `ShellStore` are mounted side by side with
  diverging `isWorkspaceOpen` defaults and no cross-sync. Read from the right one (chrome →
  `useAgentInterfaceStore`; assistant-message logo/name → `useShellStore`).
- **Local vs library `_shared`** — `tool-renderer`, `detailed-view`, `types`, `utils` exist in both
  `AgentInterface/_shared/` and the library-wide `components/_shared/`. They overlap; confirm which
  one you're importing.
- **Hardcoded values** — the `768` breakpoint (`Container.tsx`), the "reading column" widths
  (`880`/`800`px repeated across several partials), chat-resize clamps (`useDetailedViewResize.ts`,
  where `MIN === INITIAL` so the panel can't shrink below its initial width), motion durations/
  easings, the z-index ladder, and a duplicated scrollbar block are all candidates to lift into
  shared tokens/props.
- **English-only strings & aria-labels** — placeholders, `"New Chat"`, workspace tab labels, date
  groups, and many aria-labels are baked English with no i18n surface. `ArtifactNav` even derives a
  category's icon-background class by matching the English label.
- **`logoUrl`/`agentName` default to `""`** — omitting them yields an empty-looking header.
- **`prefers-reduced-motion`** is not honored anywhere despite heavy animation.
- **`tray` layout** (exact integer width `768`) adds no CSS class and is only reachable in a 1px
  window — `width` is `element.clientWidth` (an integer), so `768` is attainable but rare. Treat with care.
- **Typography token (fixed in `4c801739`)** — earlier code passed the invalid
  `typography(primary, default)` (there is no `primary` category, so it emitted no `font`).
  `thread.scss` and `artifactBrowser.scss` now correctly use `typography(body, default)`. Other
  components outside AgentInterface may still carry the invalid call — a separate per-site sweep.

> ⚠️ Historical note: an earlier study claimed `UserMessageContent` was incomplete (text+binary
> only). That is **no longer true** — `UserMessageContent.tsx` now implements the full `InputContent`
> union with allowlists and chip fallbacks, and it is wired into `Thread.tsx`. Trust the code.

---

## Local development

- **Stories / visual reference:** `stories/AgentInterface.stories.tsx` (run the package's Storybook).
  The stories use mock LLM/storage helpers from `__test-helpers/mockChat`.
- **Styles:** edit the co-located `*.scss`; new partials must be `@use`d from `agentInterface.scss`.
  Never edit the generated `cssUtils.scss` / `openui-defaults.scss`.
- **Tokens:** if you need a value, check for an existing `$space-*` / `$radius-*` / `$text-*` token
  before introducing a literal.

```

```
