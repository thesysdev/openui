import OpenUILang
import SwiftUI

// MARK: - Card

struct CardView: View {
  let props: ComponentProps
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let sources = props.array("sources")
    VStack(alignment: .leading, spacing: theme.spacing) {
      OpenUINodes(props.array("children"))
      if !sources.isEmpty {
        SourcesStrip(sources: sources)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .surface("card")
    .environment(\.openUICardSources, sources)
  }
}

/// Numbered references cited inline as [1], [2] in the card's text.
private struct SourcesStrip: View {
  let sources: [OpenUIValue]

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Sources").font(.subheadline.weight(.medium)).foregroundStyle(.secondary)
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(alignment: .top, spacing: 12) {
          ForEach(sources.indices, id: \.self) { index in
            SourceCard(source: sources[index])
          }
        }
      }
    }
  }
}

/// One source, like react-ui's listed source: favicon and site name, then the
/// title. Opens the source when it has a URL.
private struct SourceCard: View {
  let source: OpenUIValue
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let url = source["url"].stringValue.flatMap(URL.init(string:))
    let card = Hovering { hovered in
      VStack(alignment: .leading, spacing: 4) {
        HStack(spacing: 8) {
          Favicon(host: url?.host())
          Text(displayText(source["sourceName"])).font(.caption.weight(.medium)).lineLimit(1)
        }
        Text(displayText(source["title"]))
          .font(.caption)
          .foregroundStyle(.secondary)
          .lineLimit(2)
          .multilineTextAlignment(.leading)
      }
      .padding(8)
      .frame(width: 180, alignment: .topLeading)
      .background(
        Color.primary.opacity(hovered ? 0.03 : 0), in: RoundedRectangle(cornerRadius: 10)
      )
      .overlay(
        RoundedRectangle(cornerRadius: 10).strokeBorder(
          hovered ? theme.interactiveBorder : theme.border))
    }
    if let url {
      Link(destination: url) { card }.buttonStyle(.openUIHover)
    } else {
      card
    }
  }
}

/// A site's favicon from Google's favicon service, as react-ui uses, with a
/// globe while it loads or when there's no URL.
private struct Favicon: View {
  let host: String?

  var body: some View {
    Group {
      if let host, let url = URL(string: "https://www.google.com/s2/favicons?sz=128&domain=\(host)")
      {
        AsyncImage(url: url) { image in
          image.resizable().scaledToFit()
        } placeholder: {
          Image(systemName: "globe").foregroundStyle(.secondary)
        }
      } else {
        Image(systemName: "globe").foregroundStyle(.secondary)
      }
    }
    .frame(width: 20, height: 20)
    .clipShape(RoundedRectangle(cornerRadius: 4))
  }
}

struct CardHeaderView: View {
  let props: ComponentProps

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      if let title = props.string("title"), !title.isEmpty {
        Text(title).font(.title3.weight(.semibold))
      }
      if let subtitle = props.string("subtitle"), !subtitle.isEmpty {
        Text(subtitle).font(.subheadline).foregroundStyle(.secondary)
      }
    }
  }
}

// MARK: - Text

struct TextContentView: View {
  let props: ComponentProps

  var body: some View {
    // Full markdown with citations, like react-ui's TextContentWrapper.
    MarkdownBlocks(props.text("text"), citations: true)
      .font(font)
      .frame(maxWidth: .infinity, alignment: .leading)
  }

  private var font: Font {
    switch props.string("size") {
    case "small": return .footnote
    case "large": return .title3
    case "small-heavy": return .footnote.weight(.semibold)
    case "large-heavy": return .title3.weight(.semibold)
    default: return .body
    }
  }
}

struct MarkDownRendererView: View {
  let props: ComponentProps

  var body: some View {
    MarkdownBlocks(props.text("textMarkdown"))
      .frame(maxWidth: .infinity, alignment: .leading)
      .surface(props.string("variant") ?? "clear")
  }
}

struct InlineHeaderView: View {
  let props: ComponentProps

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(props.text("heading")).font(.headline)
      if let description = props.string("description"), !description.isEmpty {
        Text(description).font(.subheadline).foregroundStyle(.secondary)
      }
    }
  }
}

// MARK: - Callouts

struct CalloutView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context

  var body: some View {
    let field = context.stateField(name: "visible", binding: props["visible"], form: nil)
    let visible = field.isReactive ? (field.value == true || field.value == "true") : true
    if visible {
      Banner(
        variant: props.string("variant"), title: props.text("title"),
        description: props.text("description")
      )
      .task(id: field.isReactive && !context.isStreaming) {
        // A $visible binding auto-dismisses the callout after 3 seconds.
        guard field.isReactive, !context.isStreaming else { return }
        try? await Task.sleep(nanoseconds: 3_000_000_000)
        if !Task.isCancelled { field.setValue(false) }
      }
    }
  }
}

struct TextCalloutView: View {
  let props: ComponentProps

  var body: some View {
    Banner(
      variant: props.string("variant") ?? "neutral", title: props.text("title"),
      description: props.text("description"))
  }
}

private struct Banner: View {
  let variant: String?
  let title: String
  let description: String
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let color = theme.status(variant)
    HStack(alignment: .top, spacing: 10) {
      Image(systemName: symbol).foregroundStyle(color)
      VStack(alignment: .leading, spacing: 2) {
        if !title.isEmpty { Text(title).font(.subheadline.weight(.semibold)) }
        if !description.isEmpty { InlineMarkdown(description).font(.subheadline) }
      }
      Spacer(minLength: 0)
    }
    .padding(12)
    .background(color.opacity(0.1), in: RoundedRectangle(cornerRadius: theme.smallCornerRadius))
    .overlay(
      RoundedRectangle(cornerRadius: theme.smallCornerRadius).strokeBorder(color.opacity(0.35)))
  }

  private var symbol: String {
    switch variant {
    case "warning": return "exclamationmark.triangle.fill"
    case "error", "danger": return "xmark.octagon.fill"
    case "success": return "checkmark.circle.fill"
    case "info": return "info.circle.fill"
    default: return "text.bubble.fill"
    }
  }
}

// MARK: - Code

/// A code block like react-ui's: Prism's `vscDarkPlus` colors (in light mode
/// too), and a copy button in the corner (on hover on the Mac, as on the web).
struct CodeBlockView: View {
  let props: ComponentProps

  var body: some View {
    CodeBlockContent(
      code: props.text("codeString"), language: props.string("language"),
      theme: .darkPlus)
  }
}

/// Highlighted code with a copy button, shared with code in markdown.
struct CodeBlockContent: View {
  let code: String
  let language: String?
  let theme: SyntaxHighlighter.Theme
  @State private var copied = false
  @State private var hovering = false
  @Environment(\.openUITheme) private var openUITheme

  var body: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      Text(SyntaxHighlighter.highlight(code, language: language, theme: theme))
        .font(.system(size: 13, design: .monospaced))
        .lineSpacing(4)
        .textSelection(.enabled)
        .fixedSize(horizontal: true, vertical: false)
        .padding(13)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(theme.background, in: RoundedRectangle(cornerRadius: 8))
    .overlay(alignment: .topTrailing) {
      copyButton
        .padding(8)
        .opacity(showsCopyButton ? 1 : 0)
        .animation(.easeInOut(duration: 0.2), value: showsCopyButton)
    }
    .onHover { hovering = $0 }
  }

  private var showsCopyButton: Bool {
    #if os(macOS)
      hovering || copied
    #else
      true
    #endif
  }

  private var copyButton: some View {
    Button {
      copyToPasteboard(code)
      copied = true
      Task {
        try? await Task.sleep(for: .seconds(1))
        copied = false
      }
    } label: {
      Image(systemName: copied ? "checkmark" : "doc.on.doc")
        .font(.caption.weight(.semibold))
        .contentTransition(.symbolEffect(.replace))
        .foregroundStyle(copied ? openUITheme.success : Color.primary)
        .frame(width: 26, height: 26)
        .background(
          copied ? openUITheme.success.opacity(0.15) : Color.platformElevatedBackground,
          in: RoundedRectangle(cornerRadius: 6)
        )
        .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(Color.primary.opacity(0.12)))
    }
    .buttonStyle(.plain)
    .accessibilityLabel(copied ? "Copied to clipboard" : "Copy code")
  }
}

/// Puts `text` on the system pasteboard.
@MainActor
func copyToPasteboard(_ text: String) {
  #if os(macOS)
    NSPasteboard.general.clearContents()
    NSPasteboard.general.setString(text, forType: .string)
  #else
    UIPasteboard.general.string = text
  #endif
}

// MARK: - Images

struct ImageView: View {
  let props: ComponentProps

  var body: some View {
    RemoteImage(src: props.string("src"), alt: props.text("alt"), fit: true)
  }
}

struct ImageBlockView: View {
  let props: ComponentProps

  var body: some View {
    RemoteImage(src: props.string("src"), alt: props.text("alt"), fit: true)
  }
}

/// react-ui's ImageGallery: the first five images in a mosaic, a "Show All"
/// button when there are more, and a viewer with every image. Tapping an image
/// opens the viewer on it.
struct ImageGalleryView: View {
  let props: ComponentProps
  @State private var selected = 0
  @State private var showsViewer = false
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let images = props.array("images")
    if !images.isEmpty {
      GalleryMosaic {
        ForEach(Array(images.prefix(GalleryMosaic.maxImages).enumerated()), id: \.offset) {
          index, image in
          Button {
            selected = index
            showsViewer = true
          } label: {
            GalleryTile(src: image["src"].stringValue)
          }
          .buttonStyle(.plain)
          .accessibilityLabel(galleryImageLabel(image, index))
        }
      }
      .clipShape(RoundedRectangle(cornerRadius: theme.cornerRadius))
      .overlay(alignment: .bottomTrailing) {
        if images.count > GalleryMosaic.maxImages {
          // Filled by hand: over a photo, a bordered button that loses its
          // fill in an inactive Mac window can't be read.
          Button {
            showsViewer = true
          } label: {
            Text("Show All")
              .font(.footnote.weight(.medium))
              .foregroundStyle(theme.onAccent)
              .padding(.horizontal, 10)
              .padding(.vertical, 5)
              .background(theme.accent, in: RoundedRectangle(cornerRadius: theme.smallCornerRadius))
          }
          .buttonStyle(.plain)
          .padding(5)
        }
      }
      .sheet(isPresented: $showsViewer) {
        GalleryViewer(images: images, selected: $selected)
          .environment(\.openUITheme, theme)
      }
    }
  }
}

private func galleryImageLabel(_ image: OpenUIValue, _ index: Int) -> String {
  let alt = displayText(image["alt"])
  return alt.isEmpty ? "Gallery image \(index + 1)" : alt
}

/// A mosaic image that zooms in a little under the pointer, as react-ui's do.
private struct GalleryTile: View {
  let src: String?
  @State private var hovering = false

  var body: some View {
    RemoteImage(src: src, alt: "", rounded: false)
      .scaleEffect(hovering ? 1.05 : 1)
      .clipped()
      .contentShape(Rectangle())
      .onHover { hovering in
        withOpenUIAnimation(.easeOut(duration: 0.3)) { self.hovering = hovering }
      }
  }
}

/// Lays out up to five gallery images like react-ui's grid templates: one or
/// two side by side, otherwise the first image large and the rest in two rows
/// beside it (or, when narrow, in rows under it).
struct GalleryMosaic: Layout {
  static let maxImages = 5
  /// react-ui caps the grid at 376px.
  static let maxHeight: CGFloat = 376
  /// react-ui's `space-s`.
  static let gap: CGFloat = 8
  /// react-ui switches to its narrow templates under a 768px viewport. A chat
  /// column is much narrower than the window it is in, so this goes by the
  /// gallery's own width.
  static let narrowWidth: CGFloat = 520

  /// A CSS grid template: column weights (`fr`), a row count, and each image's
  /// column, row and spans.
  struct Template: Equatable {
    var columns: [CGFloat]
    var rows: Int
    var cells: [Cell]

    struct Cell: Equatable {
      var column: Int
      var row: Int
      var columnSpan = 1
      var rowSpan = 1
    }
  }

  static func template(count: Int, narrow: Bool) -> Template {
    typealias Cell = Template.Cell
    switch min(count, maxImages) {
    case 0: return Template(columns: [1], rows: 1, cells: [])
    case 1: return Template(columns: [1], rows: 1, cells: [Cell(column: 0, row: 0)])
    case 2:
      return Template(
        columns: [1, 1], rows: 1, cells: [Cell(column: 0, row: 0), Cell(column: 1, row: 0)])
    case 3 where narrow:
      return Template(
        columns: [1, 1], rows: 2,
        cells: [
          Cell(column: 0, row: 0, columnSpan: 2), Cell(column: 0, row: 1), Cell(column: 1, row: 1),
        ])
    case 3:
      return Template(
        columns: [1, 1], rows: 2,
        cells: [
          Cell(column: 0, row: 0, rowSpan: 2), Cell(column: 1, row: 0), Cell(column: 1, row: 1),
        ])
    case 4:
      return Template(
        columns: [1, 1, 1, 1], rows: 2,
        cells: [
          Cell(column: 0, row: 0, columnSpan: 2, rowSpan: 2),
          Cell(column: 2, row: 0, columnSpan: 2),
          Cell(column: 2, row: 1), Cell(column: 3, row: 1),
        ])
    case _ where narrow:
      return Template(
        columns: Array(repeating: 1, count: 6), rows: 2,
        cells: [
          Cell(column: 0, row: 0, columnSpan: 3), Cell(column: 3, row: 0, columnSpan: 3),
          Cell(column: 0, row: 1, columnSpan: 2), Cell(column: 2, row: 1, columnSpan: 2),
          Cell(column: 4, row: 1, columnSpan: 2),
        ])
    default:
      return Template(
        columns: [2, 1, 1], rows: 2,
        cells: [
          Cell(column: 0, row: 0, rowSpan: 2), Cell(column: 1, row: 0), Cell(column: 2, row: 0),
          Cell(column: 1, row: 1), Cell(column: 2, row: 1),
        ])
    }
  }

  /// react-ui's grid takes its height from the images, up to 376px. That
  /// isn't known until they load, so this uses a fixed shape instead: no jump
  /// when they arrive.
  static func height(width: CGFloat, count: Int) -> CGFloat {
    let ratio: CGFloat =
      switch count {
      case 1: 0.6
      case 2: 0.45
      default: width < narrowWidth ? 0.8 : 0.55
      }
    return min(maxHeight, (width * ratio).rounded())
  }

  /// Each image's frame, in order.
  static func frames(count: Int, in bounds: CGRect) -> [CGRect] {
    let template = template(count: count, narrow: bounds.width < narrowWidth)
    let unit =
      (bounds.width - gap * CGFloat(template.columns.count - 1)) / template.columns.reduce(0, +)
    let rowHeight = (bounds.height - gap * CGFloat(template.rows - 1)) / CGFloat(template.rows)
    func x(_ column: Int) -> CGFloat {
      bounds.minX + template.columns.prefix(column).reduce(0, +) * unit + gap * CGFloat(column)
    }
    return template.cells.map { cell in
      let columns = template.columns[cell.column..<cell.column + cell.columnSpan]
      return CGRect(
        x: x(cell.column),
        y: bounds.minY + (rowHeight + gap) * CGFloat(cell.row),
        width: columns.reduce(0, +) * unit + gap * CGFloat(cell.columnSpan - 1),
        height: rowHeight * CGFloat(cell.rowSpan) + gap * CGFloat(cell.rowSpan - 1))
    }
  }

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    // Without a usable width (an unbounded stack), fall back to a phone's.
    let width = proposal.width.flatMap { $0.isFinite ? $0 : nil } ?? 360
    return CGSize(width: width, height: Self.height(width: width, count: subviews.count))
  }

  func placeSubviews(
    in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()
  ) {
    for (subview, frame) in zip(subviews, Self.frames(count: subviews.count, in: bounds)) {
      subview.place(at: frame.origin, proposal: ProposedViewSize(frame.size))
    }
  }
}

/// react-ui's gallery modal: every image, one at a time, over a strip of
/// thumbnails. Swipe or use the arrow keys to move between them.
struct GalleryViewer: View {
  let images: [OpenUIValue]
  @Binding var selected: Int
  @State private var page: Int?
  @FocusState private var focused: Bool
  @Environment(\.dismiss) private var dismiss
  @Environment(\.openUITheme) private var theme

  init(images: [OpenUIValue], selected: Binding<Int>) {
    self.images = images
    _selected = selected
    _page = State(initialValue: selected.wrappedValue)
  }

  var body: some View {
    VStack(spacing: 24) {
      HStack {
        Text("All Photos").font(.headline)
        Spacer()
        Button {
          dismiss()
        } label: {
          Image(systemName: "xmark")
            .font(.footnote.weight(.semibold))
            .frame(width: 28, height: 28)
            .background(
              theme.sunkSurface, in: RoundedRectangle(cornerRadius: theme.smallCornerRadius))
        }
        .buttonStyle(.plain)
        .keyboardShortcut(.cancelAction)
        .accessibilityLabel("Close gallery")
      }
      .padding(.horizontal, 24)
      pages
      thumbnails
    }
    .padding(.vertical, 24)
    #if os(macOS)
      .frame(minWidth: 560, idealWidth: 720, minHeight: 520, idealHeight: 640)
    #endif
    .focusable()
    .focusEffectDisabled()
    .focused($focused)
    .onAppear { focused = true }
    .onKeyPress(.leftArrow) { show(selected - 1) }
    .onKeyPress(.rightArrow) { show(selected + 1) }
    .onChange(of: page) { _, page in
      if let page { selected = page }
    }
  }

  /// The images full size, one page each. Pages have a fixed size, so the
  /// lazy stack never has to re-measure anything while it scrolls.
  private var pages: some View {
    ScrollView(.horizontal) {
      LazyHStack(spacing: 0) {
        ForEach(images.indices, id: \.self) { index in
          let details = displayText(images[index]["details"])
          VStack(spacing: 8) {
            RemoteImage(
              src: images[index]["src"].stringValue, alt: galleryImageLabel(images[index], index),
              fit: true
            )
            .frame(maxHeight: .infinity)
            if !details.isEmpty {
              Text(details).font(.footnote).foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            }
          }
          .padding(.horizontal, 24)
          .containerRelativeFrame([.horizontal, .vertical])
          .id(index)
        }
      }
      .scrollTargetLayout()
    }
    .scrollTargetBehavior(.paging)
    .scrollPosition(id: $page)
    .scrollIndicators(.never)
  }

  private var thumbnails: some View {
    ScrollViewReader { proxy in
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: GalleryMosaic.gap) {
          ForEach(images.indices, id: \.self) { index in
            let isSelected = index == selected
            Button {
              page = index
            } label: {
              RemoteImage(src: images[index]["src"].stringValue, alt: "")
                .frame(height: 116)
                .containerRelativeFrame(.horizontal) { width, _ in
                  // Thumbnails share the row, but are at least 174 wide.
                  let count = CGFloat(images.count)
                  return max(174, (width - 48 - GalleryMosaic.gap * (count - 1)) / count)
                }
                .opacity(isSelected ? 1 : 0.6)
                .overlay(
                  RoundedRectangle(cornerRadius: theme.smallCornerRadius)
                    .strokeBorder(isSelected ? theme.accent : .clear))
            }
            .buttonStyle(.plain)
            .accessibilityLabel(galleryImageLabel(images[index], index))
            .accessibilityAddTraits(isSelected ? .isSelected : [])
            .id(index)
          }
        }
        .padding(.horizontal, 24)
      }
      .onAppear { proxy.scrollTo(selected, anchor: .center) }
      .onChange(of: selected) { _, selected in
        withOpenUIAnimation(Motion.reveal) { proxy.scrollTo(selected, anchor: .center) }
      }
    }
  }

  private func show(_ index: Int) -> KeyPress.Result {
    guard images.indices.contains(index) else { return .ignored }
    page = index
    return .handled
  }
}

/// An image loaded from a URL, with the alt text as its accessibility label
/// and a placeholder while loading (or when the URL is missing).
///
/// `fit` keeps the image's aspect ratio at the available width (content
/// images). Otherwise the image fills whatever frame the caller gives it and
/// never affects layout, so a large photo can't widen a card or grid column.
struct RemoteImage: View {
  let src: String?
  let alt: String
  var fit = false
  /// Off for images inside something that clips them, like the gallery mosaic.
  var rounded = true
  @Environment(\.openUITheme) private var theme

  var body: some View {
    Group {
      if fit {
        AsyncImage(url: url, transaction: Self.fadeIn) { phase in
          if let image = phase.image {
            image.resizable().scaledToFit().transition(.opacity)
          } else {
            placeholder(phase).frame(height: 160)
          }
        }
        .frame(maxWidth: .infinity)
      } else {
        Color.clear
          .overlay {
            AsyncImage(url: url, transaction: Self.fadeIn) { phase in
              if let image = phase.image {
                image.resizable().scaledToFill().transition(.opacity)
              } else {
                placeholder(phase)
              }
            }
          }
          .clipped()
      }
    }
    .clipShape(RoundedRectangle(cornerRadius: rounded ? theme.smallCornerRadius : 0))
    .accessibilityLabel(alt)
  }

  private var url: URL? { src.flatMap(URL.init(string:)) }

  /// The photo fades in over its loading placeholder.
  private static let fadeIn = Transaction(animation: .easeOut(duration: 0.25))

  @ViewBuilder
  private func placeholder(_ phase: AsyncImagePhase) -> some View {
    if phase.error == nil, url != nil {
      // Still loading: pulse like react-ui's skeletons.
      GeometryReader { size in SkeletonBlock(height: size.size.height, cornerRadius: 0) }
    } else {
      ZStack {
        theme.sunkSurface
        Image(systemName: "photo.badge.exclamationmark").font(.title2).foregroundStyle(.secondary)
      }
    }
  }
}

// MARK: - Separator, tags and key/value rows

struct SeparatorView: View {
  let props: ComponentProps

  var body: some View {
    if props.string("orientation") == "vertical" {
      Divider().frame(maxHeight: 24)
    } else {
      Divider()
    }
  }
}

struct TagBlockView: View {
  let props: ComponentProps
  @Environment(\.openUITheme) private var theme

  var body: some View {
    FlowLayout(spacing: theme.compactSpacing) {
      ForEach(Array(props.array("tags").enumerated()), id: \.offset) { _, tag in
        let size = props.string("size")
        // Tags, like react-ui's: one line, cut short when wider than the block.
        Text(displayText(tag))
          .lineLimit(1)
          .font(font)
          .padding(tagPadding(size))
          .background(theme.sunkSurface, in: RoundedRectangle(cornerRadius: tagRadius(size)))
      }
    }
  }

  private var font: Font {
    switch props.string("size") {
    case "sm": return .caption2
    case "lg": return .callout
    default: return .caption
    }
  }
}

struct EntityListView: View {
  let props: ComponentProps
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let small = props.string("size") == "small"
    VStack(spacing: 0) {
      if !small, let header = props["header"].objectValue {
        row(.object(header), emphasis: true)
        Divider()
      }
      ForEach(Array(props.array("rows").enumerated()), id: \.offset) { index, item in
        if index > 0 { Divider().opacity(0.5) }
        row(item, emphasis: false)
      }
      if !small, let footer = props["footer"].objectValue {
        Divider()
        row(.object(footer), emphasis: true)
      }
    }
    .font(small ? .footnote : .callout)
  }

  private func row(_ item: OpenUIValue, emphasis: Bool) -> some View {
    HStack {
      Text(displayText(item["left"])).foregroundStyle(emphasis ? .primary : .secondary)
      Spacer(minLength: theme.spacing)
      Text(displayText(item["right"]))
        .monospacedDigit()
        .multilineTextAlignment(.trailing)
    }
    .fontWeight(emphasis ? .semibold : .regular)
    .padding(.vertical, 6)
  }
}
