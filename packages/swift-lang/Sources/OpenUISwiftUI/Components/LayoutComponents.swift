import OpenUILang
import SwiftUI

// MARK: - Table

/// Column-oriented table: each `Col` holds its own data array. Cells can be
/// text or elements (e.g. buttons from `@Each`). Long tables page by 10 rows.
struct TableView: View {
  let props: ComponentProps
  @State private var page = 0
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUITheme) private var theme

  private static let pageSize = 10

  var body: some View {
    let columns = props.children("columns")
    let data = columns.map { column -> [OpenUIValue] in
      let raw = column["data"]
      if case .array(let items) = raw { return items }
      return raw.isNullish ? [] : [raw]
    }
    let rowCount = data.map(\.count).max() ?? 0
    let pages = max(1, Int((Double(rowCount) / Double(Self.pageSize)).rounded(.up)))
    let current = min(page, pages - 1)
    let rows = Array(
      stride(from: current * Self.pageSize, to: min(rowCount, (current + 1) * Self.pageSize), by: 1)
    )

    if context.isQueryLoading && rowCount == 0 {
      // Placeholder rows while a Query fills the table, like react-ui's skeleton.
      VStack(alignment: .leading, spacing: 10) {
        ForEach(0..<5, id: \.self) { _ in SkeletonBlock(height: 14, cornerRadius: 4) }
      }
    } else if !columns.isEmpty {
      VStack(alignment: .leading, spacing: theme.compactSpacing) {
        // Full width like react-ui's table; scrolls sideways when the columns
        // don't fit.
        ViewThatFits(in: .horizontal) {
          grid(columns, data, rows)
          ScrollView(.horizontal, showsIndicators: false) {
            grid(columns, data, rows).fixedSize(horizontal: true, vertical: false)
          }
        }
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(theme.border))
        if pages > 1 {
          HStack(spacing: 8) {
            Spacer()
            Button("Previous page", systemImage: "chevron.left") { page = max(0, current - 1) }
              .disabled(current == 0)
            Text("\(current + 1) / \(pages)").font(.caption.monospacedDigit())
              .foregroundStyle(.secondary)
            Button("Next page", systemImage: "chevron.right") {
              page = min(pages - 1, current + 1)
            }
            .disabled(current >= pages - 1)
          }
          .labelStyle(.iconOnly)
          .buttonStyle(.bordered)
          .controlSize(.small)
        }
      }
    }
  }

  private func grid(_ columns: [ComponentProps], _ data: [[OpenUIValue]], _ rows: [Int])
    -> some View
  {
    Grid(alignment: .leading, horizontalSpacing: 0, verticalSpacing: 0) {
      GridRow {
        ForEach(columns.indices, id: \.self) { index in
          Text(columns[index].text("label"))
            .font(.subheadline)
            .foregroundStyle(.secondary)
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
      }
      theme.border.frame(height: 1)
      ForEach(rows.indices, id: \.self) { position in
        let row = rows[position]
        GridRow {
          ForEach(columns.indices, id: \.self) { index in
            cell(row < data[index].count ? data[index][row] : .null)
              .padding(12)
              .frame(maxWidth: .infinity, alignment: .leading)
              // Every second row is tinted, as in react-ui.
              .background(position % 2 == 1 ? theme.subtleSurface : .clear)
          }
        }
        if position < rows.count - 1 { theme.border.frame(height: 1) }
      }
    }
  }

  @ViewBuilder
  private func cell(_ value: OpenUIValue) -> some View {
    switch value {
    case .element, .array:
      OpenUINode(value)
    default:
      Text(displayText(value)).font(.subheadline)
    }
  }
}

struct ColView: View {
  let props: ComponentProps

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(props.text("label")).font(.subheadline.weight(.semibold))
      OpenUINodes(props.array("data"), spacing: 4)
    }
  }
}

// MARK: - Lists

struct ListBlockView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context

  var body: some View {
    let numbered = props.string("variant") != "image"
    let small = props.string("size") == "small"
    VStack(alignment: .leading, spacing: small ? 6 : 10) {
      ForEach(Array(props.children("items").enumerated()), id: \.offset) { index, item in
        ListRow(
          item: item, marker: numbered ? "\(index + 1)" : nil, small: small,
          onTap: item["action"].isNullish
            ? nil
            : { context.triggerAction(item.text("title"), action: item["action"]) })
      }
    }
  }
}

struct ListItemView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context

  var body: some View {
    ListRow(
      item: props, marker: nil, small: false,
      onTap: props["action"].isNullish
        ? nil : { context.triggerAction(props.text("title"), action: props["action"]) })
  }
}

/// A list row: marker or image, title and subtitle, clickable only with an action.
private struct ListRow: View {
  let item: ComponentProps
  let marker: String?
  let small: Bool
  let onTap: (() -> Void)?
  @Environment(\.openUITheme) private var theme

  var body: some View {
    if let onTap {
      Button(action: onTap) { Hovering(content: row) }.buttonStyle(.openUIHover)
    } else {
      row(hovered: false)
    }
  }

  /// react-ui grows a clickable row's marker and deepens its fill under the
  /// pointer.
  private func row(hovered: Bool) -> some View {
    HStack(alignment: .top, spacing: 10) {
      if let marker {
        Text(marker)
          .font(.caption.weight(.semibold).monospacedDigit())
          .frame(width: 22, height: 22)
          .background(hovered ? Color.primary.opacity(0.1) : theme.sunkSurface, in: Circle())
          .scaleEffect(hovered ? 1.1 : 1)
      } else if let src = item["image"]["src"].stringValue {
        RemoteImage(src: src, alt: displayText(item["image"]["alt"]))
          .frame(width: 44, height: 44)
          .scaleEffect(hovered ? 1.1 : 1)
      }
      VStack(alignment: .leading, spacing: 2) {
        Text(item.text("title")).font(small ? .subheadline : .body)
        if let subtitle = item.string("subtitle"), !subtitle.isEmpty {
          Text(subtitle).font(.caption).foregroundStyle(.secondary)
        }
      }
      Spacer(minLength: 0)
      if onTap != nil {
        if let actionLabel = item.string("actionLabel"), !actionLabel.isEmpty {
          Text(actionLabel).font(.caption.weight(.medium)).foregroundStyle(theme.accent)
        } else {
          Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary)
        }
      }
    }
    .contentShape(Rectangle())
  }
}

/// "Related Queries" and a divided list of suggestions, like react-ui's
/// FollowUpBlock; tapping one sends its text as the user's message.
struct FollowUpBlockView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let items = props.children("items")
    VStack(alignment: .leading, spacing: 0) {
      Text("Related Queries")
        .foregroundStyle(.secondary)
        .padding(.vertical, 8)
      theme.border.frame(height: 1)
      ForEach(items.indices, id: \.self) { index in
        let text = items[index].text("text")
        FollowUpButton(text: text) { context.triggerAction(text) }
        if index < items.count - 1 { theme.border.frame(height: 1) }
      }
    }
    .disabled(context.isStreaming)
  }
}

struct FollowUpItemView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context

  var body: some View {
    FollowUpButton(text: props.text("text")) { context.triggerAction(props.text("text")) }
      .disabled(context.isStreaming)
  }
}

/// A suggested next message; tapping it sends the text as the user's message.
private struct FollowUpButton: View {
  let text: String
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      Text(text)
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 8)
        .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
  }
}

struct StepsView: View {
  let props: ComponentProps
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let items = props.children("items")
    VStack(alignment: .leading, spacing: 0) {
      ForEach(Array(items.enumerated()), id: \.offset) { index, item in
        HStack(alignment: .top, spacing: 12) {
          VStack(spacing: 0) {
            Text("\(index + 1)")
              .font(.caption.weight(.bold).monospacedDigit())
              .foregroundStyle(theme.onAccent)
              .frame(width: 22, height: 22)
              .background(theme.accent, in: Circle())
            if index < items.count - 1 {
              Rectangle().fill(.secondary.opacity(0.3)).frame(width: 2).frame(maxHeight: .infinity)
            }
          }
          StepContent(item: item).padding(.bottom, index < items.count - 1 ? 14 : 0)
        }
      }
    }
  }
}

struct StepsItemView: View {
  let props: ComponentProps
  var body: some View { StepContent(item: props) }
}

private struct StepContent: View {
  let item: ComponentProps

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(item.text("title")).font(.subheadline.weight(.semibold))
      InlineMarkdown(item.text("details")).font(.subheadline).foregroundStyle(.secondary)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

// MARK: - Tabs, accordions and sections

/// Underlined tabs. Until the user picks one, the selection follows the stream
/// to whichever tab's content grew last, like react-ui's Tabs.
struct TabsView: View {
  let props: ComponentProps
  @State private var active: String?
  @State private var userChose = false
  @State private var contentSizes: [String: Int] = [:]
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let items = props.children("items").filter { !$0["value"].isNullish }
    let sizes = items.map {
      (value: $0.text("value"), size: JSON.stringify($0["content"]).utf16.count)
    }
    if !items.isEmpty {
      VStack(alignment: .leading, spacing: theme.spacing) {
        ScrollViewReader { proxy in
          ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 20) {
              ForEach(items.indices, id: \.self) { index in
                tab(items[index]).id(items[index].text("value"))
              }
            }
          }
          // Keep the active tab in view as the selection follows the stream.
          .onChange(of: active) {
            withAnimation { proxy.scrollTo(active, anchor: .center) }
          }
        }
        if let item = items.first(where: { $0.text("value") == active }) {
          OpenUINodes(item.array("content"))
        }
      }
      .onChange(of: sizes.map(\.size), initial: true) { followStream(sizes) }
    }
  }

  private func tab(_ item: ComponentProps) -> some View {
    let value = item.text("value")
    let isActive = value == active
    return Button {
      userChose = true
      withOpenUIAnimation(Motion.reveal) { active = value }
    } label: {
      Hovering { hovered in
        Text(item.text("trigger"))
          .font(.subheadline.weight(isActive ? .semibold : .regular))
          .foregroundStyle(isActive || hovered ? .primary : .secondary)
          .padding(.vertical, 6)
          .overlay(alignment: .bottom) {
            if isActive { Rectangle().fill(.primary).frame(height: 2) }
          }
      }
    }
    .buttonStyle(.openUIHover)
  }

  private func followStream(_ sizes: [(value: String, size: Int)]) {
    if active == nil { active = sizes.first?.value }
    guard !userChose else { return }
    var candidate: String?
    for (value, size) in sizes where size > (contentSizes[value] ?? 0) { candidate = value }
    contentSizes = Dictionary(sizes.map { ($0.value, $0.size) }, uniquingKeysWith: { $1 })
    if let candidate, candidate != active {
      withOpenUIAnimation(Motion.reveal) { active = candidate }
    }
  }
}

/// One item open at a time. Until the user opens or closes one, the newest
/// item opens as it streams in, like react-ui's Accordion.
struct AccordionView: View {
  let props: ComponentProps
  @State private var open: String?
  @State private var userChose = false
  @State private var seenCount = 0

  var body: some View {
    let items = props.children("items")
    VStack(alignment: .leading, spacing: 0) {
      ForEach(items.indices, id: \.self) { index in
        let value = items[index].text("value")
        Disclosure(
          trigger: items[index].text("trigger"), content: items[index].array("content"),
          isOpen: Binding(
            get: { open == value },
            set: { isOpen in
              userChose = true
              open = isOpen ? value : nil
            }))
        if index < items.count - 1 { Divider() }
      }
    }
    .onChange(of: items.count, initial: true) {
      if !userChose, items.count > seenCount, let newest = items.last {
        withOpenUIAnimation(Motion.reveal) { open = newest.text("value") }
      }
      seenCount = items.count
    }
  }
}

/// Sections open as they stream in, then fold back to the first one when the
/// response finishes (unless the user opened or closed one), like react-ui's
/// SectionBlock. With `isFoldable: false` every section is shown.
struct SectionBlockView: View {
  let props: ComponentProps
  @State private var open: Set<String> = []
  @State private var userChose = false
  @State private var seenCount = 0
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let sections = props.children("sections")
    let values = sections.indices.map { sectionValue(sections[$0], $0) }
    if props.bool("isFoldable") == false {
      VStack(alignment: .leading, spacing: theme.spacing) {
        ForEach(sections.indices, id: \.self) { index in
          VStack(alignment: .leading, spacing: theme.compactSpacing) {
            Text(sections[index].text("trigger")).font(.headline)
            OpenUINodes(sections[index].array("content"))
          }
        }
      }
    } else {
      VStack(alignment: .leading, spacing: 0) {
        ForEach(sections.indices, id: \.self) { index in
          let value = values[index]
          Disclosure(
            trigger: sections[index].text("trigger"), content: sections[index].array("content"),
            isOpen: Binding(
              get: { open.contains(value) },
              set: { isOpen in
                userChose = true
                if isOpen { open.insert(value) } else { open.remove(value) }
              }))
          if index < sections.count - 1 { Divider() }
        }
      }
      .onChange(of: values.count, initial: true) {
        if context.isStreaming, values.count > seenCount, !userChose, let last = values.last {
          withOpenUIAnimation(Motion.reveal) { _ = open.insert(last) }
        } else if open.isEmpty, let first = values.first {
          open = [first]
        }
        seenCount = values.count
      }
      .onChange(of: context.isStreaming) { wasStreaming, isStreaming in
        if wasStreaming, !isStreaming, !userChose, let first = values.first {
          withOpenUIAnimation(Motion.reveal) { open = [first] }
        }
      }
    }
  }

  private func sectionValue(_ section: ComponentProps, _ index: Int) -> String {
    section["value"].isNullish ? String(index) : section.text("value")
  }
}

/// A sub-item rendered on its own: its trigger as a heading, then its content.
struct TriggeredContentView: View {
  let props: ComponentProps
  @Environment(\.openUITheme) private var theme

  var body: some View {
    VStack(alignment: .leading, spacing: theme.compactSpacing) {
      Text(props.text("trigger")).font(.headline)
      OpenUINodes(props.array("content"))
    }
  }
}

private struct Disclosure: View {
  let trigger: String
  let content: [OpenUIValue]
  @Binding var isOpen: Bool

  var body: some View {
    DisclosureGroup(isExpanded: $isOpen) {
      OpenUINodes(content).padding(.top, 6)
    } label: {
      Text(trigger).font(.subheadline.weight(.semibold))
    }
    .padding(.vertical, 8)
  }
}

// MARK: - Carousel

/// Slides scroll horizontally, like react-ui's Carousel: 280-point cards
/// (248 on narrow screens) with buttons to step through them.
struct CarouselView: View {
  let props: ComponentProps
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let slides = props.array("children")
    let fill = props.string("variant") == "sunk" ? theme.subtleSurface : theme.surface
    CarouselScroller(
      count: slides.count, spacing: 12, fade: 40, showsButtons: true, equalHeights: true
    ) {
      index in
      OpenUINodes(slides[index].arrayValue ?? [slides[index]])
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(12)
        .background(fill, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(theme.border))
        .containerRelativeFrame(.horizontal) { width, _ in width <= 400 ? 248 : 280 }
    }
  }
}

/// A horizontal row that scrolls like react-ui's carousels: items snap to the
/// leading edge, an edge fades out where there's more to scroll, and buttons
/// step one item at a time. Whether it can scroll only drives the fades and
/// buttons, never a size, so it can't feed back into layout.
struct CarouselScroller<Item: View>: View {
  let count: Int
  var spacing: CGFloat
  /// How far an edge fades out: 40 for react-ui's Carousel, its `space-3xl`
  /// (48) for card blocks.
  var fade: CGFloat
  /// Shows the buttons all the time, as react-ui's Carousel does. Card blocks
  /// show them only while a pointer is over the row: a mouse wheel scrolls
  /// up and down, so without them a mouse can't reach the cards past the
  /// edge (a browser has shift-scrolling and a scrollbar for that).
  var showsButtons = false
  /// Stretches items to the tallest one, as a flex row does.
  var equalHeights = false
  var verticalPadding: CGFloat = 2
  @ViewBuilder let item: (Int) -> Item
  @State private var position: Int?
  @State private var content = CGRect.zero
  @State private var visibleWidth: CGFloat = 0
  @State private var hoveringRow = false
  /// The buttons hang half outside the row, so the pointer can be on one
  /// without being over the row.
  @State private var hoveringButton = false
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let canScrollBack = content.minX < -1
    let canScrollOn = content.maxX > visibleWidth + 1
    let buttons = showsButtons || hoveringRow || hoveringButton
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(alignment: .top, spacing: spacing) {
        ForEach(0..<count, id: \.self) { item($0).id($0) }
      }
      .fixedSize(horizontal: false, vertical: equalHeights)
      .scrollTargetLayout()
      .padding(.vertical, verticalPadding)
      .onGeometryChange(for: CGRect.self) {
        $0.frame(in: .scrollView)
      } action: {
        content = $0
      }
    }
    .scrollTargetBehavior(.viewAligned)
    .scrollPosition(id: $position, anchor: .leading)
    // Items and their images arrive after the first layout; stay at the start
    // instead of wherever the old content ended.
    .defaultScrollAnchor(.leading)
    .onGeometryChange(for: CGFloat.self) {
      $0.size.width
    } action: {
      visibleWidth = $0
    }
    .mask {
      HStack(spacing: 0) {
        LinearGradient(colors: [.clear, .black], startPoint: .leading, endPoint: .trailing)
          .frame(width: canScrollBack ? fade : 0)
        Rectangle()
        LinearGradient(colors: [.black, .clear], startPoint: .leading, endPoint: .trailing)
          .frame(width: canScrollOn ? fade : 0)
      }
    }
    .onHover { hoveringRow = $0 }
    .overlay(alignment: .leading) {
      if buttons && canScrollBack { stepButton(-1) }
    }
    .overlay(alignment: .trailing) {
      if buttons && canScrollOn { stepButton(1) }
    }
    .animation(.easeOut(duration: 0.15), value: buttons)
  }

  /// react-ui's small square secondary button, half over the edge.
  private func stepButton(_ step: Int) -> some View {
    Button {
      withOpenUIAnimation(Motion.reveal) {
        position = min(max((position ?? 0) + step, 0), count - 1)
      }
    } label: {
      Image(systemName: step < 0 ? "chevron.left" : "chevron.right")
        .font(.footnote.weight(.semibold))
        .frame(width: 28, height: 28)
        .background(theme.surface, in: RoundedRectangle(cornerRadius: theme.smallCornerRadius))
        .overlay(
          RoundedRectangle(cornerRadius: theme.smallCornerRadius).strokeBorder(
            theme.interactiveBorder)
        )
        .shadow(color: .black.opacity(0.08), radius: 3, y: 1)
    }
    .buttonStyle(.plain)
    .onHover { hoveringButton = $0 }
    // A button that goes away under the pointer (the row reached its end)
    // never hears the pointer leave.
    .onDisappear { hoveringButton = false }
    .accessibilityLabel(step < 0 ? "Previous" : "Next")
    .offset(x: step < 0 ? -12 : 12)
  }
}
