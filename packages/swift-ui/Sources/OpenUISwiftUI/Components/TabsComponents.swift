@_spi(RuntimeInspection) import OpenUILang
import SwiftUI


struct NativeTabPanel: Identifiable, Equatable {
    let id: OpenUIString
    let label: String
    let content: Value
    static func read(_ children: [OpenUIRenderChild]) -> [NativeTabPanel] {
        var seen = Set<OpenUIString>()
        return children.compactMap { child in
            guard case .element(let item) = child.value,
                item.typeName == "TabItem",
                let key = PropValue.codeUnitString(item, "value"), seen.insert(key).inserted
            else { return nil }
            return NativeTabPanel(
                id: key, label: PropValue.string(item, "trigger") ?? key.displayString,
                content: PropValue.value(item, "content") ?? .null)
        }
    }
}

/// Follow the reference's last-growing-content rule until a native button tap
/// records user intent, including a tap on the currently selected tab. Initial
/// complete renders follow growth too. Removing a manually selected value does
/// not invent a fallback absent from the upstream controlled Tabs.
struct NativeTabsSelection {
    private(set) var selected: OpenUIString?
    private var userHasInteracted = false
    private var previousContentSizes: [OpenUIString: Int] = [:]
    mutating func choose(_ value: OpenUIString) {
        userHasInteracted = true
        guard value != selected else { return }
        selected = value
    }
    mutating func reconcile(_ panels: [NativeTabPanel]) {
        if selected == nil || selected == "" { selected = panels.first?.id }
        guard !userHasInteracted else { return }
        var candidate: OpenUIString?
        var nextSizes: [OpenUIString: Int] = [:]
        for panel in panels {
            let size = panel.content.jsonStringifyUTF16Length() ?? 0
            nextSizes[panel.id] = size
            if size > previousContentSizes[panel.id, default: 0] { candidate = panel.id }
        }
        previousContentSizes = nextSizes
        if let candidate { selected = candidate }
    }
}

struct NativeTabsView: View {
    let context: OpenUIComponentContext
    @Environment(\.dynamicTypeSize) private var textSize
    @State private var local = NativeTabsSelection()
    @State private var width: CGFloat = 0
    @Namespace private var viewport
    private var panels: [NativeTabPanel] { NativeTabPanel.read(context.children("items")) }
    private var selected: OpenUIString? { local.selected }
    private var active: NativeTabPanel? { panels.first { $0.id == selected } }
    private var nativeSelection: Binding<OpenUIString> {
        Binding(
            get: { active?.id ?? "" },
            set: { local.choose($0) })
    }
    var body: some View {
        VStack(alignment: .leading, spacing: context.theme.spacing("l")) {
            if !panels.isEmpty {
                selector
                    .accessibilityIdentifier(
                        "openui.tabs.\(context.element.statementId ?? "tabs")")
            }
            if let active { context.render(active.content).id(active.id) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onAppear { local.reconcile(panels) }
        .onChange(of: panels) { updated in local.reconcile(updated) }
    }
    private var selector: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: context.theme.space2xs) {
                    ForEach(panels) { panel in
                        Button { nativeSelection.wrappedValue = panel.id } label: {
                            NativeBoundedLabelLayout(maximumWidth: width > 0 ? min(width, 232) : 232) {
                              Text(panel.label)
                                .openUIFont(context.theme.textLabelDefaultHeavy.weight(active?.id == panel.id ? .medium : .regular))
                                .foregroundStyle(active?.id == panel.id ? context.theme.textNeutralPrimary : context.theme.textNeutralSecondary)
                                .lineLimit(textSize.isAccessibilitySize ? nil : 1)
                                .truncationMode(.tail).fixedSize(horizontal: false, vertical: true)
                            }
                                .padding(.horizontal, context.theme.spaceM)
                                .padding(.vertical, context.theme.spaceS)
                                .background(active?.id == panel.id ? context.theme.sunk : .clear,
                                  in: Capsule(style: .continuous))
                                .openUIControlTarget()
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(active?.id == panel.id ? .isSelected : [])
                        .accessibilityIdentifier("openui.tab." + panel.id.displayString)
                        .id(panel.id)
                    }
                }
            }
            .onChange(of: selected) { value in
                if let value { proxy.scrollTo(value, anchor: .center) }
            }
            .background(GeometryReader { geometry in
                Color.clear.preference(key: NativeTabsWidthKey.self, value: [viewport: geometry.size.width])
            })
            .onPreferenceChange(NativeTabsWidthKey.self) { sizes in
                if let next = sizes[viewport], next.isFinite, next > 0, abs(next - width) > 0.5 { width = next }
            }
            .task(id: NativeTabsLayoutKey(labels: panels.map(\.label), width: width, textSize: textSize)) {
                // Wait for the changed font/container proposal to enter layout.
                // Scroll offsets are deliberately not a task input: users can
                // browse other labels without being pulled back to selection.
                await Task.yield()
                if !Task.isCancelled, let active { proxy.scrollTo(active.id, anchor: .center) }
            }
        }
    }
}

private struct NativeTabsLayoutKey: Hashable {
    let labels: [String]
    let width: CGFloat
    let textSize: DynamicTypeSize
}
private struct NativeTabsWidthKey: PreferenceKey {
    static let defaultValue: [Namespace.ID: CGFloat] = [:]
    static func reduce(value: inout [Namespace.ID: CGFloat], nextValue: () -> [Namespace.ID: CGFloat]) {
        value.merge(nextValue(), uniquingKeysWith: { _, next in next })
    }
}
