import SwiftUI

/// Table is a read-only comparison surface. Its descendants share this smaller
/// registry, so a Stack or Popover cannot reintroduce an input/action builder.
/// Chart data nodes such as Series remain ordinary props, not rendered children.
public struct OpenUITableCellPolicy: Sendable {
    public let allowedComponents: Set<String>?
    public static let unrestricted = Self(allowedComponents: nil)
    public static let readOnly = Self(allowedComponents: Set(NativeTableCellContent.componentNames))
    public init(allowing components: [String]) { allowedComponents = Set(components) }
    private init(allowedComponents: Set<String>?) { self.allowedComponents = allowedComponents }
}
private struct TableCellPolicyKey: EnvironmentKey {
    static let defaultValue = OpenUITableCellPolicy.unrestricted
}
extension EnvironmentValues {
    public var openUITableCellPolicy: OpenUITableCellPolicy {
        get { self[TableCellPolicyKey.self] }
        set { self[TableCellPolicyKey.self] = newValue }
    }
}
extension View {
    public func openUITableCellPolicy(_ policy: OpenUITableCellPolicy) -> some View {
        environment(\.openUITableCellPolicy, policy)
    }
}

enum NativeTableCellContent {
    static let componentNames = [
        "TextContent", "Icon", "Tag", "Image",
        "MetricIndicatorInline", "MetricIndicatorWithStrikethrough",
        "BarChart", "LineChart", "SVG", "Stack", "Popover",
    ]

    static func registry(from installed: ComponentRegistry, policy: OpenUITableCellPolicy) -> ComponentRegistry {
        guard let allowed = policy.allowedComponents else { return installed }
        var cells = ComponentRegistry()
        for name in allowed { cells[name] = installed[name] }
        return cells
    }

}
