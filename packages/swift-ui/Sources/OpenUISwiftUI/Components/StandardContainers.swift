import SwiftUI
import OpenUILang

struct OpenUICardSurface: ViewModifier {
    let theme: OpenUITheme
    let variant: String?
    func body(content: Content) -> some View {
        content.environment(\.openUIActionDensity, .compact)
            // react-ui Card is an open container by default. Clear only adds
            // side insets; sunk owns the recessed surface and full padding.
            .padding(.horizontal, variant == "clear" || variant == "sunk" ? theme.spacing("l") : 0)
            .padding(.vertical, variant == "sunk" ? theme.spacing("l") : 0)
            .frame(maxWidth: .infinity, alignment: .leading)
            // Background and media own their corners; the open container must
            // not mask glyphs at the edge of its unpadded content.
            .modifier(NativeCardSurface(
                theme: theme,
                fill: variant == "sunk" ? theme.surface : .clear,
                bordered: variant == "sunk"))
            .shadow(color: .black.opacity(variant == "sunk" ? 0.05 : 0), radius: 2, y: 1)
    }
}

private struct OpenUIStretchHeightKey: EnvironmentKey { static let defaultValue = false }
private struct OpenUIContainerDirectionKnownKey: EnvironmentKey { static let defaultValue = true }
extension EnvironmentValues {
    fileprivate var openUIContainerDirectionKnown: Bool {
        get { self[OpenUIContainerDirectionKnownKey.self] }
        set { self[OpenUIContainerDirectionKnownKey.self] = newValue }
    }
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
                    .environment(\.openUIContainerDirectionKnown,
                        context.element.isSourceComplete || ["row", "column"].contains(context.string("direction") ?? ""))
            }
        }
    }
    private var stretches: Bool { context.string("align") == nil || context.string("align") == "stretch" }
}

struct NativeContentImage: View {
    let context: OpenUIComponentContext
    @Environment(\.openUIContainerDirectionKnown) private var directionKnown
    var body: some View {
        NativeRemoteImage(src: context.string("src"), alt: context.string("alt") ?? "",
            layout: .cover)
            // Suggest a media width when a row measures its children. Grid card
            // widths are unrelated; the parent still controls the final width.
            // Standard Image follows the pinned reference's 3:2 photo default.
            .frame(idealWidth: context.theme.thumbnailSize)
            // A positional direction can arrive after the children. Reserve a
            // compact 3:2 proposal until that local container is known; settled
            // covers and unrelated media never inherit this provisional bound.
            .frame(maxWidth: directionKnown ? nil : context.theme.thumbnailSize, alignment: .leading)
            .clipShape(RoundedRectangle(cornerRadius: context.theme.mediaCornerRadius, style: .continuous))
    }
}
