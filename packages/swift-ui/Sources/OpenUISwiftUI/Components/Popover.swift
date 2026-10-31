import OpenUILang
import SwiftUI


struct NativeContextPopover: View {
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
