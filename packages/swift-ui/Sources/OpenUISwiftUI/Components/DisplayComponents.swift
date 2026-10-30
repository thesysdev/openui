import OpenUILang
import SwiftUI

enum OpenUIDisplayComponents {
    static var components: [OpenUIComponent] {
        return [
            OpenUIReference.component("Label") {
                Text($0.string("text") ?? "").openUIFont($0.theme.typography.body)
            },
            OpenUIReference.component("Separator") { context in NativeSeparator(context: context) },
            OpenUIReference.component("CodeBlock") { NativeCodeBlock(context: $0) },
            OpenUIReference.component("Col") { _ in EmptyView() },
            OpenUIReference.component("Table") { NativeDataTable(context: $0) },
            OpenUIReference.component("EditableTable") { NativeEditableTable(context: $0) },
            OpenUIReference.component("AccordionItem") { _ in EmptyView() },
            OpenUIReference.component("Accordion") { NativeAccordion(context: $0) },
            OpenUIReference.component("MetricIndicatorWithStrikethrough") {
                NativeMetric(context: $0, inline: false)
            },
            OpenUIReference.component("MetricIndicatorInline") {
                NativeMetric(context: $0, inline: true)
            },
        ]
    }
}

private struct NativeSeparator: View {
    let context: OpenUIComponentContext
    @ViewBuilder var body: some View {
        Group {
            if context.string("orientation") == "vertical" {
                Rectangle().fill(context.theme.border).frame(width: 1).frame(minHeight: 18)
            } else {
                Rectangle().fill(context.theme.border).frame(height: context.theme.cardBorderWidth)
            }
        }.accessibilityHidden(context.flag("decorative") ?? true)
    }
}

private struct NativeMetric: View {
    let context: OpenUIComponentContext
    var inline: Bool
    var body: some View {
        Group {
            if inline {
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .firstTextBaseline, spacing: context.theme.spacing("s")) {
                        value.fixedSize(horizontal: true, vertical: true)
                        details
                    }
                    VStack(alignment: .leading, spacing: context.theme.spacing("2xs")) {
                        value; details
                    }
                }
            } else {
                VStack(alignment: .leading, spacing: context.theme.spacing("2xs")) {
                    value; details
                }
            }
        }.accessibilityElement(children: .combine)
    }
    private var value: some View {
        NativeMetricValue(text: context.string("value") ?? "",
            font: inline ? context.theme.typography.inlineMetric : context.theme.typography.metric,
            theme: context.theme)
    }
    @ViewBuilder private var details: some View {
        if let previous = context.string("previousValue") {
            Text(previous).strikethrough().openUIFont(context.theme.typography.caption).foregroundStyle(context.theme.secondary)
        }
        if case .object(let trend) = context.value("trend"), case .number(let number) = trend["value"],
            number.isFinite,
            case .string(let direction) = trend["direction"]
        {
            Label(
                number.formatted(.number.precision(.fractionLength(0...2))) + "%",
                systemImage: direction == "down" ? "arrow.down" : "arrow.up"
            )
            .openUIFont(context.theme.typography.caption).foregroundStyle(context.theme.secondary)
        }
        if let subtext = context.string("subtext") {
            Text(subtext).openUIFont(context.theme.typography.detail).foregroundStyle(context.theme.secondary)
        }
    }
}

/// Keep one amount intact. A rare wider-than-viewport value can be read by
/// horizontal scrolling; it is never split through its decimal or shrunk.
struct NativeMetricValue: View {
    let text: String
    let font: OpenUIFont
    let theme: OpenUITheme
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1
    private var label: some View { Text(text).openUIFont(font).monospacedDigit().fixedSize() }
    var body: some View {
        // These are text-only measurement candidates, without state, resources
        // or actions. Only the selected presentation is exposed to accessibility.
        ViewThatFits(in: .horizontal) {
            label
            ScrollView(.horizontal) { label }
                .frame(height: font.size * (1.2 + (font.lineSpacing ?? theme.typography.lineSpacing)) * scale)
        }
        .accessibilityElement(children: .ignore).accessibilityLabel(text)
    }
}

/// Upstream AccordionRenderer opens the newest item as the count grows, until
/// onValueChange records a user's open/close choice. Removals do not reset it.
struct NativeAccordionSelection {
    private(set) var selected: OpenUIString?
    private var userHasInteracted = false
    private var previousItemCount = 0
    mutating func choose(_ value: OpenUIString?) {
        userHasInteracted = true
        selected = value
    }
    mutating func reconcile(_ keys: [OpenUIString]) {
        if !userHasInteracted, keys.count > previousItemCount { selected = keys.last }
        previousItemCount = keys.count
    }
}

private struct NativeAccordion: View {
    let context: OpenUIComponentContext
    @State private var local = NativeAccordionSelection()
    private var items: [OpenUIRenderChild] { context.children("items") }
    private var keys: [OpenUIString] {
        items.compactMap { child in
            guard case .element(let item) = child.value else { return nil }
            return PropValue.codeUnitString(item, "value")
        }
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(items) { child in
                if case .element(let item) = child.value, let key = PropValue.codeUnitString(item, "value")
                {
                    DisclosureGroup(
                        isExpanded: Binding(
                            get: { local.selected == key },
                            set: { open in
                                local.choose(open ? key : nil)
                            })
                    ) {
                        context.render(PropValue.value(item, "content") ?? .null)
                            .padding(.top, context.theme.spacing("m"))
                    } label: {
                        Text(PropValue.string(item, "trigger") ?? "").openUIFont(context.theme.typography.body)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.vertical, context.theme.spacing("l"))
                    if child.id != items.last?.id {
                        Rectangle().fill(context.theme.border).frame(height: context.theme.cardBorderWidth)
                            .accessibilityHidden(true)
                    }
                }
            }
        }
        .onAppear { local.reconcile(keys) }
        .onChange(of: keys) { updated in local.reconcile(updated) }
    }

}

private struct NativeDataTable: View {
    struct Column: Identifiable {
        let id: String
        let title: String
        let data: [Value]
        let numeric: Bool
    }
    let context: OpenUIComponentContext
    @Environment(\.openUITableCellPolicy) private var cellPolicy
    @ScaledMetric(relativeTo: .body) private var minimumWidth: CGFloat = 88
    @ScaledMetric(relativeTo: .body) private var textScale: CGFloat = 1
    @State private var availableWidth: CGFloat = 0
    @State private var currentPage = 0
    @Namespace private var measurementScope
    private let pageSize = 10 // Pinned upstream Table's DEFAULT_PAGE_SIZE.
    private var columnGap: CGFloat { context.theme.spacing("ml") }
    private var columns: [Column] {
        context.children("columns").compactMap { child in
            guard case .element(let element) = child.value else { return nil }
            let raw = PropValue.value(element, "data") ?? .null
            let data: [Value]
            if case .array(let values) = raw {
                data = Array(values)
            } else {
                data = raw == .null || raw == .undefined ? [] : [raw]
            }
            return Column(id: child.id, title: PropValue.string(element, "label") ?? "", data: data,
                numeric: PropValue.string(element, "type") == "number")
        }
    }
    private var rowCount: Int { columns.map { $0.data.count }.max() ?? 0 }
    private var pageCount: Int { max(1, (rowCount + pageSize - 1) / pageSize) }
    private var safePage: Int { min(currentPage, pageCount - 1) }
    private var visibleRows: Range<Int> {
        let start = safePage * pageSize
        return start..<min(start + pageSize, rowCount)
    }
    @ViewBuilder var body: some View {
        if context.isQueryLoading && rowCount == 0 {
            NativeTableSkeleton(columns: columns.count)
        } else if !columns.isEmpty {
            loadedTable
        }
    }
    private var loadedTable: some View {
        VStack(alignment: .leading, spacing: context.theme.spacing("s")) {
            ScrollView(.horizontal) { tableContent }
            if pageCount > 1 {
                NativePageControls(page: safePage, count: pageCount, enabled: true, identifier: "openui.table") { currentPage = $0 }
            }
        }
        .background(
            GeometryReader { geometry in
                Color.clear.preference(key: NativeTableWidthKey.self, value: [measurementScope: geometry.size.width])
            }
        )
        .onPreferenceChange(NativeTableWidthKey.self) { values in
            guard let width = values[measurementScope], width.isFinite, width > 0, abs(width - availableWidth) > 0.5 else { return }
            availableWidth = width
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("openui.table")
        .environment(\.openUIActionDensity, .compact)
    }
    @ViewBuilder private var tableContent: some View {
        NativeDataTableLayout(
            columns: columns.count, width: max(minimumWidth, availableWidth),
            minimum: minimumWidth, gap: columnGap,
            columnMinimums: columns.map { $0.numeric ? minimumWidth : context.theme.minimumTextColumnWidth * textScale }
        ) {
            ForEach(columns) { column in
                Text(column.title).openUIFont(context.theme.typography.body.weight(.semibold))
                    .foregroundStyle(context.theme.foreground)
                    .accessibilityAddTraits(.isHeader)
                    .padding(.vertical, context.theme.spacing("sm"))
                    .multilineTextAlignment(column.numeric ? .trailing : .leading)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: column.numeric ? .topTrailing : .topLeading)
            }
            context.theme.border.frame(height: context.theme.cardBorderWidth).layoutValue(key: NativeTableBoundaryKey.self, value: true)
                .accessibilityHidden(true)
            ForEach(visibleRows, id: \.self) { row in
                ForEach(columns) { column in
                    cell(column.data.indices.contains(row) ? column.data[row] : .null)
                        .openUIFont(column.numeric ? context.theme.typography.body.monospacedDigit() : context.theme.typography.body)
                        .multilineTextAlignment(column.numeric ? .trailing : .leading)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.vertical, context.theme.spacing("m"))
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: column.numeric ? .topTrailing : .topLeading)
                        .accessibilityElement(children: .contain)
                        .accessibilityIdentifier("openui.table.cell.\(row).\(column.id)")
                }
                if row < visibleRows.upperBound - 1 {
                    context.theme.border.frame(height: context.theme.cardBorderWidth).layoutValue(key: NativeTableBoundaryKey.self, value: true)
                        .accessibilityHidden(true)
                }
            }
        }
    }
    @ViewBuilder private func cell(_ value: Value) -> some View {
        if case .boolean(let flag) = value {
            Text(flag ? "true" : "false")
        } else {
            context.renderTableCell(value, policy: cellPolicy)
        }
    }
}

/// Every column receives one shared proposal before any row is measured.
/// Flexible columns share available space; intrinsic/fixed children can keep a
/// wider scrollable table. Nothing depends on the component type in a cell.
enum NativeTableColumnPlacement {
    static func widths(ideal: [CGFloat], minimum: CGFloat, available: CGFloat, gap: CGFloat, minimums: [CGFloat]? = nil) -> [CGFloat] {
        guard !ideal.isEmpty else { return [] }
        let available = available.isFinite ? max(0, available) : 0
        let floor = minimum.isFinite ? max(1, minimum) : 1
        let preferred = ideal.map { $0.isFinite ? max(1, $0) : floor }
        var widths = preferred.enumerated().map { index, value in
            let requested = minimums.flatMap { $0.indices.contains(index) ? $0[index] : nil } ?? floor
            return min(value, requested.isFinite ? max(1, requested) : floor)
        }
        var remaining = max(0, available - gap * CGFloat(ideal.count - 1) - widths.reduce(0, +))
        let order = preferred.indices.sorted { preferred[$0] < preferred[$1] }
        for (offset, index) in order.enumerated() {
            let target = preferred[index]
            let extra = min(max(0, target - widths[index]), remaining / CGFloat(order.count - offset))
            widths[index] += extra
            remaining -= extra
        }
        if remaining > 0 {
            for index in widths.indices { widths[index] += remaining / CGFloat(widths.count) }
        }
        return widths
    }
}

private struct NativeTableBoundaryKey: LayoutValueKey { static let defaultValue = false }

private struct NativeDataTableLayout: Layout {
    let columns: Int
    let width: CGFloat
    let minimum: CGFloat
    let gap: CGFloat
    var columnMinimums: [CGFloat]? = nil

    private func frames(_ views: Subviews) -> [CGRect] {
        guard columns > 0 else { return [] }
        let cells = views.indices.filter { !views[$0][NativeTableBoundaryKey.self] }
        var ideal = Array(repeating: CGFloat.zero, count: columns)
        for (position, index) in cells.enumerated() {
            let measured = views[index].sizeThatFits(.unspecified).width
            if measured.isFinite { ideal[position % columns] = max(ideal[position % columns], measured) }
        }
        var widths = NativeTableColumnPlacement.widths(ideal: ideal, minimum: minimum, available: width, gap: gap, minimums: columnMinimums)
        // Some children explicitly refuse compression (for example a supplied
        // fixed media size). Widen that column for every row, not just its cell.
        for (position, index) in cells.enumerated() {
            let column = position % columns
            let measured = views[index].sizeThatFits(ProposedViewSize(width: widths[column], height: nil)).width
            if measured.isFinite { widths[column] = max(widths[column], measured) }
        }
        var result = Array(repeating: CGRect.zero, count: views.count)
        var y: CGFloat = 0
        for start in stride(from: 0, to: cells.count, by: columns) {
            let end = min(start + columns, cells.count)
            let sizes = (start..<end).map { views[cells[$0]].sizeThatFits(ProposedViewSize(width: widths[$0 % columns], height: nil)) }
            let height = sizes.map(\.height).filter(\.isFinite).max() ?? 0
            var x: CGFloat = 0
            for position in start..<end {
                let index = cells[position]
                let column = position % columns
                result[index] = CGRect(x: x, y: y, width: widths[column], height: height)
                x += result[index].width + gap
            }
            y += height
            if end > start {
                let divider = cells[end - 1] + 1
                if views.indices.contains(divider), views[divider][NativeTableBoundaryKey.self] {
                    result[divider] = CGRect(x: 0, y: y, width: max(0, x - gap), height: 0.5)
                    y += 0.5
                }
            }
        }
        return result
    }
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let placed = frames(subviews)
        return CGSize(width: placed.map(\.maxX).max() ?? 0, height: placed.map(\.maxY).max() ?? 0)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for (view, frame) in zip(subviews, frames(subviews)) {
            view.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY), anchor: .topLeading,
                proposal: ProposedViewSize(frame.size))
        }
    }
}

private struct NativeTableWidthKey: PreferenceKey {
    static let defaultValue: [Namespace.ID: CGFloat] = [:]
    static func reduce(value: inout [Namespace.ID: CGFloat], nextValue: () -> [Namespace.ID: CGFloat]) {
        value.merge(nextValue(), uniquingKeysWith: { _, next in next })
    }
}
