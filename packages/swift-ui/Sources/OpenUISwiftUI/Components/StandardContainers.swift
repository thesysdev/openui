import SwiftUI
import OpenUILang

struct OpenUICardSurface: ViewModifier {
    let theme: OpenUIThemeValues
    let variant: String?
    func body(content: Content) -> some View {
        content.environment(\.openUIActionDensity, .compact)
            .padding(.horizontal, variant == "clear" || variant == "sunk" ? theme.spaceL : theme.spaceML)
            .padding(.vertical, variant == "clear" ? 0 : variant == "sunk" ? theme.spaceL : theme.spaceML)
            .frame(maxWidth: .infinity, alignment: .leading)
            // Background and media own their corners; the open container must
            // not mask glyphs at the edge of its unpadded content.
            .modifier(NativeCardSurface(
                theme: theme,
                fill: variant == "clear" ? .clear : variant == "sunk" ? theme.sunk : theme.foreground,
                bordered: variant != "clear"))
            .shadow(color: .black.opacity(variant == "sunk" ? theme.shadowS.opacity : 0),
                    radius: theme.shadowS.radius, x: theme.shadowS.x, y: theme.shadowS.y)
    }
}

private struct OpenUIStretchHeightKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues {
    var openUIStretchHeight: Bool {
        get { self[OpenUIStretchHeightKey.self] }
        set { self[OpenUIStretchHeightKey.self] = newValue }
    }
}

struct OpenUIStack: View {
    let context: OpenUIComponentContext
    // Upstream Stack normalizes wrapped space-between; upstream Card does not.
    var wrapJustifyBetweenAsStart = false
    private var gap: CGFloat { context.theme.spacing(context.string("gap")) }
    private var children: [OpenUIRenderChild] { context.children() }

    var body: some View {
        OpenUIFlexLayout(
            direction: context.string("direction") ?? "column", gap: gap,
            align: context.string("align") ?? "stretch", justify: context.string("justify") ?? "start",
            wrap: context.flag("wrap") == true, fillsHeight: context.stretchesVertically,
            wrapJustifyBetweenAsStart: wrapJustifyBetweenAsStart
        ) {
            ForEach(children) { child in
                context.render(child.value)
                    .environment(\.openUIStretchHeight, context.string("direction") == "row" && stretches)
            }
        }
    }
    private var stretches: Bool { context.string("align") == nil || context.string("align") == "stretch" }
}

struct NativeContentImage: View {
    let context: OpenUIComponentContext
    var body: some View {
        NativeRemoteImage(src: context.string("src"), alt: context.string("alt") ?? "",
            layout: .cover)
            // Suggest a media width when a row measures its children. Grid card
            // widths are unrelated; the parent still controls the final width.
            // Standard Image follows the pinned reference's 3:2 photo default.
            .frame(idealWidth: context.presentation.thumbnailSize)
            .clipShape(RoundedRectangle(cornerRadius: context.theme.radiusM, style: .continuous))
    }
}
