import OpenUILang
import SwiftUI

// MARK: - Flex layout

/// As much of a CSS flex container as react-ui's Stack and Card use: a row or
/// a column with a gap, cross-axis `align`, main-axis `justify` and `wrap`.
///
/// In a row, views that can grow (a Card, or anything with an infinite max
/// width) act like react-ui's cards, `flex: 1` with `min-width: 0`: they start
/// from nothing and share the free space equally, so they never wrap; other
/// views keep their own width and shrink in proportion when the row is too
/// narrow. Columns place each view at the full width.
struct FlexLayout: Layout {
  enum Direction {
    case row, column
  }

  var direction = Direction.column
  var gap: CGFloat = 12
  /// `start`, `center`, `end`, `stretch` or `baseline`; nil is CSS's default,
  /// `stretch`.
  var align: String?
  /// `start`, `center`, `end`, `between`, `around` or `evenly`.
  var justify: String?
  var wrap = false

  /// A view's starting size along the row and whether it grows.
  struct Item: Equatable {
    var basis: CGFloat
    var flexible: Bool
  }

  /// react-ui's spacing tokens for Stack's `gap`, "m" by default.
  static func gap(_ name: String?) -> CGFloat {
    switch name {
    case "none": 0
    case "xs": 6
    case "s": 8
    case "l": 18
    case "xl": 24
    case "2xl": 36
    default: 12
    }
  }

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let frames = arrange(proposal: proposal, subviews: subviews)
    let width = proposal.width ?? frames.map(\.maxX).max() ?? 0
    return CGSize(width: width, height: frames.map(\.maxY).max() ?? 0)
  }

  func placeSubviews(
    in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()
  ) {
    let frames = arrange(
      proposal: ProposedViewSize(width: bounds.width, height: nil), subviews: subviews)
    for (subview, frame) in zip(subviews, frames) {
      subview.place(
        at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
        proposal: ProposedViewSize(frame.size))
    }
  }

  /// Each subview's frame, relative to the container's top-leading corner.
  /// Views with no size, like a closed Modal, get no gap around them: in
  /// react-ui they render nothing.
  private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> [CGRect] {
    let shown = subviews.indices.filter { subviews[$0].sizeThatFits(.unspecified) != .zero }
    var frames = [CGRect](repeating: .zero, count: subviews.count)
    let placed = layOut(proposal: proposal, subviews: shown.map { subviews[$0] })
    for (index, frame) in zip(shown, placed) { frames[index] = frame }
    return frames
  }

  private func layOut(proposal: ProposedViewSize, subviews: [LayoutSubview]) -> [CGRect] {
    if direction == .column { return column(width: proposal.width, subviews: subviews) }
    let items = subviews.map { subview in
      let ideal = subview.sizeThatFits(.unspecified).width
      let flexible = subview.sizeThatFits(ProposedViewSize(width: .infinity, height: nil)).width
        .isInfinite
      return Item(basis: flexible ? 0 : ideal, flexible: flexible)
    }
    let width =
      proposal.width
      ?? subviews.map { $0.sizeThatFits(.unspecified).width }.reduce(0, +)
      + gap * CGFloat(max(subviews.count - 1, 0))
    // react-ui's Stack doesn't spread wrapped lines apart.
    let justify = wrap && self.justify == "between" ? "start" : self.justify
    var frames = [CGRect](repeating: .zero, count: subviews.count)
    var y: CGFloat = 0
    for line in Self.lines(items, width: width, gap: gap, wrap: wrap) {
      let (widths, offsets) = Self.distribute(
        Array(items[line]), width: width, gap: gap, justify: justify)
      let heights = zip(line, widths).map { index, width in
        subviews[index].sizeThatFits(ProposedViewSize(width: width, height: nil)).height
      }
      let height = heights.max() ?? 0
      let baselines = zip(line, zip(widths, heights)).map { index, size in
        subviews[index].dimensions(in: ProposedViewSize(width: size.0, height: size.1))[
          .firstTextBaseline]
      }
      let baseline = baselines.max() ?? 0
      for (position, index) in line.enumerated() {
        let itemHeight = heights[position]
        let stretched = align == nil || align == "stretch"
        let offset: CGFloat =
          switch align {
          case "center": (height - itemHeight) / 2
          case "end": height - itemHeight
          case "baseline": baseline - baselines[position]
          default: 0
          }
        frames[index] = CGRect(
          x: offsets[position], y: y + offset, width: widths[position],
          height: stretched ? height : itemHeight)
      }
      y += height + gap
    }
    return frames
  }

  private func column(width proposed: CGFloat?, subviews: [LayoutSubview]) -> [CGRect] {
    let width = proposed ?? subviews.map { $0.sizeThatFits(.unspecified).width }.max() ?? 0
    var y: CGFloat = 0
    return subviews.map { subview in
      let size = subview.sizeThatFits(ProposedViewSize(width: width, height: nil))
      let itemWidth = align == nil || align == "stretch" ? width : min(size.width, width)
      let x: CGFloat =
        switch align {
        case "center": (width - itemWidth) / 2
        case "end": width - itemWidth
        default: 0
        }
      defer { y += size.height + gap }
      return CGRect(x: x, y: y, width: itemWidth, height: size.height)
    }
  }

  /// Splits items into lines. Without `wrap` it's one line; with it, items
  /// move to a new line when their basis doesn't fit. Growing items start
  /// from nothing, so they never move on their own.
  static func lines(_ items: [Item], width: CGFloat, gap: CGFloat, wrap: Bool) -> [Range<Int>] {
    guard wrap, !items.isEmpty else { return [items.indices] }
    var lines: [Range<Int>] = []
    var start = 0
    var used: CGFloat = 0
    for (index, item) in items.enumerated() {
      let needed = index == start ? item.basis : used + gap + item.basis
      if index > start, needed > width {
        lines.append(start..<index)
        start = index
        used = item.basis
      } else {
        used = needed
      }
    }
    lines.append(start..<items.count)
    return lines
  }

  /// One line's widths and x offsets: growing items share the free space;
  /// when nothing grows, `justify` spreads it; when there's too little, the
  /// fixed items shrink in proportion to their size.
  static func distribute(
    _ items: [Item], width: CGFloat, gap: CGFloat, justify: String?
  ) -> (widths: [CGFloat], offsets: [CGFloat]) {
    let count = CGFloat(items.count)
    let fixed = items.filter { !$0.flexible }.map(\.basis).reduce(0, +)
    let free = width - gap * max(count - 1, 0) - fixed
    let growing = CGFloat(items.filter(\.flexible).count)
    var widths = items.map(\.basis)
    if free < 0, fixed > 0 {
      widths = items.map { $0.flexible ? 0 : max($0.basis + free * $0.basis / fixed, 0) }
    } else if growing > 0 {
      widths = items.map { $0.flexible ? free / growing : $0.basis }
    }
    let space = growing > 0 ? 0 : max(free, 0)
    let (lead, between): (CGFloat, CGFloat) =
      switch justify {
      case "center": (space / 2, 0)
      case "end": (space, 0)
      case "between": (0, count > 1 ? space / (count - 1) : 0)
      case "around": (space / count / 2, space / count)
      case "evenly": (space / (count + 1), space / (count + 1))
      default: (0, 0)
      }
    var x = lead
    let offsets = widths.map { width in
      defer { x += width + gap + between }
      return x
    }
    return (widths, offsets)
  }
}

extension FlexLayout {
  /// The layout a Stack or Card asks for with its flex props.
  init(_ props: ComponentProps, defaultAlign: String? = nil) {
    self.init(
      direction: props.string("direction") == "row" ? .row : .column,
      gap: Self.gap(props.string("gap")), align: props.string("align") ?? defaultAlign,
      justify: props.string("justify"), wrap: props.bool("wrap") ?? false)
  }
}

/// A list of nodes laid out by `layout`, with OpenUINodes' streaming insertions.
private struct FlexNodes: View {
  let layout: FlexLayout
  let values: [OpenUIValue]

  var body: some View {
    let items = NodeItem.list(values)
    layout {
      ForEach(items) { item in
        OpenUINode(item.value).transition(.openUIInsertion)
      }
    }
    .openUIAnimation(Motion.insertion, value: items.map(\.id))
  }
}

// MARK: - Stack and Card

/// openuiLibrary's Stack: a flex container, a column by default.
struct StackView: View {
  let props: ComponentProps

  var body: some View {
    FlexNodes(layout: FlexLayout(props), values: props.array("children"))
      .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// openuiLibrary's Card: react-ui's card surface ("card", "sunk", or "clear"
/// with only side padding) around a Stack-like flex layout that stretches its
/// children by default. Cards always take the full width, and in a row they
/// share it.
struct FlexCardView: View {
  let props: ComponentProps
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let variant = props.string("variant") ?? "card"
    FlexNodes(layout: FlexLayout(props, defaultAlign: "stretch"), values: props.array("children"))
      .padding(.horizontal, variant == "clear" ? theme.cardPadding : 0)
      .frame(maxWidth: .infinity, alignment: .leading)
      .surface(variant)
  }
}

// MARK: - Modal

/// openuiLibrary's Modal: a sheet that its `open` binding shows (set the bound
/// `$state` to true). Closing it with its button, Escape or a swipe writes
/// false back, as react-ui's X, Escape and backdrop do.
struct ModalView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let field = context.stateField(name: "open", binding: props["open"], form: nil)
    let isOpen = field.value == true || field.value == "true"
    Color.clear
      .frame(width: 0, height: 0)
      .accessibilityHidden(true)
      .sheet(
        isPresented: Binding(
          get: { isOpen },
          set: { open in if !open { field.setValue(false) } })
      ) {
        ModalSheet(props: props)
          .environment(context)
          .environment(\.openUITheme, theme)
      }
  }
}

private struct ModalSheet: View {
  let props: ComponentProps
  @Environment(\.dismiss) private var dismiss

  var body: some View {
    VStack(spacing: 0) {
      HStack {
        Text(props.text("title")).font(.headline)
        Spacer()
        Button {
          dismiss()
        } label: {
          Image(systemName: "xmark")
            .font(.body.weight(.medium))
            .foregroundStyle(.secondary)
            .frame(width: 28, height: 28)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .keyboardShortcut(.cancelAction)
        .accessibilityLabel("Close")
      }
      .padding(12)
      Divider()
      ScrollView {
        OpenUINodes(props.array("children"))
          .padding(12)
          .frame(maxWidth: .infinity, alignment: .leading)
      }
    }
    #if os(macOS)
      .frame(width: Self.width(props.string("size")))
      .frame(minHeight: 200, idealHeight: 420)
    #endif
  }

  /// react-ui's sm, md and lg widths.
  static func width(_ size: String?) -> CGFloat {
    switch size {
    case "sm": 400
    case "lg": 720
    default: 560
    }
  }
}
