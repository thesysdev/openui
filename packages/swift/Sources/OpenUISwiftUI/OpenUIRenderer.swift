import SwiftUI
#if canImport(OpenUILang)
import OpenUILang
#endif

public struct OpenUIRenderer: View {
    let node: ElementNode?
    let library: ComponentLibrary
    let actionHandler: ((String, [String: Any]) -> Void)?

    public init(node: ElementNode?, library: ComponentLibrary, actionHandler: ((String, [String: Any]) -> Void)? = nil) {
        self.node = node
        self.library = library
        self.actionHandler = actionHandler
    }
    
    public var body: some View {
        if let node = node {
            renderNode(node)
        } else {
            AnyView(Text("No UI to render")
                .foregroundColor(.gray))
        }
    }
    
    private func renderNode(_ node: ElementNode) -> AnyView {
        if let def = library.components[node.typeName], let renderer = def.renderer {
            if let customView = renderer.render(props: node.props, children: node.props["children"] as? [Any] ?? []) as? AnyView {
                return customView
            }
        }
        
        switch node.typeName {
        case "VStack":
            return AnyView(VStack {
                renderChildren(node.props["children"] as? [ElementNode])
            })
        case "HStack":
            return AnyView(HStack {
                renderChildren(node.props["children"] as? [ElementNode])
            })
        case "Text":
            return AnyView(Text((node.props["text"] as? String) ?? ""))
        case "Button":
            return AnyView(Button(action: {
                if let action = node.props["action"] as? String {
                    actionHandler?(action, node.props)
                } else {
                    print("Button clicked: \(node.props["label"] as? String ?? "")")
                }
            }) {
                Text((node.props["label"] as? String) ?? "Button")
            })
        default:
            return AnyView(Text("Unknown component: \(node.typeName)")
                .foregroundColor(.red))
        }
    }
    
    @ViewBuilder
    private func renderChildren(_ children: [ElementNode]?) -> some View {
        if let children = children {
            ForEach(0..<children.count, id: \.self) { index in
                renderNode(children[index])
            }
        }
    }
}
