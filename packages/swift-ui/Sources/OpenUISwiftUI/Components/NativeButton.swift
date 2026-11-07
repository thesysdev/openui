import OpenUILang
import SwiftUI

struct OpenUINativeButton: View {
    let context: OpenUIComponentContext
    @Environment(\.openUIFormActions) private var formActions
    private var role: ButtonRole? { context.string("type") == "destructive" ? .destructive : nil }
    private var variant: String { context.string("variant") ?? "primary" }
    var body: some View {
        button.buttonStyle(
            NativeActionButtonStyle(
                theme: context.theme, variant: variant,
                size: context.string("size"), destructive: role == .destructive)
        )
        .accessibilityLabel(context.string("label") ?? "")
    }
    private var button: some View {
        OpenUIActionSurface(
            context: context, message: context.string("label") ?? "", action: context.value("action"),
            role: role, useNativeStyle: true, validateForm: variant == "primary", showsProgress: true
        ) {
            Text(context.string("label") ?? "").fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: formActions ? .infinity : nil)
        }
    }
}
