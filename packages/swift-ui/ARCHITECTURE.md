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

`OpenUITheme` contains optional overrides. `OpenUIThemeValues` contains the
resolved values read by components. The view modifier resolves the selected
mode's defaults with the caller's overrides and injects the result through
SwiftUI Environment. No document inspection or global theme store is involved.

```swift
var light = OpenUITheme()
light.spaceM = 16
light.textBodyDefault = OpenUIFont(size: 17)
renderer.openUITheme(mode: .system, lightTheme: light, darkTheme: dark)
```

A missing dark override set reuses the light overrides. A newly declared nested
scope starts from SDK defaults, matching the pinned React ThemeProvider; it does
not merge the parent's overrides. Unmodified descendants inherit their nearest
scope. Typography roles are complete independent values, not getter/setter
snapshots of other roles. The default native fonts and reading scale are retained.

`OpenUIPresentation` is a separate environment value for native-only media
metrics, hit targets, chart axes and motion. Theme replacement does not change
it. Both values are available to native and application-defined components.

## Component style selection

The OpenUI Lang definitions and positional parameters are unchanged. Size and
gap variants select existing token roles; for example `gap="m"` reads `spaceM`,
and `gap="none"` is always zero. Schema and prompt generation do not depend on
theme overrides.

| Component presentation | Theme role |
| --- | --- |
| TextContent default / small / large | textBodyDefault / textBodySm / textBodyLg |
| TextContent small-heavy / large-heavy | textBodySmHeavy / textBodyLgHeavy |
| Text sm or md / xs / lg | textBodyDefault / textBodySm / textBodyLg |
| BoldText sm or md / xs / lg | textBodyDefaultHeavy / textBodySmHeavy / textBodyLgHeavy |
| ImageTextLarge title | textBodyDefaultHeavy |
| Markdown strong text | textBodyDefaultHeavy weight, keeping surrounding size |
| Markdown headings | textHeadingMd / textHeadingSm / textHeadingXs |

The supported token names and meanings follow React's Theme. Swift uses `Color`,
point values and `OpenUIFont`, rather than a CSS parser. System fonts, contrast
fallback, width-derived cover cropping, native chart colors and platform motion
remain deliberate native presentation choices. React-only chat-shell tokens and
unused CSS capabilities are not advertised as implemented native controls.
