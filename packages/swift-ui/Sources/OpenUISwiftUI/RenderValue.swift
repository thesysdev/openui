import SwiftUI
import OpenUILang

/// The framework adapter's recursive child renderer. Containers may pass any
/// child value here, including a scalar or nested array returned by @Each.
public struct RenderValue: View {
    private let value: Value
    private let registry: ComponentRegistry
    public init(_ value: Value, registry: ComponentRegistry) {
        self.value = value; self.registry = registry
    }
    public var body: some View {
        switch value {
        case .element(let element): RenderNode(element: element, registry: registry)
        case .string(let text): Text(text.displayString)
        case .number(let number): Text(jsNumberString(number))
        case .boolean(let flag): Text(flag ? "true" : "false")
        case .array(let values):
            ForEach(OpenUIRenderChild.children(of: .array(values))) { child in
                RenderValue(child.value, registry: registry)
            }
        default: EmptyView()
        }
    }
}

extension PropValue {
    public static func value(_ element: EvaluatedElement, _ key: String) -> Value? {
        element.props.last(where: { $0.0 == key })?.1
    }
}
