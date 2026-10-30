import OpenUILang
import SwiftUI

/// Optional native contextual explanations, without a WebKit dependency.
public enum OpenUIPopoverComponents {
    public static func install(into base: OpenUIComponentLibrary) throws -> OpenUIComponentLibrary {
        let popover = OpenUIComponent(name: "Popover", description: """
            Contextual detail anchored to a compact trigger, such as Icon or short TextContent.
            The SDK makes the trigger an accessible button; do not nest a Button/IconButton inside
            it. content is ordinary component content. Use for optional explanations without adding
            rows to the page; keep essential content visible outside the popover.
            """, params: [OpenUIParameter.slot("trigger", multiple: false, required: true),
                OpenUIParameter.slot("content", multiple: false, required: true), OpenUIParameter.string("label", required: false)]) {
                    NativeContextPopover(context: $0)
                }
        return try base.extending(adding: [popover], slots: [
            "Popover": base.standardContentSlots,
        ])
    }
}

private struct NativeContextPopover: View {
    let context: OpenUIComponentContext
    @State private var presented = false
    var body: some View {
        Button { presented.toggle() } label: {
            context.slot("trigger").openUIControlTarget().contentShape(Rectangle())
        }
            .buttonStyle(.plain).disabled(!context.canInteract)
            .accessibilityLabel(context.string("label") ?? "Details")
            .popover(isPresented: $presented) {
                VStack(alignment: .leading, spacing: 0) { adaptedContent }
                    .accessibilityElement(children: .contain).accessibilityIdentifier("openui.popover.content")
                    .padding(context.theme.cardPadding)
                    .frame(idealWidth: context.theme.minimumCardWidth)
            }
    }
    @ViewBuilder private var adaptedContent: some View {
        if #available(iOS 16.4, macOS 13.3, *) {
            context.slot("content").presentationCompactAdaptation(.popover)
        } else { context.slot("content") }
    }
}
