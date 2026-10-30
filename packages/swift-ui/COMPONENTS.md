# Native component authoring

`OpenUILang` and `OpenUISwiftUI` keep their names and dependency direction. The optional standard collection and authoring helpers live in `OpenUISwiftUI`; the parser does not import SwiftUI or product types. Existing dictionary-based `ComponentRegistry` registrations still work.

## Define and render

```swift
let note = OpenUIComponent(
    name: "Note",
    description: "A short note",
    params: [OpenUIParameter.string("text")]
) { context in
    Text(context.string("text") ?? "")
}
let components = try OpenUIStandardComponents.library()
    .extending(adding: [note])
let state = OpenUIState(schema: components.library.toSchema())
// Keep `state` in one stable owner for this message, such as @StateObject.
OpenUIRenderer(state: state, registry: components.registry)
```

Generate the model's prompt with `components.prompt(...)` and export the actual definition with `components.toSpec()`. The server and the other platform use that contract. Component parameter order stays explicit and follows the upstream positional language.

`OpenUIComponentLibrary.prompt` forwards options to the shared-core prompt generator.
Use `components.prompt()` for the standard prompt, or pass the official
`PromptOptions` when the caller explicitly needs additional rules or examples.

## Control the model's component scope

Keep the installed registry complete and derive the per-message library through
lang-core. For example, a host can offer a read-only subset:

```swift
let installed = try OpenUIStandardComponents.library() // 82 registered names
var generation = try installed.library.extend(
    LibraryExtension(removeComponents: ["EditableTable"])
)
// Upstream group notes describe the full catalog. Omit them in this minimal
// example; a production host can supply curated notes/examples for its subset.
generation.componentGroups = generation.componentGroups?.map { group in
    var group = group
    group.notes = nil
    return group
}
let spec = generation.toSpec()
let prompt = generateSystemPrompt(library: spec)
let state = OpenUIState(schema: generation.toSchema())
OpenUIRenderer(state: state, registry: installed.registry)
```

The same schema controls generation and parsing; the full registry can still
serve historical messages that use installed component names under their saved contracts.
Stored programs containing removed native-only names must be migrated using the
mapping in NATIVE-COMPONENTS.md, or rendered by an explicitly retained legacy host
adapter. Keeping an old Schema alone cannot restore a removed renderer. Core updates component
unions and groups on removal and rejects dangling mandatory dependencies. Plain
text notes/examples need explicit host curation; do not claim schema removal
automatically rewrites prose. No second schema-filtering framework is needed.

## Named slots

`OpenUIParameter.slot` defines an ordinary component-valued JSON Schema prop. Choose a single value or an array and optionally constrain accepted component names. In the renderer, use `context.slot("header")` or `context.render(value)`; both use the shared recursive renderer. Extend constrained slots with `extending(adding: ..., slots: ["Note": ["Notice.header"]])`. Generic Stack children already accept registered components and do not need ref-union edits.

Standard Card uses exactly the official seven parameters (`children`, `variant`, `direction`, `gap`, `align`, `justify`, `wrap`). Compose titles, images and action groups through children. Named slots belong in explicitly authored host components, such as a Notice that declares its own header; the slot helpers do not add fields to Card.

## Layout and theme

The collection contains the pinned upstream default library's 82 registrations, including chart data items and parent-consumed records; see [NATIVE-COMPONENTS.md](NATIVE-COMPONENTS.md). On iOS 16/macOS 13, row/column layout uses child measurement, real first-text baselines and distinct space-around/space-evenly distribution. Wrapped rows measure each line independently. The package minimum is iOS 16/macOS 13, so the older stack/grid approximation is not shipped. Use Stack for list/wrapping layouts and Carousel for container-width horizontal pages; these respond to their actual parent proposal, not a device-specific layout template.

Use `.openUITheme(theme)` to map semantic surfaces, foregrounds, spacing, and minimum card width to the product design system. Text uses Dynamic Type semantic fonts. There are no screen-global measurements. Override any standard component with `extending(overriding: ...)` when a product needs its own loader or view.

## State, resources and actions

`OpenUIRenderer` injects its existing OpenUIState. Registered components receive a context with binding, action execution, named child rendering, semantic theme, and message-scoped resource values. `.openUIResources(...)` supplies product data; this is a host convention, not a new OpenUI language feature or a network service. `.openUIForm(name)` forwards a form scope. Built-in Form also preserves its exact `OpenUIString` name; `context.exactFormName` and context field/action helpers retain these code units.

The component layer uses the upgraded runtime's immutable reference containers and `OpenUIString` values. `context.string(...)` is a display convenience; `context.codeUnitString(...)` and `context.value(...)` retain exact semantic data. Resource lookup also accepts `OpenUIString` and compares exact keys. Stable render keys keep canonical Unicode variants and isolated UTF-16 units distinct. Native host transports must explicitly convert or reject values their own JSON representation cannot carry; see the [language package](../swift-lang/README.md).

`OpenUIActionSurface` presents a single native button with a presentation-only label. Use it for an entire clickable resource card; do not nest other buttons in that label. `context.perform(plan)` uses the existing asynchronous runtime and host callback. The message/action overload uses the runtime's legacy/default-action dispatcher as well. `OpenUIActions.openURL(...)` and `continueConversation(...)` construct existing action plans; the host still owns navigation and business execution. Choose returned events or the state callback for host routing, never both; the standard surface uses the callback and does not route returned events a second time. Interaction stays disabled until streaming completes. Replacing source invalidates callbacks and context bindings from the previous source revision. Construct component contexts on the main actor; registered component hosts already do this.

`context.isStreaming` is the streaming flag for the current render. Component hosts pass a new snapshot when a stream completes, so indirect child views refresh even when their props are unchanged. `context.canInteract` checks the live completion state and source revision; use it to gate controls and context action helpers to dispatch guarded operations.

Custom input/form views can use context.fieldBinding, fieldValue and initializeField in the nearest `.openUIForm(...)` scope. Field initialization must happen on mount rather than while evaluating a view body.

Stateful dynamic children should declare a stable `key`, `id`, or `resourceId` prop. An explicit instance key separates duplicate presentations of one resource. Named statements retain statementId identity; anonymous positional content is suitable for static/append-only presentation, not stateful reordering. Store a message's source, library version, and runtime snapshot for history restoration.

## Local selection and navigation

Standard `Tabs(items)` owns native local selection and keeps its horizontal label
row, even for one item. `TabItem.value` is the stable identity. The renderer does
not read undeclared Tabs value/key props. A host needing another controlled
container declares its own component and renderer rather than relying on hidden
standard-component behavior.

Use `OpenUIParameter.selection` and `context.binding` for declared bindings.
Standard Select and Map can share the same variable without changing their
contracts. Expanded presentations share the existing runtime and resource scope.

Declare host actions and invoke them with standard Button/ActionPlan. Business
facts, transactions and application navigation stay with the caller. The SDK
provides native rendering, resource hooks and optional presentation capabilities.
`replacingDefinition` can reuse a native builder when the extended definition
preserves the semantics that builder implements; new behavior needs its own
renderer. Export the actual resulting LibrarySpec.

SVG/WebView and Popover live in `OpenUISwiftUI` as opt-in component extensions.
No additional SwiftPM product or module import is required. Native PromptOptions and Table cell
policies are explicit caller choices; base prompt generation and unrestricted
Table rendering retain the upstream default capabilities.
