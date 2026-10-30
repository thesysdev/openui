# swift-lang

Apple-platform bindings for the shared OpenUI `lang-core`. The SwiftPM product and
import are `OpenUILang`; the nested development package identity is `swift-lang`. Swift 6 tools build
in Swift 5 language mode on iOS 16+ and macOS 13+. JavaScriptCore is required.

Parsing, streaming completion, expression evaluation, library extension, Schema,
Prompt generation, Store, query lifecycle and message handling delegate to the
pinned shared core. Native code supplies typed values, lossless UTF-16 transport,
async tools, cancellation and host action execution. There is no Linux fallback.

## Installation

The repository-root `Package.swift` exposes `OpenUILang` and `OpenUISwiftUI` for
remote SwiftPM dependencies. A language-only consumer selects `OpenUILang` from
the `openui` package; a native UI consumer selects `OpenUISwiftUI`, which depends
on this module automatically. See the [Swift installation instructions](../swift-ui/README.md#installation)
for local development and release availability.

The manifest in this directory remains a local development entry point. Do not
add it and the root package to the same application dependency graph.

## Use an exported library

```swift
import OpenUILang

let spec = try LibrarySpec(jsonString: exportedLibrary)
let parser = createParser(schema: compileLibrarySchema(spec))
let result = parser.parse(program)
```

`createParser` returns the `Parser` interface; `createStreamingParser` returns
`StreamParser`. Completion and append/replacement behavior use the shared parser.
`OpenUIString`, `OpenUIArray` and `OpenUIObject` retain JavaScript string and
reference semantics across the native boundary. Concrete JavaScriptCore parser
and Store implementations are internal. `createStore()` returns the core-aligned
`Store` interface, including `getSnapshot`, `subscribe` and `dispose`.

`ParsedMessage` uses the official `content`, `context`, `attributes` and `end`
fields. `context` is parsed JSON or raw text, represented as `JSONValue`; it is
`.null` when absent. `buildMessage` accepts those same fields. The host can retain
its original input separately when exact source bytes are needed.

## Authoring and schema

`DefinedComponent`, `DefinedFunction` and `DefinedAction` follow the core authoring
names. Validation exposes `ParsedRule(type:arg:)` and `ValidatorFn`; `Library.toJSONSchema()`
exports the core schema. Swift definitions and callbacks enter core `defineComponent`, `defineFunction`,
`defineAction`, `createLibrary` and `library.extend` through JSON/Zod transport.
Component reference identity and bindable metadata are preserved. `LibrarySpec`
and signatures come from core `toSpec()`; the adapter does not reproduce an older
Swift schema spelling or custom signature format. JSON Schema integer ranges are
preserved when the Zod importer would otherwise add safe-integer bounds.

## Build and test

```sh
swift test --package-path packages/swift-lang
npm ci --prefix packages/swift-lang/scripts --ignore-scripts
node packages/swift-lang/scripts/build.mjs
```

Ordinary SwiftPM consumers use the checked-in resource without Node or downloads.
The fixed upstream is `f08a660535e55b5b2a24a0eb68568edaf9e4fe4b`, core tree
`bf6be546007f96c87689c7b47c29e1f09175f6f6`. Exact dependency, source and resource
hashes live in `Sources/OpenUILang/Resources/core-manifest.json`.

Three compatibility corrections remain explicit: serializer round-trip grouping
and keys, materialization limits, and bounded ECMAScript pattern execution. The
manifest records their reasons and removal conditions. Raw message-context and
legacy output-format compatibility have been removed. Upstream core source is
unmodified; a source upgrade must revalidate the build corrections and reference
fixtures. Third-party licenses ship with the bundle and bounded regex backend.

A serialized JavaScript realm owns separate parser/Store/query objects. Host
async transport does not hold the realm lock across `await`. Cancellation and
source epochs prevent late responses from updating replacement programs. Typed
native ActionPlans execute at the framework boundary, matching other adapters.
