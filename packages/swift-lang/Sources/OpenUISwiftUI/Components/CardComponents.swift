import OpenUILang
import SwiftUI

// MARK: - Click context

/// Merges an item's click context into a card block's `action`, like
/// react-ui's `withItemContext`:
/// - no action: continue the conversation with the item context as params;
/// - an `Action([...])` plan: append "Selected item: {…}" to its
///   `@ToAssistant` contexts (the only channel the host receives for them);
/// - a legacy `{ type, params, url, context }` object: merge into params.
func withItemContext(_ action: OpenUIValue, _ itemContext: OpenUIObject) -> OpenUIValue {
  let context = OpenUIObject(itemContext.entries.filter { $0.value != .undefined })
  switch action {
  case .undefined, .null:
    return ["type": .string(BuiltinActionType.continueConversation), "params": .object(context)]
  case .actionPlan(let plan):
    if context.isEmpty { return action }
    let suffix = "Selected item: \(JSON.stringify(.object(context)))"
    return .actionPlan(
      ActionPlan(
        steps: plan.steps.map { step in
          guard case .continueConversation(let message, let existing) = step else { return step }
          let merged = existing.map { $0.isEmpty ? suffix : "\($0)\n\(suffix)" } ?? suffix
          return .continueConversation(message: message, context: merged)
        }))
  default:
    var params = action["params"].objectValue ?? OpenUIObject()
    if action["url"] != .undefined { params["url"] = action["url"] }
    if action["context"].isTruthy { params["context"] = action["context"] }
    for (key, value) in context { params[key] = value }
    let type =
      action["type"].isNullish ? .string(BuiltinActionType.continueConversation) : action["type"]
    return ["type": type, "params": .object(params)]
  }
}

/// A string prop of a child element (`getStringProp` in react-ui).
private func childString(_ node: OpenUIValue, _ key: String) -> String? {
  node.elementValue?.props[key]?.stringValue
}

private struct TextAlignmentKey: EnvironmentKey {
  static let defaultValue = TextAlignment.leading
}

extension EnvironmentValues {
  /// How text building blocks align, e.g. trailing in a snippet card's value column.
  fileprivate var openUITextAlignment: TextAlignment {
    get { self[TextAlignmentKey.self] }
    set { self[TextAlignmentKey.self] = newValue }
  }
}

// MARK: - Blocks

/// Card layout sizes from react-ui: small blocks use 280pt carousel cards,
/// medium ones 320pt (280pt in narrow blocks).
private enum CardBlockSize {
  case small, medium
}

/// react-ui's `getRowConfiguration`: how many cards go in each grid row.
func cardRowConfiguration(_ count: Int, maxPerRow: Int) -> [Int] {
  if count <= 0 { return [] }
  if count == 1 { return [1] }
  if maxPerRow == 2 {
    return Array(repeating: 2, count: count / 2) + (count % 2 == 1 ? [1] : [])
  }
  if count % 3 == 0 { return Array(repeating: 3, count: count / 3) }
  if count % 3 == 2 {
    var rows = Array(repeating: 3, count: count / 3)
    rows.insert(2, at: (rows.count + 1) / 2)
    return rows
  }
  return Array(repeating: 3, count: (count - 4) / 3) + [2, 2]
}

/// Rows of up to `maxPerRow` cells, two columns in grids 768pt wide or less
/// (an odd last cell spans both) and one column at 480pt or less, like
/// react-ui's responsive card grids. Cells in a row share the tallest height.
struct ResponsiveCardGrid<Cell: View>: View {
  let count: Int
  let maxPerRow: Int
  var responsive = true
  var spacing: CGFloat = 12
  var minCellWidth: CGFloat = 0
  @ViewBuilder let cell: (Int) -> Cell

  var body: some View {
    CardGridLayout(
      maxPerRow: maxPerRow, responsive: responsive, spacing: spacing, minCellWidth: minCellWidth
    ) {
      ForEach(0..<count, id: \.self) { index in
        cell(index).transition(.openUIInsertion)
      }
    }
    .openUIAnimation(Motion.insertion, value: count)
  }
}

/// The grid behind `ResponsiveCardGrid`. As a `Layout` it reads the width it's
/// offered while laying out, so the columns are right on the first frame
/// instead of re-flowing once the width has been measured.
struct CardGridLayout: Layout {
  let maxPerRow: Int
  let responsive: Bool
  let spacing: CGFloat
  /// The card's own minimum width in react-ui. Past it, the grid drops to
  /// fewer columns: react-ui keeps the columns and lets the cards overflow
  /// them, and without a minimum they'd squeeze down to a word per line.
  var minCellWidth: CGFloat = 0

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    guard let width = proposal.width, width.isFinite else {
      // No width to fit (e.g. measuring an ideal size): one column.
      let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
      let height = sizes.map(\.height).reduce(0, +) + spacing * CGFloat(max(sizes.count - 1, 0))
      return CGSize(width: sizes.map(\.width).max() ?? 0, height: height)
    }
    let height = rows(subviews.count, width).reduce(into: CGFloat(0)) { total, row in
      total += rowHeight(row, subviews, width)
    }
    return CGSize(
      width: width, height: height + spacing * CGFloat(max(rowCount(subviews.count, width) - 1, 0)))
  }

  func placeSubviews(
    in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()
  ) {
    var y = bounds.minY
    for row in rows(subviews.count, bounds.width) {
      let width = cellWidth(row.count, bounds.width)
      let height = rowHeight(row, subviews, bounds.width)
      for (column, index) in row.enumerated() {
        subviews[index].place(
          at: CGPoint(x: bounds.minX + CGFloat(column) * (width + spacing), y: y),
          proposal: ProposedViewSize(width: width, height: height))
      }
      y += height + spacing
    }
  }

  private func cellWidth(_ columns: Int, _ width: CGFloat) -> CGFloat {
    (width - spacing * CGFloat(columns - 1)) / CGFloat(columns)
  }

  private func rowHeight(_ row: [Int], _ subviews: Subviews, _ width: CGFloat) -> CGFloat {
    let proposal = ProposedViewSize(width: cellWidth(row.count, width), height: nil)
    return row.map { subviews[$0].sizeThatFits(proposal).height }.max() ?? 0
  }

  private func rowCount(_ count: Int, _ width: CGFloat) -> Int { rows(count, width).count }

  /// The most cards per row: react-ui's breakpoints, then as many as fit at
  /// `minCellWidth`.
  static func columns(
    width: CGFloat, maxPerRow: Int, responsive: Bool, spacing: CGFloat, minCellWidth: CGFloat
  ) -> Int {
    let breakpoint = !responsive ? maxPerRow : width <= 480 ? 1 : width <= 768 ? 2 : maxPerRow
    guard minCellWidth > 0 else { return breakpoint }
    let fitting = Int((width + spacing) / (minCellWidth + spacing))
    return max(1, min(breakpoint, fitting))
  }

  /// Subview indices per row, using react-ui's breakpoints.
  private func rows(_ count: Int, _ width: CGFloat) -> [[Int]] {
    let columns = Self.columns(
      width: width, maxPerRow: maxPerRow, responsive: responsive, spacing: spacing,
      minCellWidth: minCellWidth)
    let perRow =
      columns == 1
      ? Array(repeating: 1, count: count) : cardRowConfiguration(count, maxPerRow: columns)
    var start = 0
    return perRow.map { length in
      defer { start += length }
      return Array(start..<start + length)
    }
  }
}

/// Lays out card items like react-ui's CardBlockLayout: rows of up to
/// `maxPerRow` cards, two columns in blocks 768pt wide or less (an odd last
/// card spans both), one column at 480pt or less; or a horizontal carousel.
/// Cards are clickable when the block has an action and the response isn't
/// streaming.
private struct CardBlockLayout<Item: View>: View {
  let props: ComponentProps
  let size: CardBlockSize
  let maxPerRow: Int
  /// The card's minimum width in react-ui's styles, if it has one.
  var minCardWidth: CGFloat = 0
  let click: (Int, ComponentProps) -> (label: String, context: OpenUIObject)
  @ViewBuilder let item: (ComponentProps) -> Item
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form

  var body: some View {
    let items = props.children("items")
    let gap = props.number("gap").flatMap(\.finite).map { CGFloat(max($0, 0)) } ?? 12
    let clickable = props["action"].isTruthy && !context.isStreaming
    Group {
      if props.string("layout") == "carousel" {
        CarouselScroller(count: items.count, spacing: gap, fade: 48, verticalPadding: 4) { index in
          card(index, items[index], clickable: clickable)
            // Sized from the visible width in the same layout pass: measuring
            // it into state instead lays the cards out at the wrong width for a
            // frame, then changes their height.
            .containerRelativeFrame(.horizontal) { width, _ in
              size == .small || width <= 480 ? 280 : 320
            }
        }
      } else {
        ResponsiveCardGrid(
          count: items.count, maxPerRow: maxPerRow, responsive: props.bool("responsive") != false,
          spacing: gap, minCellWidth: minCardWidth
        ) { index in
          card(index, items[index], clickable: clickable)
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  @ViewBuilder
  private func card(_ index: Int, _ entry: ComponentProps, clickable: Bool) -> some View {
    let content = item(entry).environment(\.openUICardClickable, clickable)
    if clickable {
      Button {
        let (label, itemContext) = click(index, entry)
        context.triggerAction(
          label, form: form, action: withItemContext(props["action"], itemContext))
      } label: {
        content.contentShape(Rectangle())
      }
      .buttonStyle(.openUICard)
    } else {
      content
    }
  }
}

private struct CardClickableKey: EnvironmentKey {
  static let defaultValue = false
}

extension EnvironmentValues {
  /// Whether the card being drawn is clickable (its block has an action).
  fileprivate var openUICardClickable: Bool {
    get { self[CardClickableKey.self] }
    set { self[CardClickableKey.self] = newValue }
  }
}

/// The chevron clickable cards show in a corner.
private struct CardChevron: View {
  var size: CGFloat = 14
  var body: some View {
    Image(systemName: "chevron.right").font(.system(size: size * 0.8, weight: .semibold))
  }
}

/// The small-card surface: faint fill when static, raised with an
/// interactive border and a light shadow when clickable.
private struct SmallCardSurface: ViewModifier {
  let clickable: Bool
  @Environment(\.openUITheme) private var theme

  func body(content: Content) -> some View {
    content
      .padding(10)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .background(
        clickable ? theme.surface : theme.subtleSurface, in: RoundedRectangle(cornerRadius: 14)
      )
      .overlay(
        RoundedRectangle(cornerRadius: 14).strokeBorder(
          clickable ? theme.interactiveBorder : theme.border)
      )
      .shadow(color: .black.opacity(clickable ? 0.05 : 0), radius: 2, y: 1)
  }
}

struct SnippetCardBlockView: View {
  let props: ComponentProps
  var body: some View {
    CardBlockLayout(props: props, size: .small, maxPerRow: 2) { index, item in
      let title = childString(item["lhs"], "title")
      return (
        title ?? item.string("id") ?? "Snippet card \(index + 1)",
        [
          "itemIndex": .number(Double(index)), "itemId": item["id"],
          "itemTitle": title.map(OpenUIValue.string) ?? .undefined,
          "itemSubtitle": childString(item["lhs"], "subtitle").map(OpenUIValue.string)
            ?? .undefined,
          "itemValue": childString(item["rhs"], "value").map(OpenUIValue.string) ?? .undefined,
        ]
      )
    } item: {
      SnippetCard(item: $0)
    }
  }
}

struct SnippetCardItemView: View {
  let props: ComponentProps
  var body: some View { SnippetCard(item: props) }
}

/// One row: the label on the left, the value (or a chevron) on the right.
private struct SnippetCard: View {
  let item: ComponentProps
  @Environment(\.openUICardClickable) private var clickable

  var body: some View {
    HStack(alignment: .center, spacing: 12) {
      OpenUINode(item["lhs"]).frame(maxWidth: .infinity, alignment: .leading)
      if !item["rhs"].isNullish {
        OpenUINode(item["rhs"])
          .environment(\.openUITextAlignment, .trailing)
          .fixedSize()
      } else if clickable {
        CardChevron().foregroundStyle(.secondary)
      }
    }
    .modifier(SmallCardSurface(clickable: clickable))
  }
}

struct OverviewCardBlockView: View {
  let props: ComponentProps
  var body: some View {
    CardBlockLayout(props: props, size: .small, maxPerRow: 3, minCardWidth: 158) { index, item in
      let title = childString(item["top"], "title") ?? childString(item["top"], "value")
      let subtitle = childString(item["top"], "subtitle") ?? childString(item["top"], "subtext")
      return (
        title ?? item.string("id") ?? "Overview card \(index + 1)",
        [
          "itemIndex": .number(Double(index)), "itemId": item["id"],
          "itemTitle": title.map(OpenUIValue.string) ?? .undefined,
          "itemSubtitle": subtitle.map(OpenUIValue.string) ?? .undefined,
          "itemMetricValue": item["bottom"].elementValue?.props["value"] ?? .undefined,
        ]
      )
    } item: {
      OverviewCard(item: $0)
    }
  }
}

struct OverviewCardItemView: View {
  let props: ComponentProps
  var body: some View { OverviewCard(item: props) }
}

/// A top slot (with the chevron) and a bottom metric, spread vertically.
private struct OverviewCard: View {
  let item: ComponentProps
  @Environment(\.openUICardClickable) private var clickable

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .top, spacing: 8) {
        OpenUINode(item["top"]).frame(maxWidth: .infinity, alignment: .leading)
        if clickable { CardChevron().foregroundStyle(.secondary) }
      }
      .frame(minHeight: 24, alignment: .top)
      if !item["bottom"].isNullish {
        Spacer(minLength: 18)
        OpenUINode(item["bottom"])
      }
    }
    .modifier(SmallCardSurface(clickable: clickable))
  }
}

struct ContextCardBlockView: View {
  let props: ComponentProps
  var body: some View {
    CardBlockLayout(props: props, size: .small, maxPerRow: 3, minCardWidth: 196) { index, item in
      let title = contextTitle(item)
      return (
        title.isEmpty ? (item.string("id") ?? "Context card \(index + 1)") : title,
        [
          "itemIndex": .number(Double(index)), "itemId": item["id"], "itemTitle": .string(title),
          "itemBody": item["body"], "itemBgColor": item["bgColor"],
          "itemBgImageSrc": item["bgImageSrc"], "itemBgImageAlt": item["bgImageAlt"],
        ]
      )
    } item: {
      ContextCard(item: $0)
    }
  }
}

struct ContextCardItemView: View {
  let props: ComponentProps
  var body: some View { ContextCard(item: props) }
}

/// A context card's title text: the string, or its Tag's text.
private func contextTitle(_ item: ComponentProps) -> String {
  switch item["title"] {
  case .string(let title): return title
  case .element(let tag): return tag.props["text"]?.stringValue ?? ""
  default: return ""
  }
}

/// A small title (or Tag) at the top and bold body text at the bottom, on a
/// tinted fill or a darkened photo.
private struct ContextCard: View {
  let item: ComponentProps
  @Environment(\.openUICardClickable) private var clickable
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let image = item.string("bgImageSrc").flatMap { $0.isEmpty ? nil : $0 }
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .top, spacing: 8) {
        Group {
          if case .element = item["title"] {
            OpenUINode(item["title"]).environment(\.openUITagOnImage, image != nil)
          } else {
            Text(item.text("title")).font(.subheadline)
              .foregroundStyle(
                image == nil ? AnyShapeStyle(.secondary) : AnyShapeStyle(.white.opacity(0.8)))
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        if clickable { CardChevron(size: 16) }
      }
      .frame(minHeight: 24, alignment: .top)
      Spacer(minLength: 18)
      if let body = item.string("body"), !body.isEmpty {
        Text(body).font(.body.weight(.semibold))
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .foregroundStyle(image == nil ? Color.primary : Color.white)
    .background {
      if let image {
        RemoteImage(src: image, alt: item.text("bgImageAlt"))
          .overlay(
            LinearGradient(
              colors: [.black.opacity(0.25), .black.opacity(0.65)], startPoint: .top,
              endPoint: .bottom))
      } else if clickable || item.string("bgColor") == "gray" {
        theme.sunkSurface
      } else {
        theme.subtleSurface
      }
    }
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
}

struct CompositeCardBlockView: View {
  let props: ComponentProps
  var body: some View {
    CardBlockLayout(props: props, size: .medium, maxPerRow: 2, minCardWidth: 240) { index, item in
      let header = item["header"].elementValue?.props ?? OpenUIObject()
      func pick(_ keys: String...) -> String? {
        keys.lazy.compactMap { header[$0]?.stringValue }.first
      }
      let title = pick("title", "value")
      let alt = pick("alt")
      let footer = item["footer"]
      let label = [title, alt, item.string("id")].compactMap { $0 }.first { !$0.isEmpty }
      return (
        label ?? "Composite card \(index + 1)",
        [
          "itemIndex": .number(Double(index)), "itemId": item["id"],
          "itemHeaderTitle": title.map(OpenUIValue.string) ?? .undefined,
          "itemHeaderSubtitle": pick("subtitle", "subtext").map(OpenUIValue.string) ?? .undefined,
          "itemHeaderAlt": alt.map(OpenUIValue.string) ?? .undefined,
          "itemBodyCount": .number(Double(item.array("body").count)),
          "itemFooterPrice": footer["price"].elementValue?.props["value"] ?? .undefined,
          "itemFooterButtonLabel": footer["button"].elementValue?.props["label"] ?? .undefined,
        ]
      )
    } item: {
      CompositeCard(item: $0)
    }
  }
}

struct CompositeCardItemView: View {
  let props: ComponentProps
  var body: some View { CompositeCard(item: props) }
}

/// Header, stacked body content, and a price-over-button footer.
private struct CompositeCard: View {
  let item: ComponentProps
  @Environment(\.openUICardClickable) private var clickable
  @Environment(\.openUITheme) private var theme

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      OpenUINode(item["header"])
      OpenUINodes(item.array("body"), spacing: 12)
      let footer = item["footer"]
      if !footer["price"].isNullish || !footer["button"].isNullish {
        VStack(alignment: .leading, spacing: 8) {
          OpenUINode(footer["price"])
          OpenUINode(footer["button"]).environment(\.openUIButtonFillsWidth, true)
        }
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .background(
      clickable ? theme.surface : theme.subtleSurface, in: RoundedRectangle(cornerRadius: 16)
    )
    .overlay(
      RoundedRectangle(cornerRadius: 16).strokeBorder(
        clickable ? theme.interactiveBorder : theme.border))
  }
}

struct VisualCardBlockView: View {
  let props: ComponentProps
  var body: some View {
    CardBlockLayout(props: props, size: .medium, maxPerRow: 3) { index, item in
      let bodyValue = item["body"].elementValue?.props["value"]?.stringValue
      let tagText = item["tag"].elementValue?.props["text"]?.stringValue
      let label = [bodyValue, tagText, item.string("id")].compactMap { $0 }.first { !$0.isEmpty }
      return (
        label ?? "Visual card \(index + 1)",
        [
          "itemIndex": .number(Double(index)), "itemId": item["id"],
          "itemTag": tagText.map(OpenUIValue.string) ?? .undefined,
          "itemBody": bodyValue.map(OpenUIValue.string) ?? .undefined,
          "itemBodySubtext": item["body"].elementValue?.props["subtext"] ?? .undefined,
          "itemBgImageSrc": item["bgImageSrc"], "itemBgImageAlt": item["bgImageAlt"],
        ]
      )
    } item: {
      VisualCard(item: $0)
    }
  }
}

struct VisualCardItemView: View {
  let props: ComponentProps
  var body: some View { VisualCard(item: props) }
}

/// A photo-first card: the image fills the card, the tag and chevron sit on
/// top, and the text panel floats over the bottom of the photo.
private struct VisualCard: View {
  let item: ComponentProps
  @Environment(\.openUICardClickable) private var clickable
  @Environment(\.openUIHovered) private var hovered
  @Environment(\.openUITheme) private var theme

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .top) {
        OpenUINode(item["tag"]).environment(\.openUITagOnImage, true)
        Spacer(minLength: 8)
        if clickable {
          CardChevron(size: 16)
            .foregroundStyle(.white)
            .padding(4)
            .background(.black.opacity(0.4), in: RoundedRectangle(cornerRadius: 6))
        }
      }
      .frame(minHeight: 24, alignment: .top)
      .padding(12)
      Spacer(minLength: 0)
      if textBlockHasContent(item["body"]) {
        OpenUINode(item["body"])
          .padding(.vertical, 8)
          .padding(.horizontal, 10)
          .frame(maxWidth: .infinity, alignment: .leading)
          .background(theme.surface, in: RoundedRectangle(cornerRadius: 10))
          .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(theme.border))
          .padding([.horizontal, .bottom], 12)
      }
    }
    .frame(maxWidth: .infinity, minHeight: 280, maxHeight: .infinity, alignment: .topLeading)
    .background {
      ZStack {
        theme.subtleSurface
        RemoteImage(src: item.string("bgImageSrc"), alt: item.text("bgImageAlt"))
          // react-ui zooms a clickable card's photo under the pointer.
          .scaleEffect(hovered ? 1.04 : 1)
          .animation(.easeOut(duration: 0.3), value: hovered)
      }
    }
    .clipShape(RoundedRectangle(cornerRadius: 16))
    .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(theme.border))
  }
}

// MARK: - Building blocks

/// Whether a card's text block (`Text`, `BoldText`) has anything to show. A
/// response can bind one to values that come out empty (a loop variable used
/// outside its `@Each`), and its panel would then float empty over the photo.
func textBlockHasContent(_ value: OpenUIValue) -> Bool {
  guard let element = value.elementValue, ["Text", "BoldText"].contains(element.typeName) else {
    return !value.isNullish
  }
  return ["value", "subtext"].contains { !displayText(element.props[$0] ?? .undefined).isEmpty }
}

/// `Text` / `BoldText`: a value line with optional subtext. `variant "number"`
/// uses tabular digits; `subtextVariant "metric"` colors a leading +/- green/red.
struct TextLineView: View {
  let props: ComponentProps
  let bold: Bool
  @Environment(\.openUITextAlignment) private var alignment
  @Environment(\.openUITheme) private var theme

  var body: some View {
    VStack(alignment: alignment == .trailing ? .trailing : .leading, spacing: 2) {
      Text(props.text("value"))
        .font(font.weight(bold ? .semibold : .regular))
        .monospacedDigit(props.string("variant") == "number")
      if let subtext = props.string("subtext"), !subtext.isEmpty {
        Text(subtext)
          .font(.caption)
          .monospacedDigit(props.string("subtextVariant") != "text")
          .foregroundStyle(subtextColor(subtext))
      }
    }
  }

  private var font: Font {
    switch props.string("size") {
    case "xs": return .footnote
    case "sm": return .subheadline
    case "lg": return .title2
    default: return .body
    }
  }

  private func subtextColor(_ subtext: String) -> Color {
    guard props.string("subtextVariant") == "metric" else { return .secondary }
    if subtext.hasPrefix("+") { return theme.success }
    if subtext.hasPrefix("-") || subtext.hasPrefix("−") { return theme.danger }
    return .secondary
  }
}

extension View {
  @ViewBuilder
  fileprivate func monospacedDigit(_ enabled: Bool) -> some View {
    if enabled { monospacedDigit() } else { self }
  }
}

struct IconTextView: View {
  let props: ComponentProps

  var body: some View {
    let vertical = props.string("layout") == "vertical"
    let layout =
      vertical
      ? AnyLayout(VStackLayout(alignment: .leading, spacing: 8))
      : AnyLayout(HStackLayout(spacing: 10))
    layout {
      IconBadge(
        symbol: iconSymbol(props["icon"])
          ?? LucideSymbols.systemName(for: "circle-dot", category: nil),
        variant: props.string("iconVariant"), size: props.string("iconSize"))
      TitleStack(props: props)
    }
  }
}

/// An icon on a tinted rounded square.
private struct IconBadge: View {
  let symbol: String
  let variant: String?
  let size: String?
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let side: CGFloat =
      switch size {
      case "xs": 20
      case "s", "sm": 26
      case "l", "lg": 40
      case "xl": 48
      default: 32
      }
    let (foreground, background) = colors
    Image(systemName: symbol)
      .font(.system(size: side * 0.5))
      .foregroundStyle(foreground)
      .frame(width: side, height: side)
      .background(background, in: RoundedRectangle(cornerRadius: theme.smallCornerRadius))
  }

  private var colors: (Color, Color) {
    switch variant {
    case "info", "success", "warning", "danger":
      let color = theme.status(variant)
      return (color, color.opacity(0.14))
    case "inverted": return (Color(white: 0.98), Color.primary)
    case "filled": return (theme.onAccent, theme.accent)
    case "soft": return (theme.accent, theme.accent.opacity(0.14))
    default: return (.primary, theme.sunkSurface)
    }
  }
}

/// Title (bold when asked) with an optional subtitle.
private struct TitleStack: View {
  let props: ComponentProps
  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(props.text("title")).fontWeight(props.bool("bold") == true ? .semibold : .medium)
      if let subtitle = props.string("subtitle"), !subtitle.isEmpty {
        Text(subtitle).font(.caption).foregroundStyle(.secondary)
      }
    }
  }
}

struct ImageTextView: View {
  let props: ComponentProps

  var body: some View {
    let size = CGFloat(min(max(props.number("imageSize").flatMap(\.finite) ?? 40, 0), 400))
    let vertical = props.string("layout") == "vertical"
    let layout =
      vertical
      ? AnyLayout(VStackLayout(alignment: .leading, spacing: 8))
      : AnyLayout(HStackLayout(spacing: 10))
    layout {
      RemoteImage(src: props.string("src"), alt: props.text("alt"))
        .frame(width: size, height: size)
      TitleStack(props: props)
    }
  }
}

struct ImageTextLargeView: View {
  let props: ComponentProps

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      RemoteImage(src: props.string("src"), alt: props.text("alt"))
        .frame(height: 160)
        .clipped()
      TitleStack(props: props)
    }
  }
}

struct MetricIndicatorInlineView: View {
  let props: ComponentProps

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      HStack(alignment: .firstTextBaseline, spacing: 6) {
        Text(props.text("value")).font(.headline.monospacedDigit())
        TrendLabel(trend: props["trend"])
      }
      if let subtext = props.string("subtext"), !subtext.isEmpty {
        Text(subtext).font(.caption).foregroundStyle(.secondary)
      }
    }
  }
}

struct MetricIndicatorWithStrikethroughView: View {
  let props: ComponentProps

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      HStack(alignment: .firstTextBaseline, spacing: 6) {
        Text(props.text("value")).font(.title3.weight(.semibold).monospacedDigit())
        if let previous = props.string("previousValue"), !previous.isEmpty {
          Text(previous).font(.subheadline).strikethrough().foregroundStyle(.secondary)
        }
        TrendLabel(trend: props["trend"])
      }
      if let subtext = props.string("subtext"), !subtext.isEmpty {
        Text(subtext).font(.caption).foregroundStyle(.secondary)
      }
    }
  }
}

/// `{ direction, value }` as an arrow and percentage, in the success color
/// going up and the danger color going down.
private struct TrendLabel: View {
  let trend: OpenUIValue
  @Environment(\.openUITheme) private var theme

  var body: some View {
    if let value = trend["value"].numberValue {
      let up = trend["direction"].stringValue == "up"
      HStack(spacing: 2) {
        Image(systemName: up ? "arrow.up.right" : "arrow.down.right")
        Text("\(jsNumberToString(value))%")
      }
      .font(.caption.weight(.medium).monospacedDigit())
      .foregroundStyle(up ? theme.success : theme.danger)
    }
  }
}
