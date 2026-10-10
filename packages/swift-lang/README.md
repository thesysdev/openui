# OpenUI for Swift

Native Swift support for OpenUI Lang. Define model-renderable components in Swift, generate prompts from them, parse streamed OpenUI Lang, and render it with SwiftUI on iOS and macOS.

Two libraries:

- **`OpenUILang`**: parser, streaming parser, runtime (state, actions, queries), component library definitions and prompt generation. Plain Swift with Foundation.
- **`OpenUISwiftUI`**: the SwiftUI renderer and native views for every component of the OpenUI chat library.

**Links:** [OpenUI Lang docs](https://openui.com/docs/openui-lang) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

Requires Swift 6 and iOS 17 or macOS 14.

The package lives in `packages/swift-lang` of this repository. Swift Package Manager only resolves packages at the root of a git repository, so for now add it as a local package (File > Add Package Dependencies > Add Local… in Xcode), or in `Package.swift`:

```swift
dependencies: [
  .package(path: "../openui/packages/swift-lang"),
],
targets: [
  .target(name: "App", dependencies: [.product(name: "OpenUISwiftUI", package: "swift-lang")]),
]
```

`OpenUISwiftUI` re-exports `OpenUILang`.

## Overview

OpenUI for Swift follows the same model as the JavaScript packages:

1. **Define components** the model may call, with typed props.
2. **Generate a system prompt** from the component library.
3. **Render streamed output** with `OpenUIRenderer` as OpenUI Lang arrives.

The parser and runtime are a port of `@openuidev/lang-core`, checked against it with conformance fixtures (see [Testing Locally](#testing-locally)). The built-in chat library uses the same component names, arguments and prompt options as `openuiChatLibrary` from `@openuidev/react-ui`, so one backend prompt, or OpenUI Cloud, can drive web and native clients.

## Quick Start

### 1. Define a component

```swift
import OpenUISwiftUI
import SwiftUI

let greetingSchema = ComponentSchema(
  "Greeting", description: "Greets someone by name",
  props: [
    Prop("name", .string),
    Prop("mood", .enumeration(["happy", "excited"]), .optional),
  ])

let greeting = SwiftUIComponent(greetingSchema) { props in
  Text("Hello, \(props.text("name"))\(props.string("mood") == "excited" ? "!" : ".")")
    .font(.title2)
}
```

`props` holds the evaluated arguments, mapped from positional arguments by the order of the schema's props.

### 2. Create a library

```swift
let stackSchema = ComponentSchema(
  "Stack", description: "Vertical stack",
  props: [Prop("children", .array(.union([.component("Greeting"), .component("Stack")])))])

let stack = SwiftUIComponent(stackSchema) { props in
  OpenUINodes(props.array("children"))
}

let library = SwiftUILibrary(components: [stack, greeting], root: "Stack")
```

### 3. Generate a system prompt

```swift
let systemPrompt = library.prompt(PromptOptions(additionalRules: ["Keep greetings short."]))
```

The prompt matches what `lang-core` generates for the same library. If prompts are built on a server, `library.toSpec()` returns a `LibrarySpec` you can pass to `generateSystemPrompt({ library })` from `@openuidev/lang-core`.

With OpenUI Cloud, send the config block instead; Cloud builds the prompt on its side. It's the same block `generateSystemPrompt({ cloud: true, library })` returns:

```swift
let systemMessage = try library.cloudConfig(PromptOptions(additionalRules: ["Keep greetings short."]))
```

### 4. Render streamed output

```swift
struct MessageView: View {
  let text: String
  let isStreaming: Bool

  var body: some View {
    OpenUIRenderer(response: text, isStreaming: isStreaming, library: library) { event in
      // Buttons, follow-ups and forms continue the conversation through here.
      print(event.type, event.humanFriendlyMessage, event.formState ?? [:])
    }
  }
}
```

Pass the full response text so far on every chunk; the renderer only re-parses what changed. OpenUI Cloud responses wrap the program in `]]>openui:content` and `]]>openui:end` markers; pass them through as they are, like the JavaScript renderers do.

A finished response renders fully on its first frame, so a restored transcript doesn't flash empty rows. Lay a transcript out in a `VStack` inside the `ScrollView`, not a `LazyVStack`: a lazy stack re-measures rows as it goes, and when that happens inside an animation (an animated `scrollTo`, the keyboard closing) SwiftUI can block the main thread for seconds while response heights settle.

## The chat library

`OpenUIChatLibrary.library` renders every `openuiChatLibrary` component natively: cards and text, Markdown, callouts, code, images and galleries, Swift Charts (bar, line, area, horizontal bar, pie, radial, single stacked bar, scatter) and a radar chart, tables and the editable table, forms (inputs, text areas, selects, date pickers, sliders, check boxes, radios, switches, chips, option cards) with validation, buttons and icon buttons, lists and follow-ups, steps, tabs, accordions, sections, carousels, tags, entity lists and the card blocks.

```swift
OpenUIRenderer(response: text, isStreaming: isStreaming, library: OpenUIChatLibrary.library) { event in
  send(event.humanFriendlyMessage)
}

// The prompt a react-ui app sends with openuiChatPromptOptions:
let prompt = OpenUIChatLibrary.library.prompt(ChatComponents.promptOptions)
// Or for OpenUI Cloud:
let systemMessage = try OpenUIChatLibrary.library.cloudConfig(ChatComponents.promptOptions)
```

The views follow react-ui's layouts and behavior rather than restyling them: card blocks use the same responsive grid (one column on phones), tabs and sections follow the stream until the user picks one, charts use react-ui's palette, curves and number formats, with its legends (tap a key to hide that series) and tooltips (hover with a pointer, or tap), and `[n]` citations resolve against the card's sources. Lucide icon names map to SF Symbols with the same category fallbacks. Spacing, fills and corner radii come from `OpenUITheme`, which follows react-ui's design tokens; override it with `.environment(\.openUITheme, theme)`. Its `accent` and `onAccent` color primary buttons, selections and steps (the renderer also tints controls with `accent`), and `chartPalette` replaces the default chart ramp, like react-ui's `defaultChartPalette`, with a palette per chart (`barChartPalette` and the rest) taking precedence. `info`, `success`, `alert` and `danger` color callouts, tags, trends and form errors.

The schemas in `ChatComponents` live in `OpenUILang`, without SwiftUI, so a Swift server can build the chat prompt too. They're generated from `openuiChatLibrary` (see [Testing Locally](#testing-locally)).

### The general library

`OpenUILibrary.library` is react-ui's general `openuiLibrary`, for apps that aren't a chat: the same views without the chat-only follow-ups and sections, plus `Stack` (the root, a flex row or column), `Modal` (a sheet its `$boolean` binding opens; closing it writes `false` back) and a `Card` that takes Stack's layout props. Its schemas and prompt options are `OpenUIComponents`.

```swift
OpenUIRenderer(response: text, isStreaming: isStreaming, library: OpenUILibrary.library)

let prompt = OpenUILibrary.library.prompt(OpenUIComponents.promptOptions)
```

## API Reference

### Component Definition

| API                                                    | Description                                                                                                                                                                                         |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ComponentSchema(name, description:, props:)`          | A component's contract with the model: props in positional order.                                                                                                                                   |
| `Prop(name, type, presence, binding:, description:)`   | A prop. `presence` is `.required` (default), `.optional` or `.defaulted(value)`. `binding: true` marks a two-way `$state` binding, shown as `$binding<T>` in the prompt.                            |
| `PropType`                                             | `.string`, `.number`, `.boolean`, `.any`, `.enumeration`, `.literal`, `.array(_, minItems:)`, `.object([Prop])`, `.record`, `.component(name)`, `.union`, `.named(name, type)`, `.actionExpression` |
| `SwiftUIComponent(schema) { props in … }`              | Pairs a schema with the SwiftUI view that renders it.                                                                                                                                               |
| `SwiftUILibrary(components:, root:, componentGroups:)` | A library (`Library<ComponentContent>`).                                                                                                                                                            |

Schemas serialize to the same JSON Schema `lang-core` libraries produce: `schema.jsonSchema`, `library.toJSONSchema()`.

### Rendering

| API                                                                                                                                                     | Description                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `OpenUIRenderer(response:isStreaming:library:initialState:toolProvider:publishObservability:queryLoader:onAction:onStateUpdate:onParseResult:onError:)` | Renders a response. `queryLoader` replaces the small spinner shown while queries load.                                      |
| `OpenUINode(value)` / `OpenUINodes(values)`                                                                                                             | Render child props (elements, arrays, text) inside a component.                                                             |
| `ComponentProps`                                                                                                                                        | `string`, `text`, `number`, `bool`, `array`, `elements`, `children` accessors that tolerate partial values while streaming. |

### Errors

`onError` receives the same structured errors as react-lang's `onError`, for an automated correction loop: parser validation errors with fix hints (available components, the expected signature), `parse-failed` when a finished response has no root, and failed `Query`/`Mutation` calls. Errors are reported once the response finishes streaming, and `onError([])` is called when they clear or the next response starts. `OpenUIError.jsonRepresentation` gives the same JSON shape as lang-core's `OpenUIError`.

### Observability

`Observability.shared` ports `@openuidev/observability`: a bus that sinks (logging, analytics, a debugging view) listen to with `listen(_:_:)` or `listenAll(_:)`. As each response streams and settles, the runtime emits react-lang's `react-lang:stream` events with the same fields (a stable `id`, `phase`, `updateIndex`, the response, parser metadata, errors and timings), so a sink built for the web reads them too. A settled response with errors is an `error`-level event. Pass `publishObservability: false` to the renderer to stop them.

```swift
Observability.shared.listen([.error]) { event in
  logger.error("\(event.detail["message"]?.stringValue ?? "")")
}
```

### Context Helpers

Components read the renderer state from the environment:

```swift
@Environment(OpenUIContext.self) private var context
@Environment(\.openUIFormName) private var form
@Environment(FormValidation.self) private var validation: FormValidation?
```

| API                                             | Description                                                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `context.triggerAction(label, form:, action:)`  | Runs an action: an `Action([...])` plan, a legacy action object, or (with no action) continues the conversation with `label`. |
| `context.stateField(name:binding:form:)`        | The field a component reads and writes: a `$state` binding when the prop is bound, otherwise the form field.                  |
| `context.isStreaming`, `context.isQueryLoading` | Streaming and query status.                                                                                                   |

### Form Validation

`Form` provides a `FormValidation` to its fields. Fields register `rules` (`{ required: true, minLength: 3, email: true, … }`), primary buttons validate the form before firing their action, and `FormControl` shows the error.

### Parser, prompt and runtime (`OpenUILang`)

| API                                                                                                | Description                                                                                                                    |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Parser(schema:rootName:)`                                                                         | Batch parser from a library JSON Schema. `parse(_:)`, `makeStreamParser()`.                                                    |
| `StreamParser`                                                                                     | `push(_:)` a chunk or `set(_:)` the full text so far; returns the latest `ParseResult`.                                        |
| `OpenUIRuntime`                                                                                    | Streaming parse, store, prop evaluation, form fields, actions and error reporting, without UI (react-lang's `useOpenUIState`). |
| `generatePrompt(_:)`, `library.prompt(_:)`                                                         | Build the system prompt.                                                                                                       |
| `generateCloudConfig(library:promptOptions:instructions:)`, `library.cloudConfig(_:instructions:)` | OpenUI Cloud's config block (`generateSystemPrompt({ cloud: true })`).                                                         |
| `mergeStatements(_:_:rootId:)`                                                                     | Edit mode: applies a patch program to an existing one.                                                                         |
| `evaluate(_:_:)`, `Store`, `QueryManager`                                                          | Lower-level runtime pieces.                                                                                                    |
| `separateContentAndContext(_:)`, `wrapContent(_:)`, `wrapContext(_:)`, `hasLangSyntax(_:)`         | OpenUI Cloud's message format, from react-ui's `sentinelParser`: split a stored message into the program and its state.        |
| `messageWithState(content:contentHeader:state:)`, `continueConversationMessage(_:)`                | Build the messages react-ui sends back: a response with its form state, and a follow-up from an action.                        |
| `initialState(fromContext:)`, `parseArtifactSentinel(_:)`                                          | Restore form state from a stored message, and read an `]]>openui:artifact` header.                                             |

## Tool Provider Support (Queries & Mutations)

`Query(...)` and `Mutation(...)` statements call tools through a `ToolProvider`:

```swift
let tools = FunctionToolProvider([
  "list_tickets": { args in
    let status = args["status"]?.stringValue ?? "open"
    return ["rows": [["id": "T-1", "status": .string(status)]]]
  }
])

OpenUIRenderer(response: text, library: library, toolProvider: tools)
```

For an MCP server, `McpToolProvider` plays the part of passing an MCP client to react-lang's Renderer: give it a closure that calls the tool and returns the raw result (`{ content, structuredContent, isError }`) as an `OpenUIValue`, and it unwraps it with `extractToolResult(_:)`. Error results reach `onError` as `mcp-error`. It takes a closure so any MCP client works without this package depending on one:

```swift
let tools = McpToolProvider { name, arguments in
  // e.g. a JSON-RPC tools/call to your MCP server, then JSON.parse(result)
  try await mcp.callTool(name, arguments)
}
```

Conform your own type to `ToolProvider` for other backends.

## JSON Schema Output

`library.toJSONSchema()` produces the same document as `library.toJSONSchema()` in `lang-core` (component schemas under `$defs`, props in positional order), and the parser compiles positional parameters from it. When reading a schema from JSON, use `JSON.parse(_:)`, which keeps object key order.

## Differences from the JavaScript packages

- A component inside `@Each` or a ternary that binds a reactive prop to `$state` writes the typed value. In `lang-core` that binding is re-evaluated and nested, so typing writes `undefined`.
- Composite values (arrays, objects) have no identity in Swift, so `==` between two of them is always false. In JavaScript it's true only for the same instance.
- Prop evaluation and SwiftUI views can't throw, so `onError` never reports `runtime-error` or `render-error`.
- `$$` math in text content shows as source; there's no native TeX renderer.
- Code is highlighted with Prism's `vscDarkPlus` and `oneLight` colors by a small built-in tokenizer covering common languages (C-family, JSON, markup, Python, Ruby, shell, YAML, SQL), not by Prism's grammars.
- Touch has no hover, so a chart's tooltip opens on a tap and stays until the same spot is tapped again (or another chart's opens), where react-ui shows it while a finger moves. Hover states need a pointer: the Mac, or an iPad with a trackpad.
- Card blocks laid out as a carousel show the Carousel's step buttons while a pointer is over them. A mouse wheel only scrolls up and down, and there's no shift-scrolling or scrollbar to fall back on like in a browser, so react-ui's button-less card carousels can't be scrolled with a mouse otherwise.
- Editable table cells are always text fields, which suits touch, rather than react-ui's select-then-edit cells. With a keyboard, Up and Down move between rows and Enter moves down; Escape doesn't undo an edit.
- Crowded chart axes keep thinning their labels until the longest fits, down to three labels. react-ui stops thinning once each label has 40px and truncates the rest.
- A visual card whose text block came out empty (say, a loop variable used outside its `@Each`) shows just its photo, where react-ui draws an empty panel over it.
- The image gallery's mosaic has fixed proportions instead of taking its height from the loaded images, so it doesn't jump when they arrive, and the viewer shows each image's `details`.
- Not ported: `jsonToOpenUI`, the deprecated `enrichErrors` (its hints are in `onError`), and the server-side `artifactTool` from `@openuidev/lang-core/cloud`.

## Testing Locally

Running the tests needs Xcode (the Command Line Tools alone don't include the testing frameworks).

```bash
cd packages/swift-lang
swift test
swift format lint --strict -r Sources Tests Package.swift
```

The conformance fixtures in `Tests/OpenUILangTests/Fixtures` are generated from the TypeScript packages, which are the source of truth. They cover batch and streaming parsing, prop evaluation, prompts, OpenUI Cloud config, edit-mode merging, error hints, OpenUI Cloud's message format, the chart number formats, and the schemas, prompts and examples of both libraries. After changing `lang-core`, react-ui's libraries, its `sentinelParser` or its chart formatters, rebuild and regenerate them (the script imports react-ui's TypeScript source directly, so it needs Node 22.18 or newer), and regenerate `ChatComponents.swift` and `OpenUIComponents.swift` when either library changed:

```bash
pnpm run build:packages
node packages/swift-lang/Scripts/generate-fixtures.mjs
node packages/swift-lang/Scripts/generate-chat-components.mjs
```

CI regenerates the fixtures from a fresh build and fails if they differ, so drift in `lang-core` or the chat library shows up as a failing check.

## Documentation

Full OpenUI Lang documentation is at [openui.com/docs/openui-lang](https://openui.com/docs/openui-lang).

## License

MIT
