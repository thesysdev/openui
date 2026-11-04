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
    @Environment(\.openUIPresentation) private var nativePresentation

  let ids: [ID]
  @Binding var selection: ID
  let enabled: Bool
  let identifier: String
  var showsControls = true
  var maximumPageWidth: CGFloat? = nil
  var trailingPeek: CGFloat = 0
  var pageSpacing: CGFloat = 0
  /// Card blocks keep the same mounted pages when a late layout argument
  /// resolves to a grid. Other pagers leave this nil.
  var grid: NativeCardGrid? = nil
  var supportsAdjustment = true
  @ViewBuilder let content: (ID) -> Content
  @Namespace private var scope
  @State private var width: CGFloat = 0
  @GestureState private var translation: CGFloat = 0
  @GestureState private var trackingDrag = false
  @State private var activationIntent = NativeActivationIntent()
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.layoutDirection) private var direction
  @Environment(\.openUITheme) private var theme
  private var index: Int { ids.firstIndex(of: selection) ?? 0 }
  private var isCarousel: Bool { maximumPageWidth != nil }
  private var fallbackWidth: CGFloat { maximumPageWidth ?? nativePresentation.minimumCardWidth }
  private var geometry: NativePagerGeometry {
    NativePagerGeometry(
      width: max(1, width), count: ids.count, selected: index,
      maximumPageWidth: maximumPageWidth, minimumPageWidth: nativePresentation.minimumCardWidth,
      peek: trailingPeek, spacing: pageSpacing)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      strip
      if showsControls && ids.count > 1 {
        NativePageControls(page: index, count: ids.count, enabled: enabled, identifier: identifier, select: select)
      }
    }
    .frame(idealWidth: fallbackWidth, maxWidth: .infinity, alignment: .leading)
    .animation(
      reduceMotion
        ? nil
        : .interactiveSpring(
          response: nativePresentation.motion.pagingResponse,
          dampingFraction: nativePresentation.motion.pagingDamping), value: selection
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
      minimumPageWidth: nativePresentation.minimumCardWidth, peek: trailingPeek, spacing: pageSpacing,
      fallbackWidth: fallbackWidth, translation: translation, rightToLeft: direction == .rightToLeft,
      grid: grid
    ) {
      ForEach(ids, id: \.self) { id in
        content(id).id(id).accessibilityHidden(grid == nil && !isCarousel && id != selection)
      }
    }
    .clipped().contentShape(Rectangle())
    .environment(\.openUIActivationIntent, activationIntent)
    .background(
      GeometryReader { measured in
        Color.clear.preference(key: NativePagerSizes.self, value: [scope: measured.size])
      }
    )
    .onPreferenceChange(NativePagerSizes.self) { sizes in
      guard let size = sizes[scope], size.width.isFinite, size.height.isFinite else { return }
      if abs(size.width - width) > 0.5 { width = size.width }
    }
    // A grid must not install the pager recognizer: ignoring its callbacks
    // still lets it compete with the document's vertical reading gesture.
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
        }, including: enabled && grid == nil ? .all : .subviews)
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
      let frames = grid.frames(width: layout.width, count: subviews.count) { index, width in
        subviews[index].sizeThatFits(ProposedViewSize(width: width, height: nil)).height
      }
      return CGSize(width: layout.width, height: frames.map(\.maxY).max() ?? 0)
    }
    let heights = subviews.map { $0.sizeThatFits(ProposedViewSize(width: layout.pageWidth, height: nil)).height }
    let height = NativePagerContentHeight.measure(heights, selected: selected,
      translation: rightToLeft ? -translation : translation, stride: layout.stride)
    return CGSize(width: layout.width, height: height)
  }
  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    let layout = geometry(ProposedViewSize(width: bounds.width, height: nil), count: subviews.count)
    if let grid {
      let frames = grid.frames(width: layout.width, count: subviews.count) { index, width in
        subviews[index].sizeThatFits(ProposedViewSize(width: width, height: nil)).height
      }
      for (view, frame) in zip(subviews, frames) {
        let x = rightToLeft ? bounds.width - frame.maxX : frame.minX
        view.place(at: CGPoint(x: bounds.minX + x, y: bounds.minY + frame.minY),
          anchor: .topLeading, proposal: ProposedViewSize(frame.size))
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

/// The reference CardBlockLayout row distribution and 30rem/48rem container
/// queries, expressed in native points. Heights come from the mounted content.
/// Grid and pager remain placement modes of one stable collection subtree.
struct NativeCardGrid {
  let maxPerRow: Int
  var responsive = true
  var singleColumn = false
  let spacing: CGFloat
  func rows(width: CGFloat, count: Int) -> [Int] {
    guard count > 0 else { return [] }
    if singleColumn || responsive && width <= 480 { return Array(repeating: 1, count: count) }
    if responsive && width <= 768 || maxPerRow == 2 {
      return Array(repeating: 2, count: count / 2) + (count % 2 == 1 ? [1] : [])
    }
    if count == 1 { return [1] }
    switch count % 3 {
    case 0: return Array(repeating: 3, count: count / 3)
    case 2:
      var result = Array(repeating: 3, count: count / 3)
      result.insert(2, at: (result.count + 1) / 2)
      return result
    default: return Array(repeating: 3, count: (count - 4) / 3) + [2, 2]
    }
  }
  func frames(width: CGFloat, count: Int, height: (Int, CGFloat) -> CGFloat) -> [CGRect] {
    var result: [CGRect] = []
    var y: CGFloat = 0
    for columns in rows(width: width, count: count) {
      let cellWidth = max(1, (width - CGFloat(columns - 1) * spacing) / CGFloat(columns))
      let rowHeight = (result.count..<(result.count + columns)).map { height($0, cellWidth) }
        .filter(\.isFinite).max() ?? 0
      for column in 0..<columns {
        result.append(CGRect(x: CGFloat(column) * (cellWidth + spacing), y: y,
          width: cellWidth, height: max(0, rowHeight)))
      }
      y += max(0, rowHeight) + spacing
    }
    return result
  }
}

private struct NativePagerSizes: PreferenceKey {
  static let defaultValue: [Namespace.ID: CGSize] = [:]
  static func reduce(value: inout [Namespace.ID: CGSize], nextValue: () -> [Namespace.ID: CGSize]) {
    value.merge(nextValue(), uniquingKeysWith: { _, next in next })
  }
}
