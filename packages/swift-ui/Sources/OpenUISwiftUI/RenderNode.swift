// OpenUISwiftUI — Recursive render node.
//
// Renders a single EvaluatedElement by looking up its component in the
// registry and recursively rendering its children.

import SwiftUI
import OpenUILang

/// Registry: component typeName → SwiftUI view builder.
///
/// The renderer has NO built-in components (like react-ui is separate from
/// react-lang). Apps register their own components here.
public struct ComponentRegistry: ExpressibleByDictionaryLiteral {
    public typealias Builder = (EvaluatedElement, ComponentRegistry) -> AnyView
    private var builders: [String: Builder]

    public init(_ builders: [String: Builder] = [:]) { self.builders = builders }
    public init(dictionaryLiteral elements: (String, Builder)...) {
        builders = Dictionary(elements, uniquingKeysWith: { _, latest in latest })
    }
    public subscript(_ name: String) -> Builder? {
        get { builders[name] }
        set { builders[name] = newValue }
    }
}

/// Recursively renders an `EvaluatedElement` tree.
public struct RenderNode: View {
    private let element: EvaluatedElement
    private let registry: ComponentRegistry

    public init(element: EvaluatedElement, registry: ComponentRegistry) {
        self.element = element
        self.registry = registry
    }

    public var body: some View {
        ElementErrorBoundary(element: registry[element.typeName] == nil ? nil : element) { el in
            if let builder = registry[el.typeName] {
                builder(el, registry)
            } else {
                // Unknown component: render nothing (upstream drops it).
                EmptyView()
            }
        }
    }
}

/// Helpers for building component views from EvaluatedElement props.
public enum PropValue {
    /// Get a string prop, or nil.
    public static func string(_ el: EvaluatedElement, _ key: String) -> String? {
        guard let v = el.props.first(where: { $0.0 == key })?.1 else { return nil }
        if case .string(let s) = v { return s.displayString }
        return nil
    }

    /// Get child elements from an array prop (e.g. "children").
    public static func children(_ el: EvaluatedElement, _ key: String = "children") -> [EvaluatedElement] {
        guard let v = el.props.first(where: { $0.0 == key })?.1 else { return [] }
        if case .array(let items) = v {
            return items.compactMap { item in
                if case .element(let e) = item { return e }
                return nil
            }
        }
        if case .element(let e) = v { return [e] }
        return []
    }

    /// Get an action plan prop (e.g. Button's "action").
    public static func actionPlan(_ el: EvaluatedElement, _ key: String) -> ActionPlan? {
        guard let v = el.props.first(where: { $0.0 == key })?.1 else { return nil }
        if case .actionPlan(let plan) = v { return plan }
        return nil
    }
}

extension PropValue {
    /// Use for semantic operations; string() is a display-only native bridge.
    public static func codeUnitString(_ element: EvaluatedElement, _ key: String) -> OpenUIString? {
        guard case .string(let value) = value(element, key) else { return nil }; return value
    }
}
