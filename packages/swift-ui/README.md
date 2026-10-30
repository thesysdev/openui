# swift-ui

The native SwiftUI adapter for OpenUI Lang. It depends on the sibling `OpenUILang` SwiftPM product; applications supply component views and tool transports. The dependency direction is `swift-ui → swift-lang → lang-core`. The SwiftPM product and module are `OpenUISwiftUI`.

See [component authoring](COMPONENTS.md), the [standard catalog](NATIVE-COMPONENTS.md) and the [design and validation boundaries](UI-DESIGN.md) for the public API. SDK regressions are in `Tests/OpenUISwiftUITests`.

For matched schema/native registrations, host-authored named slots, semantic themes, message-scoped resources and the optional standard component collection, see [component authoring](COMPONENTS.md). `OpenUIStandardComponents.library()` supplies an opt-in reference catalog; extend this library when adding product definitions, preserving imported field order; applications can extend or override it while existing dictionary registrations remain supported.

The standard collection defaults to neutral native typography, grouped forms and explicit control feedback. See the [UI design contract and native captures](UI-DESIGN.md). Host accents remain opt-in through `OpenUITheme`; no component override is needed to obtain the default design.

Composition programs, preview applications and Simulator acceptance captures are maintained separately from this SDK-only distribution. They consume the installed registry and unchanged language runtime; they are not library dependencies or part of the SDK unit-test suite.

## Installation

The repository-root `Package.swift` exposes `OpenUISwiftUI` and `OpenUILang`.
Select `OpenUISwiftUI` for native rendering; it includes the language dependency.
Swift 6 tools, iOS 16+ and macOS 13+ are required.

To develop or review the SDK before release, add the repository checkout as a
local package in Xcode, or use:

```swift
.package(path: "../openui")
```

A consuming package target selects:

```swift
.product(name: "OpenUISwiftUI", package: "openui")
```

```swift
import OpenUILang
import OpenUISwiftUI
```

After the SDK is merged and released, use `https://github.com/thesysdev/openui.git`
in Xcode's **File > Add Package Dependencies** and select a release containing
the Swift SDK. For other distributions, use the repository URL and version
listed in that distribution's release notes.

For a language-only consumer, select `OpenUILang`. The nested manifests in
`packages/swift-lang` and `packages/swift-ui` are local development entry points;
use either the root package or the nested packages in an application's dependency
graph. Consumers do not need Node.js to build the checked-in runtime and UI resources.

## Optional native map

`OpenUIStandardComponents.library()` retains the 82 pinned upstream registrations.
When an app needs a map in an `openui-lang` answer, use the SDK extension:

```swift
let installed = try OpenUIMapComponents.library(
    id: "my-agent", basemapCoordinateSystem: .gcj02)
let schema = installed.library.toSchema()
let registry = installed.registry
```

The resulting library has 83 definitions: the original 82 plus `Map`. Its Schema,
prompt and native registry come from the same library. An app can keep the Map
renderer installed while deriving a generation subset with the existing
`Library.extend(removeComponents:)` API. `Map` is also accepted in `Card`,
`TabItem` and `AccordionItem` slots through the core's existing extension rule.

`Map(points, routes?, value?, size?, crs?, content?)` accepts supplied `{id,title,lat,lng}`
points, optional subtitle/imageSrc/url, and routes as arrays of actual `{lat,lng}`
vertices. `value` may bind to a local `$selected` point id; `size` is compact,
regular or expanded. `crs` declares the input coordinates (`wgs84` by default,
or `gcj02`). Set `basemapCoordinateSystem` to the coordinate system your
MapKit basemap displays in the region. The SDK converts only this platform
coordinate representation. It does not fetch places, geocode, calculate paths,
or draw a route when no polyline was supplied.

Map is a general spatial component. Valid supplied points automatically receive
compact place cards inside the map's bottom edge: title plus available subtitle
and image. Missing optional facts consume no space; no score, route or business
fact is inferred. Markers use compact icon logos, not rating badges. Optional
`icon` is an SF Symbol name; the default is a location symbol.

Swiping cards and selecting markers share `value`. The map viewport follows the
container width and declared size; card measurements do not increase map height.
Pages use their measured content height and scroll vertically only when they
exceed the available area. Camera padding reserves the visible card height.
With no valid point or route the component renders no
map. Explicit routes can render without place cards. Optional `content` overrides
pages by point id with ordinary components; missing overrides use default facts,
while an empty object or explicit null page hides the corresponding cards.
Map does not geocode or calculate routes. The caller supplies factual coordinates
and declares their CRS.

## Optional web and contextual content

SVG and WebView are included in `OpenUISwiftUI` and remain opt-in component
registrations. Importing the UI module alone does not expose them to the model:

```swift
import OpenUISwiftUI
let native = try OpenUIPopoverComponents.install(into: OpenUIMapComponents.library())
let installed = try OpenUIWebComponents.install(into: native)
```

Popover is a pure SwiftUI extension. SVG and WebView use WebKit inside the same
UI target; page JavaScript is disabled by default and can be enabled by host policy.
All native media use `OpenUIResourceContext`; WebKit owns its document subresources.
The base product also uses a private WebKit renderer for offline mathematical
equations. It does not register a general web component.

## Rich text and source citations

`TextContent` uses the upstream Markdown extensions for tables, line breaks,
citations and mathematics. `MarkDownRenderer` retains its basic Markdown mode.
Text and media captions use the upstream inline Markdown rules. Paragraphs,
tables, links and code blocks are native SwiftUI views; fenced code shares the
standard `CodeBlock` renderer and copy action.

Provide citation metadata with `CardSourceProvider(sources: [...]) { ... }`,
using `CardSource(url:title:sourceName:)`. This is a typed host context rather
than another language component. Valid numbered citations open a native source
list and route links through the host's `openURL` environment.

Remark and KaTeX are bundled as static JavaScript resources and run in
JavaScriptCore. Only equation layout is rasterized by a message-owned,
nonpersistent WebKit view. Fonts are embedded and no external equation resource
is loaded. Consumers do not need Node.js or npm to build or run the Swift package.

## Responsive composition

The host offers a container width. Text measures and wraps within that proposal;
containers measure their children and grow with content. `Stack`/`Card` preserve
the program's row/column direction. With `wrap=true`, a row flows onto additional
lines when the children no longer fit. It does not invent a different composition
based on image count or business meaning. Adaptive grids choose a column count
from available space; Carousel pages are measured synchronously at the current container width; Table
keeps aligned component columns and horizontal scrolling when necessary.

Standard Table accepts registered cell components, matching the upstream library.
Hosts can opt into a read-only comparison policy on a rendered subtree:

```swift
OpenUIRenderer(state: state, registry: installed.registry)
    .openUITableCellPolicy(.readOnly)
```

The read-only policy permits text/numbers and 11 lightweight components, applying
the same reduced registry recursively through Stack, arrays and Popover. A custom
policy can name another registered subset. Outside this opt-in subtree the full
component library remains available; the language and Col contract are unchanged.

Prompt generation forwards the supplied core options without hidden additions:

```swift
let prompt = installed.prompt()
```

Hosts that opt into a narrower table policy should make their own generation
policy consistent with the rendering policy.

Native Layout handles measured baseline, stretch and main-axis distribution on
the minimum supported iOS 16/macOS 13 versions. There is one layout implementation;
older stack/grid approximations have been removed.
Accessibility text and parent width are environment inputs, not screen-global
breakpoints. The 82-component schema has no CSS/media-query or arbitrary flex-weight
API. A fixed row should therefore not be described as automatic column reflow.

The standard 82 registration names and their parameter contracts stay intact.
Visual design belongs to the SDK's shared theme and native presentation; it can
improve on upstream styling without renaming components or dropping capabilities.
Image follows the reference's 3:2/fill default; ImageBlock and ImageTextLarge use
that same theme cover role. Document illustrations in Markdown and original-image
viewing retain complete source proportions. ImageText accepts an explicit imageSize in both
orientations, and Table paginates at ten rows. Design defaults
are distinct from imposing a native-only 40% table-column cap or ignoring a field.

## Usage

```swift
import SwiftUI
import OpenUILang
import OpenUISwiftUI

@MainActor
struct OpenUIScreen: View {
    @StateObject private var state: OpenUIState

    init(schema: LibrarySchema) {
        _state = StateObject(wrappedValue: OpenUIState(schema: schema))
    }

    private var registry: ComponentRegistry {
        [
            "Stack": { element, registry in
                AnyView(VStack(alignment: .leading) {
                    RenderValue(PropValue.value(element, "children") ?? .array([]), registry: registry)
                })
            },
            "Text": { element, _ in
                AnyView(Text(PropValue.string(element, "text") ?? ""))
            },
            "Button": { element, _ in
                AnyView(Button(PropValue.string(element, "label") ?? "") {
                    Task {
                        let events = await state.triggerAction(
                            PropValue.string(element, "label") ?? "",
                            action: PropValue.value(element, "action"))
                        // Route these events to the application's navigation/chat.
                    }
                })
            }
        ]
    }

    var body: some View {
        OpenUIRenderer(state: state, registry: registry)
            .onAppear {
                state.setSource("root = Stack([Text(\"Hello\")])")
            }
    }
}
```

The example's schema must declare those components and their positional props. Models receive the matching LibrarySpec/prompt, and clients register views under the same component names.

## State and interaction

`OpenUIState` is an `@MainActor ObservableObject`. It publishes `root`, `errors`, completion status, and Query/Mutation states.

- Feed chunks using `push`, then `complete`. A push after completion starts a fresh stream.
- `setSource(_:streaming:)` replaces source while retaining user state. `applyPatch` merges a completed patch; source replacement invalidates pending action plans.
- Read/write state using `stateValue`, `setState`, `snapshotState`, and `restoreState`. Snapshots use lossless `OpenUIString` keys; native String convenience methods remain available. Pass `persistedState` during initialization to restore a previous response.
- `binding(for:prop:)` creates a native `Binding<Value>` for both a `$variable` binding and a write transform such as `$count = $value + 1`.
- For application form components, use `fieldValue`, `setFieldValue`, `fieldBinding`, and `initializeField`. Call initialization when a field mounts; existing persisted or user-entered values win. Pass the nearest form's name to dispatch, preserving the application's form scope.
- `perform(_:formName:)` runs an ActionPlan. `triggerAction(_:formName:action:)` also supports a button's default message and legacy action objects. Plain data cannot impersonate a declared custom action.
- Choose returned events **or** `onAction` for host routing to avoid dispatching twice. `onStateUpdate` supplies snapshots for host-owned persistence.

Queries show defaults during streaming and start automatically after completion. Relevant state/argument changes trigger synchronization; equivalent requests share a cache. Refetch retains the previous value, stale results are discarded, and timers are removed when declarations disappear. Explicit `runQuery` and `@Run(query)` refetch; mutations run only when requested, reject concurrent submission, and halt a plan on failure. Reset/source replacement prevents an old mutation from continuing into a different response.

The optional standard collection supplies native Form/Input/selection/date/slider controls, field registration, validation feedback and primary-submit blocking. These views use the existing runtime store and core validators. Applications can override them. See the [native component contracts](NATIVE-COMPONENTS.md) for exact arguments, value shapes, supported reference contracts and remaining limits.

`onParseResult` observes source parsing; state edits do not emit a new parse result. `onError` observes diagnostic changes, including recovery and reset. `sourceRevision` and component contexts guard against callbacks from a replaced response. Components disable actions and field writes until streaming completes.

Use the upstream `Button(label, action)` for host navigation. The extra NavigationLink/OpenUINavigationComponents registration is removed. The application routes its existing ActionEvents to maps, itinerary or other destinations and shares the same runtime across expanded surfaces.

## Rendering

- `OpenUIRenderer` owns the observed state subscription and injects the state as an environment object.
- `RenderNode` renders a registered element. `RenderValue` handles elements, strings, numbers, booleans, and nested child arrays. Explicit key/id/resourceId props retain exact UTF-16 identity through reordering; named statements retain statementId. Anonymous children require explicit keys for stateful reordering.
- `PropValue` exposes raw values, display strings, element-only children, and action plans. `PropValue.string` repairs isolated surrogates for SwiftUI display; `PropValue.codeUnitString` retains exact units. Display conversion does not write back into state. Use `RenderValue` for heterogeneous or nested children.
- `ElementErrorBoundary` retains the latest registered element if input becomes unavailable. SwiftUI has no general boundary for catching framework crashes or `fatalError`; this view does not make unsafe host builders recoverable.
- `QueryView` shows a spinner while loading and can retain last-good/default data on failure. Inspect published errors for application-specific error presentation.

## Development

Requires Swift 6, with Swift 5 source language mode. Deployment targets are macOS 13+ and iOS 16+.

```sh
swift test --package-path packages/swift-ui
swift build --package-path packages/swift-ui \
  --scratch-path /tmp/openui-ios-build \
  --triple arm64-apple-ios16.0-simulator \
  --sdk "$(xcrun --sdk iphonesimulator --show-sdk-path)"
```

For Xcode GUI builds, open `Package.swift` or an application that consumes the package and choose an Apple destination. Package tests, a consuming application’s Simulator checks, and physical-device runs are distinct validation scopes. The SDK-only branch does not include the separate preview/acceptance application.

The repository's `Build Swift` workflow configures package suites and the iOS Simulator compile on macOS, using the bundled shared core. The JavaScriptCore adapter targets Apple platforms. This is independent of pnpm/npm packaging. A local consumer can use `.package(path: "../openui/packages/swift-ui")` and select the `OpenUISwiftUI` product.

Native value and ToolProvider interfaces are documented in the language package.
The remote package identity is `openui`, with products `OpenUILang` and
`OpenUISwiftUI`. The nested `swift-lang` and `swift-ui` packages remain local
SDK development entry points.

Maintainers rebuilding the rich-text resources use Node.js at development time:

```sh
cd packages/swift-ui/scripts/rich-text
npm ci --ignore-scripts
npm run build
```

Commit the generated resources, dependency lockfile and license notices together.
`rich-text-manifest.json` records the pinned upstream sources, dependency versions,
resource hashes and embedded font count. npm is not invoked by SwiftPM or the app.


## Scoped resources and embedded content

Apply `.openUIResourceContext(OpenUIResourceContext(baseURL: ...))` once to the
renderer. Image, ImageBlock, ImageText, ImageTextLarge, ImageGallery, ListItem,
Visual/Context cards and Markdown image destinations inherit it. It resolves
relative URLs while preserving the original language and action values. The
public `OpenUIResourceLoading` protocol supplies both request construction and
async transport (for example authorization or an application-owned resolver).
The default uses URLSession, accepts HTTP(S), and treats HTTP failures as failures.
A changed request cancels the previous load; an obsolete result cannot replace
current content. Gallery previews share the same loaded resource.

`OpenUIPopoverComponents.install(into:)` registers the native Popover extension.
`OpenUIWebComponents.install(into:)` from `OpenUISwiftUI` registers
SVG and WebView. They do not change the 82 upstream component contracts.
SVG accepts an inline XML document or resource URL and preserves its viewBox.
WebView accepts HTML or a URL, measures content by default, and uses a scrollable
viewport when height is supplied. Both use WebKit's standard document renderer.
Page JavaScript is disabled by default and enabled only through
`.openUIWebPolicy(OpenUIWebPolicy(allowsJavaScript: true))`; there is no model-to-native
script action bridge. WebKit owns document subresource loading; the shared resource
context supplies base URLs and top-level requests, while native image and remote
SVG data use the injected async transport. Popover accepts any ordinary trigger
and content, so icons and concise labels can expose optional context without
inserting content into the document flow.

Chart inspection is anchored within the chart. Tap selects/deselects a datum;
a deliberate hold supports scrubbing while ordinary vertical swipes still scroll.
Map content is ordinary components keyed by point id, presented inside its lower
edge as swipeable content without page controls. The native camera reserves the
measured content inset. Supplied place facts create compact default cards when
custom component pages are absent; no missing facts or ratings are invented.

`OpenUIState.onActionEvaluation` is an optional diagnostic hook exposing the real
action AST, source revision, prior state and evaluated value before the state write.
It does not re-evaluate the expression or replace core action semantics.


## Upstream presentation state during streaming

Tabs always use a horizontally scrollable label row, including a single item.
Selection follows the pinned React renderer: before a user changes the active
value, the last panel whose JSON-serialized content length grows becomes active.
The complete initial snapshot uses the same rule. A manual value change stops
automatic following; removing that value does not invent a fallback. Accordion
opens the newest item as the item count grows until the user opens or closes one.
These are renderer-local states, without extra component parameters or DSL state.
Local tab, disclosure, carousel and table browsing remain available while form
writes and business actions wait for streaming completion.

Native component-local state is scoped to `OpenUIState.presentationRevision`.
`push`, `complete`, growing full-buffer `setSource` snapshots and `applyPatch`
retain it. A new program/reset replaces it at the common component-host boundary.
Store values retain their existing core semantics. Anonymous child identities
preserve their original array paths around null/undefined slots; declared
runtime-provided statement ids and schema-defined keys retain semantic identity.
Carousel retains its outer page groups and current page on appends; unkeyed page
reordering remains positional. Table calculates a safe visible page while retaining
the upstream current-page state when rows temporarily disappear. Gallery resource keys include the resolved
request and loader identity; appending photos does not clear previously loaded
photos or selection.


Image loading and failure use the same declared slot as successful images:
thumbnail dimensions, cover aspect ratios and background bounds are preserved.
The standard Image reserves its cover before decoding, without a separate 4:5
row mode or shared resource-level thumbnail cap. A local container with an
unresolved positional direction can still reserve a compact 3:2 proposal until
its direction arrives. Markdown document illustrations can still
use intrinsic source proportions; their unresolved placeholder ratio is not
inferred from URLs. Original-image viewing uses fit rather than the cover crop.

Snippet cards retain their compact left-label/right-value structure. Their
adaptive grid gives a row enough room instead of changing it into a vertical
product card. Overview metrics use the inline metric typography role. Grid items
align at the top; EntityList allocates short values their intrinsic width. These
presentation rules do not branch on business labels or values.
