# OpenUI Kotlin

Native Kotlin support for OpenUI Lang. The package is split into:

- `openui-lang`: Kotlin component library definitions, prompt generation, OpenUI Lang parsing, and streaming parse state.
- `openui-compose`: a Jetpack Compose renderer with a registry for host app components and action callbacks.
- `sample/android`: a minimal Android app that parses an editable OpenUI Lang buffer and renders it with Compose.

## Define a Library

```kotlin
val library = openUILibrary {
    component(
        name = "Root",
        description = "Top-level screen container.",
        props = listOf(PropDef("children", OpenUIType.ArrayOf(OpenUIType.Component("Component")))),
    )
    component(
        name = "Button",
        description = "Triggers app behavior.",
        props = listOf(
            PropDef("label", OpenUIType.StringType),
            PropDef("action", OpenUIType.AnyType, required = false),
        ),
    )
    root("Root")
}

val systemPrompt = library.prompt()
```

## Parse and Stream

```kotlin
val parser = OpenUIParser(library)
val stream = parser.streamParser()

val partial = stream.push("root = Root([")
val complete = stream.push("Button(\"Save\")])")
```

## Render with Compose

```kotlin
OpenUIRenderer(
    node = complete.root,
    onAction = { action ->
        // Route generated UI events into your Android app.
    },
)
```

The default Compose registry includes common primitives for layout, text, forms, buttons, lists, tables, and chart placeholders. Apps can register native components with `OpenUIComposeRegistry.register`.

## Verify

From `packages/kotlin`:

```sh
gradle :openui-lang:test
gradle :sample:android:app:assembleDebug
```
