import SwiftUI
import Foundation

/// A reading drag must not also activate a child button/link. This metadata
/// never disables scrolling or continuous bindings, and observes the pager's
/// existing gesture instead of installing a competing zero-distance drag.
final class NativeActivationIntent {
  private let now: () -> TimeInterval
  private var dragging = false
  private var endedAt = -TimeInterval.infinity
  init(now: @escaping () -> TimeInterval = { ProcessInfo.processInfo.systemUptime }) { self.now = now }
  func moved() { dragging = true }
  func ended() { if dragging { dragging = false; endedAt = now() } }
  var permitsActivation: Bool { !dragging && now() - endedAt >= 0.25 }
}
private struct NativeActivationIntentKey: EnvironmentKey { static let defaultValue: NativeActivationIntent? = nil }
extension EnvironmentValues {
  var openUIActivationIntent: NativeActivationIntent? {
    get { self[NativeActivationIntentKey.self] }
    set { self[NativeActivationIntentKey.self] = newValue }
  }
}

/// One layout pass measures all pages and places them in a clipped viewport.
/// Page height is intrinsic, including updates inside a mounted page; it is not
/// fed back asynchronously through a horizontal ScrollView's fixed frame.
struct NativePager<ID: Hashable, Content: View>: View {
  let ids: [ID]
  @Binding var selection: ID
  let enabled: Bool
  let identifier: String
  var showsControls = true
  var maximumHeight: CGFloat? = nil
  var maximumPageWidth: CGFloat? = nil
  var trailingPeek: CGFloat = 0
  var pageSpacing: CGFloat = 0
  var decorationOutset: CGFloat = 0
  /// Card blocks keep the same mounted pages when a late layout argument
  /// resolves to a grid. Other pagers leave this nil.
  var grid: NativeCardGrid? = nil
  var supportsAdjustment = true
  @ViewBuilder let content: (ID) -> Content
  @Namespace private var scope
  @State private var width: CGFloat = 0
  @State private var naturalHeight: CGFloat = 0
  @GestureState private var translation: CGFloat = 0
  @GestureState private var trackingDrag = false
  @State private var activationIntent = NativeActivationIntent()
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.layoutDirection) private var direction
  @Environment(\.openUITheme) private var theme
  private var index: Int { ids.firstIndex(of: selection) ?? 0 }
  private var isCarousel: Bool { maximumPageWidth != nil }
  private var fallbackWidth: CGFloat { maximumPageWidth ?? theme.minimumCardWidth }
  private var geometry: NativePagerGeometry {
    NativePagerGeometry(
      width: max(1, width), count: ids.count, selected: index,
      maximumPageWidth: maximumPageWidth, minimumPageWidth: theme.minimumCardWidth,
      peek: trailingPeek, spacing: pageSpacing)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      if let maximumHeight, naturalHeight > maximumHeight + 0.5 {
        // Only explicitly capped map previews need a vertical scroll viewport.
        ScrollView(.vertical, showsIndicators: naturalHeight > maximumHeight) {
          strip.padding(decorationOutset)
        }
          .frame(height: min(max(1, naturalHeight), maximumHeight) + 2 * decorationOutset)
          .padding(-decorationOutset)
      } else {
        // A non-overflowing map card must not add a vertical scroll recognizer
        // between its buttons and the document's reading gesture.
        strip.frame(maxHeight: maximumHeight, alignment: .top)
      }
      if showsControls && ids.count > 1 {
        NativePageControls(page: index, count: ids.count, enabled: enabled, identifier: identifier, select: select)
      }
    }
    .frame(idealWidth: fallbackWidth, maxWidth: .infinity, alignment: .leading)
    .animation(
      reduceMotion
        ? nil
        : .interactiveSpring(
          response: theme.motion.pagingResponse,
          dampingFraction: theme.motion.pagingDamping), value: selection
    )
    .onChange(of: ids) { available in
      if !available.contains(selection), let first = available.first { selection = first }
    }
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier(identifier + ".pager")
    .onChange(of: trackingDrag) { if !$0 { activationIntent.ended() } }
    .modifier(NativePagerAdjustment(enabled: supportsAdjustment) { action in
      switch action {
      case .increment: select(index + 1)
      case .decrement: select(index - 1)
      @unknown default: break
      }
    })
    .accessibilityActions {
      if !supportsAdjustment && grid == nil {
        Button { select(index - 1) } label: { Text("Previous page", bundle: NativeControlResources.bundle) }
        Button { select(index + 1) } label: { Text("Next page", bundle: NativeControlResources.bundle) }
      }
    }
  }

  private var strip: some View {
    NativePagerLayout(
      selected: index, maximumPageWidth: maximumPageWidth,
      minimumPageWidth: theme.minimumCardWidth, peek: trailingPeek, spacing: pageSpacing,
      fallbackWidth: fallbackWidth, translation: translation, rightToLeft: direction == .rightToLeft,
      grid: grid
    ) {
      ForEach(ids, id: \.self) { id in
        content(id).id(id).accessibilityHidden(grid == nil && !isCarousel && id != selection)
      }
    }
    .clipShape(NativePagerDecorationClip(outset: decorationOutset)).contentShape(Rectangle())
    .environment(\.openUIActivationIntent, activationIntent)
    .background(
      GeometryReader { measured in
        Color.clear.preference(key: NativePagerSizes.self, value: [scope: measured.size])
      }
    )
    .onPreferenceChange(NativePagerSizes.self) { sizes in
      guard let size = sizes[scope], size.width.isFinite, size.height.isFinite else { return }
      if abs(size.width - width) > 0.5 { width = size.width }
      if maximumHeight != nil, abs(size.height - naturalHeight) > 0.5 { naturalHeight = size.height }
    }
    // Keep document scrolling available; only horizontal movement pages the strip.
    .simultaneousGesture(
      DragGesture(minimumDistance: 16)
        .updating($trackingDrag) { _, tracking, _ in tracking = enabled && grid == nil }
        .onChanged { _ in if enabled && grid == nil { activationIntent.moved() } }
        .updating($translation) { value, current, _ in
          guard enabled, grid == nil, ids.count > 1, abs(value.translation.width) > abs(value.translation.height) else { return }
          let movement = value.translation.width * (direction == .rightToLeft ? -1 : 1)
          let edge = (index == 0 && movement > 0) || (index == ids.count - 1 && movement < 0)
          current = movement * (edge ? 0.2 : 1)
        }
        .onEnded { value in
          activationIntent.ended()
          guard enabled, grid == nil, abs(value.translation.width) > abs(value.translation.height),
            abs(value.predictedEndTranslation.width) > max(24, geometry.stride * 0.2)
          else { return }
          let movement = value.predictedEndTranslation.width * (direction == .rightToLeft ? -1 : 1)
          select(index + (movement < 0 ? 1 : -1))
        })
  }

  private func select(_ next: Int) {
    guard enabled, ids.indices.contains(next) else { return }
    selection = ids[next]
  }
}

private struct NativePagerAdjustment: ViewModifier {
  let enabled: Bool
  let action: (AccessibilityAdjustmentDirection) -> Void
  @ViewBuilder func body(content: Content) -> some View {
    if enabled { content.accessibilityAdjustableAction(action) }
    else { content }
  }
}

private struct NativePagerDecorationClip: Shape {
  let outset: CGFloat
  func path(in rect: CGRect) -> Path {
    Path(rect.insetBy(dx: -outset, dy: -outset))
  }
}

struct NativePagerGeometry {
  let width: CGFloat
  let pageWidth: CGFloat
  let stride: CGFloat
  let offset: CGFloat

  init(
    width: CGFloat, count: Int, selected: Int, maximumPageWidth: CGFloat?,
    minimumPageWidth: CGFloat, peek: CGFloat, spacing: CGFloat
  ) {
    self.width = max(1, width.isFinite ? width : 1)
    if let maximumPageWidth {
      let visiblePeek = min(max(0, peek), max(0, self.width - minimumPageWidth - spacing))
      let reservation = count > 1 && visiblePeek > 0 ? visiblePeek + spacing : 0
      pageWidth = min(max(1, maximumPageWidth), max(1, self.width - reservation))
    } else {
      pageWidth = self.width
    }
    stride = pageWidth + spacing
    let end = max(0, CGFloat(count) * pageWidth + CGFloat(max(0, count - 1)) * spacing - self.width)
    offset = min(max(0, CGFloat(selected) * stride), end)
  }
}

enum NativePagerContentHeight {
  static func measure(_ heights: [CGFloat], selected: Int, translation: CGFloat = 0, stride: CGFloat = 1) -> CGFloat {
    guard !heights.isEmpty else { return 0 }
    let index = min(max(0, selected), heights.count - 1)
    let current = heights[index].isFinite ? max(0, heights[index]) : 0
    let next = index + (translation < 0 ? 1 : -1)
    guard translation != 0, heights.indices.contains(next), stride.isFinite, stride > 0 else { return current }
    let other = heights[next].isFinite ? max(0, heights[next]) : current
    return current + (other - current) * min(1, abs(translation) / stride)
  }
}

private struct NativePagerLayout: Layout {
  let selected: Int
  let maximumPageWidth: CGFloat?
  let minimumPageWidth: CGFloat
  let peek: CGFloat
  let spacing: CGFloat
  let fallbackWidth: CGFloat
  let translation: CGFloat
  let rightToLeft: Bool
  var grid: NativeCardGrid? = nil

  private func geometry(_ proposal: ProposedViewSize, count: Int) -> NativePagerGeometry {
    let width = proposal.width.flatMap { $0.isFinite ? $0 : nil } ?? fallbackWidth
    return NativePagerGeometry(
      width: width, count: count, selected: selected,
      maximumPageWidth: maximumPageWidth, minimumPageWidth: minimumPageWidth, peek: peek, spacing: spacing)
  }
  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let layout = geometry(proposal, count: subviews.count)
    if let grid {
      let columns = grid.columnCount(width: layout.width, count: subviews.count)
      let width = grid.columnWidth(width: layout.width, columns: columns)
      let heights = subviews.map { $0.sizeThatFits(ProposedViewSize(width: width, height: nil)).height }
      return CGSize(width: layout.width, height: grid.height(heights, columns: columns))
    }
    let heights = subviews.map { $0.sizeThatFits(ProposedViewSize(width: layout.pageWidth, height: nil)).height }
    let height = NativePagerContentHeight.measure(heights, selected: selected,
      translation: rightToLeft ? -translation : translation, stride: layout.stride)
    return CGSize(width: layout.width, height: height)
  }
  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    let layout = geometry(ProposedViewSize(width: bounds.width, height: nil), count: subviews.count)
    if let grid {
      let columns = grid.columnCount(width: layout.width, count: subviews.count)
      let width = grid.columnWidth(width: layout.width, columns: columns)
      let heights = subviews.map { $0.sizeThatFits(ProposedViewSize(width: width, height: nil)).height }
      var y = bounds.minY
      for start in stride(from: 0, to: subviews.count, by: columns) {
        let end = min(start + columns, subviews.count)
        let height = heights[start..<end].filter { $0.isFinite }.max() ?? 0
        for index in start..<end {
          let column = index - start
          let x = CGFloat(column) * (width + grid.spacing)
          subviews[index].place(at: CGPoint(x: bounds.minX + (rightToLeft ? bounds.width - width - x : x), y: y),
            anchor: .topLeading, proposal: ProposedViewSize(width: width, height: height))
        }
        y += height + grid.spacing
      }
      return
    }
    let heights = subviews.map { $0.sizeThatFits(ProposedViewSize(width: layout.pageWidth, height: nil)).height }
    for (index, view) in subviews.enumerated() {
      let position = CGFloat(index) * layout.stride - layout.offset + translation
      let x = rightToLeft ? bounds.width - layout.pageWidth - position : position
      view.place(
        at: CGPoint(x: bounds.minX + x, y: bounds.minY), anchor: .topLeading,
        proposal: ProposedViewSize(width: layout.pageWidth, height: heights[index]))
    }
  }
}

/// Grid and pager are placement modes of one stable collection subtree.
struct NativeCardGrid {
  var fixedColumns: Int? = nil
  let minimumWidth: CGFloat
  let spacing: CGFloat
  func columnCount(width: CGFloat, count: Int) -> Int {
    if let fixedColumns { return max(1, fixedColumns) }
    return max(1, min(count, Int((max(1, width) + spacing) / max(1, minimumWidth + spacing))))
  }
  func columnWidth(width: CGFloat, columns: Int) -> CGFloat {
    max(1, (width - CGFloat(columns - 1) * spacing) / CGFloat(columns))
  }
  func height(_ heights: [CGFloat], columns: Int) -> CGFloat {
    let rows = stride(from: 0, to: heights.count, by: columns).map { start in
      heights[start..<min(start + columns, heights.count)].filter { $0.isFinite }.max() ?? 0
    }
    return rows.reduce(0, +) + CGFloat(max(0, rows.count - 1)) * spacing
  }
}

private struct NativePagerSizes: PreferenceKey {
  static let defaultValue: [Namespace.ID: CGSize] = [:]
  static func reduce(value: inout [Namespace.ID: CGSize], nextValue: () -> [Namespace.ID: CGSize]) {
    value.merge(nextValue(), uniquingKeysWith: { _, next in next })
  }
}
