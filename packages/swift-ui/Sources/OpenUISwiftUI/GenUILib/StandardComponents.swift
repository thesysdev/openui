import SwiftUI
import OpenUILang

public enum OpenUIStandardComponents {
    /// Official examples and rules for the complete, pinned general-purpose library.
    /// Pass explicitly to prompt(_:); curate them when deriving a component subset.
    public static var promptOptions: PromptOptions { OpenUIReference.promptOptions }

    public static func library(id: String? = nil) throws -> OpenUIComponentLibrary {
        try OpenUIComponentLibrary(components: components, root: "Stack", id: id, componentGroups: OpenUIReference.groups)
    }
    public static var components: [OpenUIComponent] {
        let implementations = OpenUISelectionComponents.components + OpenUIFormComponents.components
            + OpenUIDisplayComponents.components + OpenUIContentComponents.components
            + OpenUIChartComponents.components + [
            OpenUIReference.component("Stack") {
                OpenUIStack(context: $0, wrapJustifyBetweenAsStart: true)
                    .layoutValue(key: OpenUIFlexGrowKey.self, value: true)
            },
            OpenUIReference.component("TextContent") { context in
                NativeMarkdownText(text: context.string("text") ?? "", mode: .textContent,
                    style: .textContent(context.string("size"), theme: context.theme))
            },
            OpenUIReference.component("Image") { NativeContentImage(context: $0) },
            OpenUIReference.component("Button") { OpenUINativeButton(context: $0) },
            OpenUIReference.component("Card") { context in
                OpenUIStack(context: context)
                    .modifier(OpenUICardSurface(theme: context.theme, variant: context.string("variant")))
                    .layoutValue(key: OpenUIFlexGrowKey.self, value: true)
            }
        ]
        let byName = Dictionary(uniqueKeysWithValues: implementations.map { ($0.definition.name, $0) })
        return OpenUIReference.definitions.map { definition in
            guard let component = byName[definition.name] else { preconditionFailure("Missing native renderer: " + definition.name) }
            return component
        }
    }

}

