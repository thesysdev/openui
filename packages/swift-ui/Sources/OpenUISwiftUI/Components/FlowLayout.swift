import SwiftUI

/// A surface can opt into sharing a row's available main-axis space.
/// Content such as text, controls and images keeps its intrinsic negotiation.
struct OpenUIFlexGrowKey: LayoutValueKey {
    static let defaultValue = false
}

/// Pure placement is also used by tests; no global display state is consulted.
enum OpenUIFlowPlacement {
    static func frames(sizes: [CGSize], width: CGFloat, gap: CGFloat, align: String, justify: String,
                       wrap: Bool = true, baselines: [CGFloat] = [], crossExtent: CGFloat? = nil, rowGap: CGFloat? = nil) -> [CGRect] {
        let width = max(0, width)
        var rows: [[Int]] = [], row: [Int] = [], used: CGFloat = 0
        for index in sizes.indices {
            let itemWidth = min(width, max(0, sizes[index].width))
            if wrap && !row.isEmpty, used + gap + itemWidth > width { rows.append(row); row = []; used = 0 }
            used += (row.isEmpty ? 0 : gap) + itemWidth; row.append(index)
        }
        if !row.isEmpty { rows.append(row) }
        var frames = Array(repeating: CGRect.zero, count: sizes.count)
        var y: CGFloat = 0
        for row in rows {
            let baseline = row.map { baselines.indices.contains($0) ? baselines[$0] : sizes[$0].height }.max() ?? 0
            let height = max(!wrap ? crossExtent ?? 0 : 0, row.map {
                align == "baseline" ? baseline + sizes[$0].height - (baselines.indices.contains($0) ? baselines[$0] : sizes[$0].height) : sizes[$0].height
            }.max() ?? 0)
            let content = row.reduce(CGFloat.zero) { $0 + min(width, max(0, sizes[$1].width)) }
            let free = max(0, width - content - CGFloat(max(0, row.count - 1)) * gap)
            let extra: CGFloat
            let initial: CGFloat
            switch justify {
            case "between": extra = row.count > 1 ? free / CGFloat(row.count - 1) : 0; initial = 0
            case "evenly": extra = free / CGFloat(row.count + 1); initial = extra
            case "around": extra = free / CGFloat(row.count); initial = extra / 2
            case "center": extra = 0; initial = free / 2
            case "end": extra = 0; initial = free
            default: extra = 0; initial = 0
            }
            var x = initial
            for index in row {
                let size = CGSize(width: min(width, max(0, sizes[index].width)), height: sizes[index].height)
                let offset = align == "center" ? (height - size.height) / 2 : align == "end" ? height - size.height
                    : align == "baseline" ? baseline - (baselines.indices.contains(index) ? baselines[index] : size.height) : 0
                frames[index] = CGRect(x: x, y: y + offset, width: size.width, height: align == "stretch" ? height : size.height)
                x += size.width + gap + extra
            }
            y += height + (rowGap ?? gap)
        }
        return frames
    }
}

struct OpenUIFlexLayout: Layout {
    var direction: String
    var gap: CGFloat
    var align: String
    var justify: String
    var wrap: Bool
    var fillsHeight = false
    var wrapJustifyBetweenAsStart = false
    var rowGap: CGFloat? = nil

    private func finite(_ value: CGFloat?) -> CGFloat? {
        value.flatMap { $0.isFinite ? max(0, $0) : nil }
    }
    private func frames(_ proposal: ProposedViewSize, _ subviews: Subviews) -> [CGRect] {
        guard !subviews.isEmpty else { return [] }
        if direction == "column" {
            let measured = subviews.map { $0.sizeThatFits(ProposedViewSize(width: finite(proposal.width), height: nil)) }
            let width = finite(proposal.width) ?? measured.map(\.width).max() ?? 0
            let contentHeight = measured.reduce(0) { $0 + $1.height } + gap * CGFloat(subviews.count - 1)
            // A minimum-size probe must not collapse readable column content.
            // Stretch can add space, but does not compress text into zero height.
            let height = max(contentHeight, finite(proposal.height) ?? contentHeight)
            // A column's main axis is vertical; the same spacing math applies.
            return OpenUIFlowPlacement.frames(sizes: measured.map { CGSize(width: $0.height, height: $0.width) },
                width: height, gap: gap, align: align == "baseline" ? "start" : align, justify: justify,
                wrap: false, crossExtent: width).map {
                    CGRect(x: $0.minY, y: $0.minX, width: $0.height, height: $0.width)
                }
        }
        let ideal = subviews.map { $0.sizeThatFits(.unspecified) }
        let width = finite(proposal.width) ?? ideal.reduce(0) { $0 + $1.width } + gap * CGFloat(subviews.count - 1)
        var proposals = ideal.map { min(width, $0.width) }
        if !wrap {
            // Offer the least flexible children space first, as a native stack
            // does. No media/content percentage or component-type heuristic.
            var remaining = max(0, width - gap * CGFloat(subviews.count - 1))
            let order = subviews.indices.sorted { ideal[$0].width < ideal[$1].width }
            for (position, index) in order.enumerated() {
                let offered = min(ideal[index].width, remaining / CGFloat(order.count - position))
                proposals[index] = max(0, offered)
                remaining = max(0, remaining - subviews[index].sizeThatFits(ProposedViewSize(width: offered, height: nil)).width)
            }
            let growing = subviews.indices.filter { subviews[$0][OpenUIFlexGrowKey.self] }
            if !growing.isEmpty {
                let intrinsicWidth = subviews.indices.filter { !subviews[$0][OpenUIFlexGrowKey.self] }
                    .reduce(CGFloat.zero) { sum, index in
                        sum + subviews[index].sizeThatFits(ProposedViewSize(width: proposals[index], height: nil)).width
                    }
                let share = max(0, width - gap * CGFloat(subviews.count - 1) - intrinsicWidth) / CGFloat(growing.count)
                for index in growing { proposals[index] = share }
            }
        }
        var dimensions = subviews.indices.map {
            subviews[$0].dimensions(in: ProposedViewSize(width: proposals[$0], height: nil))
        }
        if align == "stretch", !wrap {
            // Resolve the cross axis from minimum content requirements first.
            // Flexible children accept that height rather than enlarging the
            // row using their unconstrained ideal size. If every child can
            // collapse, keep natural sizing (for example an image-only row).
            let minimumHeight = subviews.indices.map {
                subviews[$0].sizeThatFits(ProposedViewSize(width: proposals[$0], height: 0)).height
            }.max() ?? 0
            if minimumHeight > 0 {
                let height = max(minimumHeight, finite(proposal.height) ?? 0)
                dimensions = subviews.indices.map {
                    subviews[$0].dimensions(in: ProposedViewSize(width: proposals[$0], height: height))
                }
            }
        }
        return OpenUIFlowPlacement.frames(sizes: dimensions.map { CGSize(width: $0.width, height: $0.height) },
            width: width, gap: gap, align: align,
            justify: wrap && wrapJustifyBetweenAsStart && justify == "between" ? "start" : justify,
            wrap: wrap, baselines: dimensions.map { $0[.firstTextBaseline] }, crossExtent: finite(proposal.height), rowGap: rowGap)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let measured = ProposedViewSize(width: proposal.width, height: fillsHeight ? proposal.height : nil)
        let placed = frames(measured, subviews)
        return CGSize(width: finite(proposal.width) ?? placed.map(\.maxX).max() ?? 0,
                      height: max(fillsHeight ? finite(proposal.height) ?? 0 : 0, placed.map(\.maxY).max() ?? 0))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for (view, frame) in zip(subviews, frames(ProposedViewSize(width: bounds.width, height: fillsHeight ? bounds.height : nil), subviews)) {
            view.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                       anchor: .topLeading, proposal: ProposedViewSize(frame.size))
        }
    }
}

enum NativeMediaRowAxis { case horizontal, vertical }

/// Resolve once for a list, so every item keeps the same media column and axis.
/// Thresholds are visual roles supplied by the theme, not device breakpoints.
struct NativeListMediaLayout {
    let imageWidth: CGFloat
    let axis: NativeMediaRowAxis

    init(width: CGFloat?, preferredImageWidth: CGFloat, minimumImageWidth: CGFloat,
         textWidth: CGFloat, gap: CGFloat) {
        let preferred = max(0, preferredImageWidth)
        guard let width, width.isFinite, width > 0 else {
            imageWidth = preferred; axis = .horizontal
            return
        }
        let minimum = min(preferred, max(0, minimumImageWidth))
        let roomForImage = max(0, width - max(0, textWidth) - max(0, gap))
        if roomForImage >= minimum {
            imageWidth = min(preferred, roomForImage)
            axis = .horizontal
        } else {
            imageWidth = min(preferred, width)
            axis = .vertical
        }
    }
}

/// Media keeps its declared dimensions; copy wraps in the remaining space.
/// Direction is explicit rather than inferred from the length of the copy.
enum NativeMediaRowPlacement {
    struct Result {
        var media: CGRect
        var text: CGRect
        var size: CGSize
        var stacked: Bool
    }

    static func measure(width: CGFloat, media idealMedia: CGSize, gap: CGFloat,
                        axis: NativeMediaRowAxis,
                        centered: Bool, text: (CGFloat) -> CGSize) -> Result {
        let width = width.isFinite ? max(1, width) : 1
        func finite(_ value: CGFloat) -> CGFloat { value.isFinite ? max(0, value) : 0 }
        func copy(_ proposed: CGFloat) -> CGSize {
            let measured = text(max(1, proposed))
            return CGSize(width: max(max(1, proposed), finite(measured.width)), height: finite(measured.height))
        }
        let full = copy(width)
        let media = CGSize(width: finite(idealMedia.width), height: finite(idealMedia.height))
        let gap = media.width > 0 && media.height > 0 ? max(0, gap) : 0
        let remaining = max(0, width - media.width - gap)
        let beside = copy(remaining)
        if axis == .vertical {
            let textFrame = CGRect(x: 0, y: media.height + gap, width: full.width, height: full.height)
            return Result(media: CGRect(origin: CGPoint(x: centered ? max(0, (width - media.width) / 2) : 0, y: 0), size: media), text: textFrame,
                          size: CGSize(width: max(width, max(media.width, full.width)), height: textFrame.maxY), stacked: true)
        }

        // Explicit horizontal layout remains horizontal. Preserve fixed media
        // dimensions and give over-constrained copy its full viewport width.
        // Scrolling then reveals that readable paragraph without a private
        // minimum width, smaller font, or automatic direction change.
        let overflows = remaining <= 0 || beside.width > remaining + 0.5
        let measured = overflows ? full : beside
        let height = max(media.height, measured.height)
        let mediaY = centered ? (height - media.height) / 2 : 0
        let textY = centered ? (height - measured.height) / 2 : 0
        let textFrame = CGRect(x: media.width + gap, y: textY, width: measured.width, height: measured.height)
        return Result(media: CGRect(origin: CGPoint(x: 0, y: mediaY), size: media), text: textFrame,
                      size: CGSize(width: max(width, textFrame.maxX), height: height), stacked: false)
    }
}

/// Ordinary media rows participate directly in their parent's Layout pass.
/// Only real horizontal overflow uses a scroll viewport and measured height.
struct NativeMediaRow<Media: View, Copy: View>: View {
    var axis: NativeMediaRowAxis
    var gap: CGFloat
    var centered = false
    @ViewBuilder var media: Media
    @ViewBuilder var copy: Copy
    @Environment(\.openUITheme) private var theme
    @Namespace private var scope
    @State private var width: CGFloat = 0
    @State private var contentSize = CGSize.zero
    private var overflows: Bool { width > 0 && contentSize.width > width + 0.5 }

    var body: some View {
        Group {
            if overflows {
                ScrollView(.horizontal, showsIndicators: true) { row }
                    .frame(height: max(1, contentSize.height))
            } else {
                row
            }
        }
        .frame(idealWidth: theme.minimumCompactCardWidth, maxWidth: .infinity, alignment: .leading)
        .background(GeometryReader { geometry in
            Color.clear.preference(key: NativeMediaRowWidths.self, value: [scope: geometry.size.width])
        })
        .onPreferenceChange(NativeMediaRowWidths.self) { values in
            if let next = values[scope], next.isFinite, next > 0, abs(next - width) > 0.5 { width = next }
        }
        .onPreferenceChange(NativeMediaRowSizes.self) { values in
            if let next = values[scope], next.width.isFinite, next.height.isFinite, next != contentSize {
                contentSize = next
            }
        }
        .accessibilityElement(children: .contain).accessibilityIdentifier("openui.media-row")
    }
    private var row: some View {
        NativeMediaRowLayout(fallbackWidth: max(1, width), gap: gap, axis: axis, centered: centered) {
            media
            copy
        }
        .background(
            GeometryReader { geometry in
                Color.clear.preference(key: NativeMediaRowSizes.self, value: [scope: geometry.size])
            })
    }
}

private struct NativeMediaRowLayout: Layout {
    let fallbackWidth: CGFloat
    let gap: CGFloat
    let axis: NativeMediaRowAxis
    let centered: Bool

    private func measured(_ proposal: ProposedViewSize, _ subviews: Subviews) -> NativeMediaRowPlacement.Result {
        let width = proposal.width.flatMap { $0.isFinite ? max(1, $0) : nil } ?? fallbackWidth
        guard subviews.count > 1 else {
            let size = subviews.first?.sizeThatFits(ProposedViewSize(width: width, height: nil)) ?? .zero
            return .init(media: .zero, text: CGRect(origin: .zero, size: size), size: size, stacked: true)
        }
        return NativeMediaRowPlacement.measure(width: width, media: subviews[0].sizeThatFits(.unspecified),
            gap: gap, axis: axis, centered: centered) { subviews[1].sizeThatFits(ProposedViewSize(width: $0, height: nil)) }
    }
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        measured(proposal, subviews).size
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = measured(proposal, subviews)
        let frames = subviews.count > 1 ? [result.media, result.text] : [result.text]
        for (view, frame) in zip(subviews, frames) {
            view.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                       anchor: .topLeading, proposal: ProposedViewSize(frame.size))
        }
    }
}

private struct NativeMediaRowWidths: PreferenceKey {
    static let defaultValue: [Namespace.ID: CGFloat] = [:]
    static func reduce(value: inout [Namespace.ID: CGFloat], nextValue: () -> [Namespace.ID: CGFloat]) {
        value.merge(nextValue(), uniquingKeysWith: { _, next in next })
    }
}
private struct NativeMediaRowSizes: PreferenceKey {
    static let defaultValue: [Namespace.ID: CGSize] = [:]
    static func reduce(value: inout [Namespace.ID: CGSize], nextValue: () -> [Namespace.ID: CGSize]) {
        value.merge(nextValue(), uniquingKeysWith: { _, next in next })
    }
}


/// A label/value row gives short values their intrinsic width instead of half
/// the viewport. Long values can move below the label without hiding either.
struct NativeLabelValueLayout: Layout {
    let gap: CGFloat
    let minimumLabelWidth: CGFloat
    var allowsStacking = true
    var centerVertically = false
    var collapsesEmptySlots = false

    private func frames(_ proposal: ProposedViewSize, _ views: Subviews) -> [CGRect] {
        guard !views.isEmpty else { return [] }
        if views.count == 1 {
            let size = views[0].sizeThatFits(proposal)
            return [CGRect(origin: .zero, size: size)]
        }
        let ideals = views.map { $0.sizeThatFits(.unspecified) }
        let width =
            proposal.width.flatMap { $0.isFinite ? max(1, $0) : nil }
            ?? ideals[0].width + gap + ideals[1].width
        if collapsesEmptySlots {
            let empty = ideals.map { $0.width == 0 && $0.height == 0 }
            if empty[0] || empty[1] {
                return views.enumerated().map { index, view in
                    CGRect(origin: .zero, size: empty[index] ? .zero
                        : CGSize(width: width, height: view.sizeThatFits(ProposedViewSize(width: width, height: nil)).height))
                }
            }
        }
        let valueWidth = min(width, ideals[1].width)
        let labelMinimum = min(minimumLabelWidth, ideals[0].width)
        if labelMinimum + gap + valueWidth <= width || !allowsStacking {
            let rightWidth = min(valueWidth, max(1, width - labelMinimum - gap))
            let leftWidth = max(1, width - gap - rightWidth)
            let left = views[0].sizeThatFits(ProposedViewSize(width: leftWidth, height: nil))
            let right = views[1].sizeThatFits(ProposedViewSize(width: rightWidth, height: nil))
            let height = max(left.height, right.height)
            return [
                CGRect(
                    x: 0, y: centerVertically ? (height - left.height) / 2 : 0, width: leftWidth, height: left.height),
                CGRect(
                    x: width - rightWidth, y: centerVertically ? (height - right.height) / 2 : 0,
                    width: rightWidth, height: right.height),
            ]
        }
        let left = views[0].sizeThatFits(ProposedViewSize(width: width, height: nil))
        let right = views[1].sizeThatFits(ProposedViewSize(width: width, height: nil))
        return [
            CGRect(origin: .zero, size: CGSize(width: width, height: left.height)),
            CGRect(x: 0, y: left.height + gap, width: width, height: right.height),
        ]
    }
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let values = frames(proposal, subviews)
        return CGSize(width: values.map(\.maxX).max() ?? 0, height: values.map(\.maxY).max() ?? 0)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for (view, frame) in zip(subviews, frames(ProposedViewSize(width: bounds.width, height: nil), subviews)) {
            view.place(
                at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                anchor: .topLeading, proposal: ProposedViewSize(frame.size))
        }
    }
}
