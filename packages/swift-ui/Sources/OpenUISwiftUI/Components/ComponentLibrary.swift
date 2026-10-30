import SwiftUI
import OpenUILang

/// Associates one ordered language definition with its native renderer.
/// Definitions stay Foundation-only; native views are registered at this layer.
public struct OpenUIComponent {
    public let definition: DefinedComponent
    fileprivate let builder: ComponentRegistry.Builder

    public init<Content: View>(name: String, description: String, params: [ParamDef],
                               @ViewBuilder content: @escaping (OpenUIComponentContext) -> Content) {
        self.init(defineComponent(name: name, description: description, params: params), content: content)
    }

    /// Replace a typed contract while retaining the original native renderer.
    /// The builder still receives the final extended registry and shared state.
    public func replacingDefinition(_ definition: DefinedComponent) -> OpenUIComponent {
        OpenUIComponent(definition: definition, builder: builder)
    }

    private init(definition: DefinedComponent, builder: @escaping ComponentRegistry.Builder) {
        self.definition = definition
        self.builder = builder
    }

    public init<Content: View>(
        _ definition: DefinedComponent,
        @ViewBuilder content: @escaping (OpenUIComponentContext) -> Content
    ) {
        self.definition = definition
        self.builder = { element, registry in
            AnyView(OpenUIComponentHost(element: element, registry: registry, content: content))
        }
    }
}

/// A matched language library and native registry. A library only advertises
/// the components whose implementations were supplied by its author.
public struct OpenUIComponentLibrary {
    public let library: Library
    public let registry: ComponentRegistry

    public init(
        components: [OpenUIComponent],
        functions: [DefinedFunction] = [],
        actions: [DefinedAction] = [],
        root: String? = nil,
        id: String? = nil,
        componentGroups: [ComponentGroup]? = nil
    ) throws {
        let library = try createLibrary(components: components.map(\.definition), functions: functions,
                                        actions: actions, root: root, id: id, componentGroups: componentGroups)
        var registry = ComponentRegistry()
        for component in components { registry[component.definition.name] = component.builder }
        self.library = library
        self.registry = registry
    }

    private init(library: Library, registry: ComponentRegistry) {
        self.library = library
        self.registry = registry
    }

    public func extending(
        adding: [OpenUIComponent] = [],
        overriding: [OpenUIComponent] = [],
        removing: [String] = [],
        functions: [DefinedFunction] = [],
        actions: [DefinedAction] = [],
        slots: [String: [String]] = [:]
    ) throws -> OpenUIComponentLibrary {
        let extended = try library.extend(LibraryExtension(
            addComponents: adding.map(\.definition), overrideComponents: overriding.map(\.definition),
            removeComponents: removing, addFunctions: functions, addActions: actions,
            addComponentSlots: slots))
        var next = registry
        for name in removing { next[name] = nil }
        for component in adding + overriding { next[component.definition.name] = component.builder }
        return OpenUIComponentLibrary(library: extended, registry: next)
    }

    /// Generate the prompt using the shared-core library and caller options.
    public func prompt(_ options: PromptOptions = PromptOptions()) -> String {
        library.prompt(options)
    }
    public func toSpec() -> LibrarySpec { library.toSpec() }

    package var standardContentSlots: [String] {
        [("Card", "children"), ("TabItem", "content"), ("AccordionItem", "content")].compactMap { name, parameter in
            library.components.contains { $0.name == name && $0.params.contains { $0.name == parameter } }
                ? name + "." + parameter : nil
        }
    }
}

/// Helpers construct ordinary JSON Schema; argument order remains explicit.
public enum OpenUIParameter {
    /// A local selection shared by any components bound to the same $variable.
    public static func selection(_ name: String, required: Bool = true) -> ParamDef {
        var parameter = string(name, required: required)
        parameter.isBindable = true
        return parameter
    }

    public static func string(_ name: String, required: Bool = true, values: [String]? = nil) -> ParamDef {
        var fields = [JSONField(key: "type", value: .string("string"))]
        if let values { fields.append(JSONField(key: "enum", value: .array(values.map(JSONValue.string)))) }
        return ParamDef(name: name, required: required, schema: .object(fields))
    }

    public static func flag(_ name: String, required: Bool = false) -> ParamDef {
        ParamDef(name: name, required: required, schema: .object([JSONField(key: "type", value: .string("boolean"))]))
    }

    public static func action(_ name: String = "action", required: Bool = false) -> ParamDef {
        ParamDef(name: name, required: required,
                 schema: .object([JSONField(key: "$ref", value: .string("#/$defs/ActionExpression"))]))
    }

    /// Empty `accepting` permits any registered component/value, like Stack.
    /// An explicit list produces $refs that Library.extend can update.
    public static func slot(_ name: String, multiple: Bool = true, required: Bool = false,
                            accepting names: [String] = []) -> ParamDef {
        let refs = names.map { JSONValue.object([JSONField(key: "$ref", value: .string("#/$defs/" + $0))]) }
        let item: JSONValue = refs.isEmpty ? .object([])
            : .object([JSONField(key: "anyOf", value: .array(refs))])
        let schema = multiple ? JSONValue.object([
            JSONField(key: "type", value: .string("array")), JSONField(key: "items", value: item)
        ]) : item
        return ParamDef(name: name, required: required, schema: schema)
    }
}
