# SwiftUI SDK structure

`OpenUISwiftUI` remains one SwiftPM product and one Swift module. Directories
separate responsibilities; they do not create additional runtime layers.

```text
Sources/OpenUISwiftUI/
  Components/     Native component views and their presentation helpers
  GenUILib/       OpenUI definitions, view bindings, registry assembly and catalog
  Context/        Shared component context and environment scopes
  Theme/          Default tokens, typography, palettes and theme application
  Internal/       Resource/localization helpers, rich-text engine and identity helpers
  Resources/      Bundled data, scripts, licenses and localization files
  Renderer.swift  Public renderer entry point
  RenderNode.swift / RenderValue.swift / QueryView.swift / ErrorBoundary.swift
  OpenUIState.swift / Resources.swift / NativeStringBridge.swift
```

## Responsibilities

- `OpenUILang` owns language parsing, evaluation, schema/prompt generation and
  language state. It has no dependency on SwiftUI or its theme.
- `Theme` defines appearance values and how a subtree receives them. It does
  not inspect the generated document or infer business-specific styling.
- `GenUILib` associates ordered component definitions with native builders.
  The exported schema and prompt describe those definitions.
- `OpenUIState` bridges language state to the application; the resource layer
  owns message-scoped loads. The rendering entry points traverse evaluated
  values and use `Context` for identity and interaction eligibility.
- `Components` implements presentation and interactions in a flat directory.
  A shared presentation helper is not automatically registered as a model-facing
  component. Registrations are assembled under `GenUILib`.

The reference React implementation separates component definitions in
`genui-lib`, shared context/runtime, and component views. Swift keeps those
responsibilities within its native module, using SwiftUI Environment rather than
CSS custom properties. `Components` and `GenUILib` follow that same separation. React-specific hooks
and CSS utilities are not reproduced, and components are not split into
additional SwiftPM packages or targets.

## Theme application

There are two explicit ways to apply a theme:

```swift
// A complete value replaces the theme within this subtree.
renderer.openUITheme(appTheme)

// An update starts with the inherited theme and changes only these fields.
renderer.openUITheme { theme in
    theme.spaceM = 16
    theme.typography.body.size = 17
}
```

The update overload uses SwiftUI's `transformEnvironment`; it does not keep a
second theme store or merge theme values in individual components. Parent and
sibling scopes remain unchanged. The complete-value overload keeps its existing
replacement semantics.

Appearance tokens include colors, typography, spacing, radii and effects.
Native media metrics, control hit areas and motion settings remain accessible
through the existing theme entry point, but are documented as native presentation
settings. They do not alter the OpenUI Lang component definitions.

## Component style selection

Component parameters select existing styles: for example `gap="m"` reads the
current `spaceM`. Fixed semantic values remain fixed: `gap="none"` is zero even
if `space000` is overridden. No positional parameters are added or reordered.

Body text styles are independent of heading styles:

| Component presentation | Typography role |
| --- | --- |
| TextContent default / small / large | body / detail / bodyLarge |
| TextContent small-heavy / large-heavy | detailHeavy / bodyLargeHeavy |
| Text sm or md / xs / lg | body / detail / bodyLarge |
| BoldText sm or md / xs / lg | bodyHeavy / detailHeavy / bodyLargeHeavy |
| ImageTextLarge title | bodyHeavy |
| Markdown strong text | bodyHeavy weight, keeping its surrounding text size |
| Markdown headings | display / title / heading |

The corresponding reference styles are the body-default/small/large and heavy
text styles, and the separate heading styles. Customizing a heading does not
restyle body emphasis. Default sizes and weights stay the same as the preceding
theme-convergence implementation.
