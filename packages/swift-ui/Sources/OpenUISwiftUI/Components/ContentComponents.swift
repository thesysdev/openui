import OpenUILang
import SwiftUI

/// Native presentation for the pinned standard catalog, without extra DSL names.
enum OpenUIContentComponents {
  static var components: [OpenUIComponent] {
    [
      OpenUIReference.component("CardHeader") { NativeHeading(context: $0, compact: false) },
      OpenUIReference.component("InlineHeader") { NativeHeading(context: $0, compact: true) },
      OpenUIReference.component("MarkDownRenderer") { NativeMarkdown(context: $0) },
      OpenUIReference.component("Callout") { NativeCallout(context: $0, reactive: true) },
      OpenUIReference.component("TextCallout") { NativeCallout(context: $0, reactive: false) },
      OpenUIReference.component("ImageBlock") { NativeImageBlock(context: $0) },
      OpenUIReference.component("ImageGallery") { NativeImageGallery(context: $0) },
      OpenUIReference.component("Text") { NativeInlineText(context: $0, bold: false) },
      OpenUIReference.component("BoldText") { NativeInlineText(context: $0, bold: true) },
      OpenUIReference.component("IconText") {
        NativeMediaText(context: $0, media: .icon)
      },
      OpenUIReference.component("ImageText") {
        NativeMediaText(context: $0, media: .thumbnail)
      },
      OpenUIReference.component("ImageTextLarge") {
        NativeMediaText(context: $0, media: .banner)
      },
      OpenUIReference.component("Icon") { NativeIcon(context: $0) },
      OpenUIReference.component("IconButton") { NativeIconButton(context: $0) },
      OpenUIReference.component("Tag") { NativeTag(context: $0) },
      OpenUIReference.component("TagBlock") { NativeTagBlock(context: $0) },
      OpenUIReference.component("EntityList") { NativeEntityList(context: $0) },
      OpenUIReference.component("ListBlock") { NativeListBlock(context: $0) },
      OpenUIReference.component("ListItem") { NativeListItem(context: $0) },
      OpenUIReference.component("Steps") { NativeSteps(context: $0) },
      OpenUIReference.component("StepsItem") { _ in EmptyView() },
      OpenUIReference.component("Carousel") { NativeCarousel(context: $0) },
      OpenUIReference.component("Modal") { NativeModal(context: $0) },
    ]
      + ["Snippet", "Overview", "Context", "Composite", "Visual"].flatMap { kind in
        [
          OpenUIReference.component(kind + "CardItem") { NativeCardItem(context: $0, kind: kind) },
          OpenUIReference.component(kind + "CardBlock") {
            NativeCardBlock(context: $0, kind: kind)
          },
        ]
      }
  }
}

struct NativeHeading: View {
  let context: OpenUIComponentContext
  let compact: Bool
  var body: some View {
    VStack(alignment: .leading, spacing: context.theme.spacing(compact ? "3xs" : "xs")) {
      if let title = context.string(compact ? "heading" : "title") {
        Text(title).openUIFont(compact ? context.theme.typography.heading : context.theme.typography.title).accessibilityAddTraits(
          .isHeader)
      }
      if let detail = context.string(compact ? "description" : "subtitle") {
        Text(detail).openUIFont(context.theme.typography.body).foregroundStyle(context.theme.secondary)
      }
    }.fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
  }
}

struct NativeMarkdown: View {
  let context: OpenUIComponentContext
  var body: some View {
    NativeMarkdownText(text: context.string("textMarkdown") ?? "")
      .padding(
        context.string("variant") == "clear" || context.string("variant") == nil
          ? 0 : context.theme.cardPadding
      )
      .background(
        context.string("variant") == "card"
          ? context.theme.controlSurface
          : context.string("variant") == "sunk" ? context.theme.surface : .clear,
        in: RoundedRectangle(cornerRadius: max(0, context.theme.controlCornerRadius - 2)))
      .overlay {
        RoundedRectangle(cornerRadius: max(0, context.theme.controlCornerRadius - 2))
          .strokeBorder(context.string("variant") == "card" || context.string("variant") == "sunk"
            ? context.theme.border : .clear, lineWidth: context.theme.cardBorderWidth)
          .allowsHitTesting(false)
      }
  }
}

private func semanticColor(_ variant: String?, theme: OpenUITheme) -> Color {
  switch variant {
  case "danger", "error": return theme.error
  case "success": return theme.success
  case "warning": return theme.warning
  case "info": return theme.info
  default: return theme.secondary
  }
}

struct NativeCallout: View {
  let context: OpenUIComponentContext
  let reactive: Bool
  @EnvironmentObject private var state: OpenUIState
  private var binding: Binding<Value>? { reactive ? context.binding("visible") : nil }
  private var visible: Bool {
    binding.map { $0.wrappedValue == .boolean(true) || $0.wrappedValue == .string("true") } ?? true
  }
  var body: some View {
    Group {
      if visible {
        HStack(alignment: .top, spacing: context.theme.spacing("sm")) {
          Image(
            systemName: context.string("variant") == "success" ? "checkmark.circle" : "info.circle"
          )
          .foregroundStyle(semanticColor(context.string("variant"), theme: context.theme))
          VStack(alignment: .leading, spacing: context.theme.spacing("2xs")) {
            if let title = context.string("title") { Text(title).openUIFont(context.theme.typography.heading) }
            if let detail = context.string("description") {
              NativeMarkdownText(text: detail, style: .init(font: context.theme.typography.detail, color: context.theme.secondary))
            }
          }
          Spacer(minLength: 0)
        }.padding(context.theme.cardPadding)
          .background(
            semanticColor(context.string("variant"), theme: context.theme).opacity(0.08),
            in: RoundedRectangle(cornerRadius: context.theme.cornerRadius))
      }
    }.task(id: "\(state.sourceRevision):\(visible):\(context.canInteract)") {
      guard visible, context.canInteract, binding != nil else { return }
      do { try await Task.sleep(nanoseconds: 3_000_000_000) } catch { return }
      guard !Task.isCancelled else { return }
      binding?.wrappedValue = .boolean(false)
    }
  }
}

struct NativeImageBlock: View {
  let context: OpenUIComponentContext
  var body: some View {
    NativeRemoteImage(src: context.string("src"), alt: context.string("alt") ?? "",
      layout: .aspect(context.theme.coverAspectRatio))
      .clipShape(RoundedRectangle(cornerRadius: context.theme.mediaCornerRadius, style: .continuous))
  }
}

enum NativeValue {
  static func string(_ value: Value?) -> String {
    if case .string(let text) = value { return text.displayString }
    return ""
  }
  static func prop(_ value: Value?, _ key: String) -> Value? {
    switch value {
    case .element(let e): return PropValue.value(e, key)
    case .object(let o): return o[OpenUIString(key)]
    default: return nil
    }
  }
  static func string(_ value: Value?, _ key: String) -> String? {
    guard case .string(let text) = prop(value, key) else { return nil }
    return text.displayString
  }
  static func number(_ value: Value?, _ key: String) -> Double? {
    guard case .number(let n) = prop(value, key), n.isFinite else { return nil }
    return n
  }
  static func array(_ value: Value?) -> [Value] {
    if case .array(let list) = value { return list.values }
    return []
  }
}

/// The upstream TextBlock family renders inline Markdown. Keep this native
/// presentation adapter shared; it does not interpret or rewrite OpenUI Lang.
enum NativeInlineMarkdown {
  static func attributed(_ value: String) -> AttributedString {
    (try? AttributedString(
      markdown: value, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)))
      ?? AttributedString(value)
  }
  static func text(_ value: String) -> Text { Text(attributed(value)) }
}

struct NativeInlineText: View {
  let context: OpenUIComponentContext
  let bold: Bool
  private var style: NativeRichTextStyle {
    let size = context.string("size") ?? "sm"
    let font = context.theme.typography.inline(size)
    return .init(font: bold ? font.weight(context.theme.typography.heading.weight) : font,
      numeric: context.string("variant") == "number")
  }
  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      NativeMarkdownText(text: context.string("value") ?? "", mode: .inline, style: style)
      if let sub = context.string("subtext") {
        NativeMarkdownText(text: sub, mode: .inline, style: .init(
          font: ["md", "lg"].contains(context.string("size") ?? "sm") ? context.theme.typography.body : context.theme.typography.detail,
          numeric: context.string("subtextVariant") == "number", color: subtextColor(sub)))
      }
    }.fixedSize(horizontal: false, vertical: true)
  }
  private func subtextColor(_ value: String) -> Color {
    guard context.string("subtextVariant") == "metric" else { return context.theme.secondary }
    if value.hasPrefix("+") { return semanticColor("success", theme: context.theme) }
    if value.hasPrefix("-") { return semanticColor("danger", theme: context.theme) }
    return context.theme.secondary
  }
}
private struct NativeCardHeaderInsetKey: EnvironmentKey { static let defaultValue: CGFloat = 0 }
extension EnvironmentValues {
  fileprivate var openUICardHeaderInset: CGFloat {
    get { self[NativeCardHeaderInsetKey.self] }
    set { self[NativeCardHeaderInsetKey.self] = newValue }
  }
}

struct NativeMediaText: View {
  @Environment(\.openUICardHeaderInset) private var cardHeaderInset
  @ScaledMetric(relativeTo: .body) private var iconScale: CGFloat = 1
  enum Media { case icon, thumbnail, banner }
  let context: OpenUIComponentContext
  let media: Media
  var body: some View {
    Group {
      if media == .banner {
        VStack(alignment: .leading, spacing: context.theme.contentSpacing) {
          NativeRemoteImage(
            src: context.string("src"), alt: context.string("alt") ?? context.string("title") ?? "",
            layout: .aspect(context.theme.coverAspectRatio))
            .clipShape(RoundedRectangle(cornerRadius: cardHeaderInset > 0 ? 0 : context.theme.mediaCornerRadius, style: .continuous))
            .padding(.horizontal, -cardHeaderInset)
            .padding(.top, -cardHeaderInset)
          words
        }.frame(maxWidth: .infinity, alignment: .leading)
      } else {
        NativeMediaRow(axis: context.string("layout") == "vertical" ? .vertical : .horizontal,
          gap: media == .icon ? context.theme.contentSpacing * iconScale : context.theme.contentSpacing,
          centered: true,
          media: { leadingMedia }, copy: {
            words.frame(maxWidth: .infinity, alignment: context.string("layout") == "vertical" ? .center : .leading)
              .multilineTextAlignment(context.string("layout") == "vertical" ? .center : .leading)
          })
      }
    }
  }
  @ViewBuilder private var leadingMedia: some View {
    if media == .icon {
      let colors = NativeBadgeColors(variant: context.string("iconVariant"), theme: context.theme)
      // Neutral/filled/soft variants share the same badge geometry.
      context.slot("icon").environment(\.openUIIconSize, glyphSize)
        .foregroundStyle(colors.foreground)
        .frame(width: (glyphSize + 20) * iconScale, height: (glyphSize + 20) * iconScale)
        .background(colors.background, in: RoundedRectangle(cornerRadius: context.theme.mediaCornerRadius))
        .accessibilityIdentifier("openui.icon-text.badge")
    } else {
      NativeRemoteImage(
        src: context.string("src"), alt: context.string("alt") ?? context.string("title") ?? "",
        layout: .thumbnail(CGSize(width: imageSize, height: imageSize)))
        .clipShape(RoundedRectangle(cornerRadius: context.theme.mediaCornerRadius, style: .continuous))
    }
  }
  private var glyphSize: CGFloat { NativeIconTextMetrics.glyph(context.string("iconSize")) }
  private var imageSize: CGFloat {
    // The reference CSS has a default thumbnail in either orientation;
    // an explicit imageSize overrides it without native-only bounds.
    if let size = context.number("imageSize"), size.isFinite, size > 0 { return CGFloat(size) }
    return context.theme.inlineThumbnailSize
  }
  private var words: some View {
    VStack(alignment: .leading, spacing: 0) {
      NativeMarkdownText(text: context.string("title") ?? "", mode: .inline,
        style: .init(font: media == .banner ? context.theme.typography.bodyHeavy
          : (context.string("layout") != "vertical" ? context.theme.typography.detail : context.theme.typography.body)
            .weight(context.flag("bold") == true ? .medium : .regular)))

      if let sub = context.string("subtitle") {
        NativeMarkdownText(text: sub, mode: .inline, style: .init(font: context.theme.typography.detail, color: context.theme.secondary))
      }
    }.fixedSize(horizontal: false, vertical: true)
  }
}

struct NativeIconButton: View {
  let context: OpenUIComponentContext
  var body: some View {
    OpenUIActionSurface(
      context: context, message: context.string("name") ?? "", action: context.value("action"),
      useNativeStyle: true, validateForm: context.string("variant") == "primary",
      showsProgress: true
    ) {
      context.slot("icon").frame(minWidth: 20, minHeight: 20)
    }.buttonStyle(
      NativeActionButtonStyle(
        theme: context.theme, variant: context.string("variant") ?? "secondary",
        size: context.string("size"), destructive: false,
        iconOnly: true, circular: context.string("shape") == "circle")
    )
    .clipShape(
      RoundedRectangle(
        cornerRadius: context.string("shape") == "circle" ? 100 : context.theme.controlCornerRadius)
    )
    .accessibilityLabel(context.string("name") ?? "")
  }
}
struct NativeTag: View {
  let context: OpenUIComponentContext
  var body: some View {
    NativeTagPill(text: context.string("text") ?? "", size: context.string("size"),
      variant: context.string("variant"), theme: context.theme) { context.slot("icon") }
  }
}
struct NativeTagBlock: View {
  let context: OpenUIComponentContext
  var body: some View {
    NativeWrappingRow(gap: context.theme.spacing("s")) {
      ForEach(context.children("tags")) { tag in
        NativeTagPill(text: NativeValue.string(tag.value), size: context.string("size"),
          variant: nil, theme: context.theme) { EmptyView() }
      }
    }
  }
}
struct NativeWrappingRow<Content: View>: View {
  var gap: CGFloat = 12
  var rowGap: CGFloat? = nil
  @ViewBuilder let content: Content
  var body: some View {
    OpenUIFlexLayout(direction: "row", gap: gap, align: "start", justify: "start", wrap: true, rowGap: rowGap) { content }
  }
}

struct NativeEntityList: View {
  let context: OpenUIComponentContext
  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      if context.string("size") != "small", let header = context.value("header"), header != .null {
        row(header, kind: .header)
        Divider()
      }
      let rows = context.children("rows")
      ForEach(rows) { item in
        row(item.value, kind: .body)
      }
      if context.string("size") != "small", let footer = context.value("footer"), footer != .null {
        Divider()
        row(footer, kind: .footer)
      }
    }
  }
  private enum RowKind { case header, body, footer }
  private func row(_ value: Value, kind: RowKind) -> some View {
    let small = context.string("size") == "small"
    let numeric = NativeValue.string(value, "rightVariant") == "number"
    let font = small ? context.theme.typography.detail : context.theme.typography.body
    let color = kind == .header ? context.theme.secondary : context.theme.foreground
    return NativeLabelValueLayout(
      gap: context.theme.spacing("m"), minimumLabelWidth: context.theme.minimumTextColumnWidth
    ) {
      NativeMarkdownText(text: NativeValue.string(value, "left") ?? "", mode: .inline,
        style: .init(font: font, color: color))
      NativeMarkdownText(text: NativeValue.string(value, "right") ?? "", mode: .inline,
        style: .init(font: (kind == .footer ? context.theme.typography.title : font).weight(.semibold), numeric: numeric, color: color))
      .multilineTextAlignment(.trailing)
    }
    .padding(.vertical, context.theme.spacing("m")).textSelection(.enabled)
    .accessibilityIdentifier("openui.entity-list.row")
  }
}
private struct NativeListPresentation {
  var imageWidth: CGFloat?
  var compact = false
  var axis = NativeMediaRowAxis.horizontal
}
private struct NativeListPresentationKey: EnvironmentKey {
  static let defaultValue = NativeListPresentation()
}
extension EnvironmentValues {
  fileprivate var openUIListPresentation: NativeListPresentation {
    get { self[NativeListPresentationKey.self] }
    set { self[NativeListPresentationKey.self] = newValue }
  }
}

struct NativeListBlock: View {
  let context: OpenUIComponentContext
  @Environment(\.displayScale) private var displayScale
  @ScaledMetric(relativeTo: .body) private var textScale: CGFloat = 1
  @Namespace private var scope
  @State private var containerWidth: CGFloat?
  private var imageList: Bool { context.string("variant") == "image" }
  private var compact: Bool { context.string("size") == "small" }
  private var mediaLayout: NativeListMediaLayout {
    NativeListMediaLayout(width: containerWidth,
      preferredImageWidth: compact ? context.theme.compactThumbnailSize : context.theme.thumbnailSize,
      minimumImageWidth: context.theme.inlineThumbnailSize,
      textWidth: context.theme.minimumTextColumnWidth * textScale,
      gap: context.theme.contentSpacing)
  }
  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      ForEach(Array(context.children("items").enumerated()), id: \.element.id) { index, item in
        if index > 0 {
          Rectangle().fill(context.theme.border).frame(height: 1 / displayScale)
            .padding(.vertical, context.theme.spacing(compact ? "s" : "m"))
        }
        HStack(alignment: .top, spacing: context.theme.contentSpacing) {
          if !imageList {
            Text("\(index + 1)").openUIFont(context.theme.typography.detail.monospacedDigit()).foregroundStyle(
              context.theme.secondary
            ).frame(minWidth: 22)
          }
          context.render(item.value)
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(GeometryReader { geometry in
      Color.clear.preference(key: NativeListContainerWidths.self, value: [scope: geometry.size.width])
    })
    .onPreferenceChange(NativeListContainerWidths.self) { values in
      guard let width = values[scope], width.isFinite, width > 0 else { return }
      if containerWidth.map({ abs($0 - width) > 0.5 }) ?? true { containerWidth = width }
    }
    .environment(\.openUIListPresentation, NativeListPresentation(
      imageWidth: imageList ? mediaLayout.imageWidth : 0,
      compact: compact, axis: mediaLayout.axis))
  }
}
private struct NativeListContainerWidths: PreferenceKey {
  static let defaultValue: [Namespace.ID: CGFloat] = [:]
  static func reduce(value: inout [Namespace.ID: CGFloat], nextValue: () -> [Namespace.ID: CGFloat]) {
    value.merge(nextValue(), uniquingKeysWith: { _, next in next })
  }
}
struct NativeListItem: View {
  let context: OpenUIComponentContext
  @Environment(\.openUIListPresentation) private var presentation
  private var imageWidth: CGFloat { presentation.imageWidth ?? context.theme.inlineThumbnailSize }
  private var hasImage: Bool {
    imageWidth > 0 && context.value("image") != nil && context.value("image") != .null
  }
  private var hasAction: Bool {
    context.value("action") != nil && context.value("action") != .null
  }
  var body: some View {
    Group {
      if hasAction {
        OpenUIActionSurface(
          context: context, message: context.string("title") ?? "", action: context.value("action")
        ) { content }
      } else {
        content
      }
    }
  }
  @ViewBuilder private var content: some View {
    Group {
      if hasImage {
        NativeMediaRow(axis: presentation.axis, gap: context.theme.contentSpacing,
          media: { photo }, copy: { words })
      } else { words }
    }.fixedSize(horizontal: false, vertical: true).contentShape(Rectangle())
  }
  @ViewBuilder private var photo: some View {
    if let image = context.value("image"), image != .null {
      NativeRemoteImage(
        src: NativeValue.string(image, "src"), alt: NativeValue.string(image, "alt") ?? "",
        layout: .thumbnail(CGSize(width: imageWidth, height: imageWidth))
      )
      .frame(width: imageWidth, height: imageWidth)
      .clipShape(RoundedRectangle(cornerRadius: context.theme.mediaCornerRadius, style: .continuous))
    }
  }
  private var words: some View {
    HStack(alignment: .center, spacing: context.theme.contentSpacing) {
      VStack(alignment: .leading, spacing: context.theme.spacing("xs")) {
        Text(context.string("title") ?? "").openUIFont(presentation.compact
          ? context.theme.typography.detail : context.theme.typography.body)
        if let detail = context.string("subtitle") {
          Text(detail).openUIFont(presentation.compact ? context.theme.typography.detail : context.theme.typography.body).foregroundStyle(context.theme.secondary)
        }
        if hasAction, let label = context.string("actionLabel"), !label.isEmpty {
          Text(label).openUIFont(context.theme.typography.actionCompact)
            .foregroundStyle(context.theme.secondary).padding(.top, 2).accessibilityHidden(true)
        }
      }.frame(maxWidth: .infinity, alignment: .leading)
      if hasAction {
        Image(systemName: "chevron.right").openUIFont(context.theme.typography.caption.weight(.semibold))
          .foregroundStyle(context.theme.secondary).accessibilityHidden(true)
      }
    }.fixedSize(horizontal: false, vertical: true)
  }
}
struct NativeSteps: View {
  let context: OpenUIComponentContext
  @Environment(\.displayScale) private var displayScale
  @ScaledMetric(relativeTo: .body) private var markerDiameter: CGFloat = 28
  var body: some View {
    let items = context.children("items")
    VStack(alignment: .leading, spacing: 0) {
      ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
        HStack(alignment: .top, spacing: context.theme.spacing("m")) {
          NativeStepMarker(number: index + 1, theme: context.theme, diameter: markerDiameter)
          VStack(alignment: .leading, spacing: context.theme.spacing("xs")) {
            Text(NativeValue.string(item.value, "title") ?? "").openUIFont(context.theme.typography.heading)
            NativeMarkdownText(text: NativeValue.string(item.value, "details") ?? "",
              style: .init(font: context.theme.typography.detail, color: context.theme.secondary))
          }
        }
        .padding(.bottom, index < items.count - 1 ? context.theme.spacing("m") : 0)
        .background(alignment: .topLeading) {
          if index < items.count - 1 {
            Rectangle().fill(context.theme.border)
              .frame(width: 1 / displayScale)
              .padding(.top, markerDiameter + context.theme.spacing("xs")).offset(x: markerDiameter / 2)
              .accessibilityHidden(true)
          }
        }
      }
    }
  }
}
/// The badge follows its text's measured size, including custom fonts and Dynamic Type.
struct NativeStepMarker: View {
  let number: Int
  let theme: OpenUITheme
  let diameter: CGFloat
  var body: some View {
    Text("\(number)").openUIFont(theme.typography.detail.weight(.semibold))
      .fixedSize().frame(minWidth: diameter, minHeight: diameter)
      .background(theme.surface, in: Circle())
      .accessibilityIdentifier("openui.steps.marker")
  }
}

struct NativeCarousel: View {
  let context: OpenUIComponentContext
  @State private var page = 0
  // Carousel's outer array contains pages; each inner array is one page.
  // Rendering-child flattening is appropriate inside a page, never between pages.
  private var pages: [Value] { NativeValue.array(context.value("children")) }
  var body: some View {
    NativePager(ids: Array(pages.indices), selection: $page, enabled: true, identifier: "openui.carousel") { index in
      VStack(alignment: .leading, spacing: context.theme.spacing("s")) { context.render(pages[index]) }
        .modifier(OpenUICardSurface(theme: context.theme, variant: context.string("variant")))
    }
  }
}
struct NativeModal: View {
  let context: OpenUIComponentContext
  @EnvironmentObject private var state: OpenUIState
  private var presented: Binding<Bool> {
    Binding(
      get: {
        if let binding = context.presentationBinding("open") {
          return binding.wrappedValue == .boolean(true) || binding.wrappedValue == .string("true")
        }
        let value = context.presentationFieldValue("open", fallback: context.value("open") ?? .undefined)
        return value == .boolean(true) || value == .string("true")
      },
      set: { open in
        guard context.isCurrentPresentation else { return }
        if let binding = context.presentationBinding("open") {
          binding.wrappedValue = .boolean(open)
        } else {
          context.setPresentationFieldValue("open", value: .boolean(open))
        }
      })
  }
  var body: some View {
    Color.clear.frame(width: 0, height: 0)
      .sheet(isPresented: presented) {
        VStack(alignment: .leading, spacing: context.theme.spacing("ml")) {
          HStack {
            Text(context.string("title") ?? "").openUIFont(context.theme.typography.heading).accessibilityAddTraits(.isHeader)
            Spacer()
            Button {
              presented.wrappedValue = false
            } label: {
              Image(systemName: "xmark").openUIFont(context.theme.typography.actionRegular).openUIControlTarget()
            }
            .buttonStyle(.plain).keyboardShortcut(.cancelAction)
            .accessibilityLabel(Text("Close", bundle: NativeControlResources.bundle))
          }
          ScrollView { context.slot().frame(maxWidth: .infinity, alignment: .leading) }
        }.padding(context.theme.cardPadding).frame(
          idealWidth: context.string("size") == "lg"
            ? 720 : context.string("size") == "sm" ? 360 : 520, idealHeight: 420
        )
      }
  }
}

private struct NativeCardActionKey: EnvironmentKey {
  static let defaultValue = false
}
fileprivate struct NativeCardGroupAction {
  let message: String
  let action: Value
}
private struct NativeCardGroupActionKey: EnvironmentKey {
  static let defaultValue: NativeCardGroupAction? = nil
}
extension EnvironmentValues {
  fileprivate var openUICardGroupAction: NativeCardGroupAction? {
    get { self[NativeCardGroupActionKey.self] }
    set { self[NativeCardGroupActionKey.self] = newValue }
  }
  var openUICardIsAction: Bool {
    get { self[NativeCardActionKey.self] }
    set { self[NativeCardActionKey.self] = newValue }
  }
}

struct NativeCardItem: View {
  let context: OpenUIComponentContext
  let kind: String
  private var itemTheme: OpenUITheme {
    var theme = context.theme
    // The official families share tokens, not an identical outline: Context
    // uses radius-xl, compact fact cards radius-2xl, photo cards radius-3xl.
    theme.cornerRadius = context.theme.cardRadius(for: kind)
    if ["Overview", "Snippet"].contains(kind) { theme.cardPadding = max(0, theme.cardPadding - 2) }
    return theme
  }
  @Environment(\.openUICardIsAction) private var isAction
  @Environment(\.openUICardGroupAction) private var pendingGroupAction
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.dynamicTypeSize) private var typeSize
  private var groupAction: NativeCardGroupAction? { pendingGroupAction }
  private var bannerHeaderInset: CGFloat {
    guard case .element(let header) = context.value("header"), header.typeName == "ImageTextLarge" else { return 0 }
    return context.theme.cardPadding
  }
  private var artworkSource: String? {
    guard ["Visual", "Context"].contains(kind), let source = context.string("bgImageSrc"),
      !source.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
    return source
  }
  private var contentTheme: OpenUITheme {
    var theme = context.theme
    if artworkSource != nil {
      theme.foreground = .white
      theme.secondary = .white.opacity(0.86)
      theme.surface = .black.opacity(0.55)
      theme.controlSurface = .black.opacity(0.75)
      theme.metricSurface = .black.opacity(0.55)
      theme.border = .white.opacity(0.2)
      theme.canvas = .black
    }
    return theme
  }
  @ViewBuilder private var actionIndicator: some View {
    if isAction {
      Image(systemName: "chevron.right").openUIFont(context.theme.typography.actionCompact)
        .foregroundStyle(contentTheme.secondary).accessibilityHidden(true)
    }
  }
  var body: some View {
    Group {
      if let source = artworkSource {
        NativeArtworkCardLayout(aspectRatio: context.theme.coverAspectRatio,
          fallbackWidth: context.theme.minimumCardWidth, accessibility: typeSize.isAccessibilitySize) {
          ZStack {
            Color.black
            NativeRemoteImage(src: source, alt: context.string("bgImageAlt") ?? "", layout: .cover,
              showsFailureSymbol: false)
          }.allowsHitTesting(false)
          copy.background(LinearGradient(colors: [.black.opacity(0.12), .black.opacity(0.62)],
            startPoint: .top, endPoint: .bottom).allowsHitTesting(false))
        }.background(Color.black)
      } else {
        copy
      }
    }
    .environment(\.openUITheme, contentTheme)
    .foregroundStyle(contentTheme.foreground)
    .clipShape(RoundedRectangle(cornerRadius: itemTheme.cornerRadius, style: .continuous))
    .modifier(NativeCardSurface(
      theme: itemTheme,
      fill: context.string("bgColor") == "gray" ? context.theme.surface
        : isAction ? context.theme.controlSurface : context.theme.subtleSurface,
      bordered: artworkSource == nil && kind != "Context"))
    .environment(\.openUIActionDensity, .compact)
    .environment(\.colorScheme, artworkSource == nil ? colorScheme : .dark)
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("openui.card-item." + kind.lowercased())
    .layoutValue(key: OpenUIFlexGrowKey.self, value: true)
  }
  private var copy: some View {
    VStack(alignment: .leading, spacing: context.theme.contentSpacing) {
      switch kind {
      case "Snippet":
        HStack(alignment: .center, spacing: context.theme.spacing("s")) {
          NativeLabelValueLayout(
            gap: context.theme.contentSpacing, minimumLabelWidth: context.theme.minimumCompactCardWidth,
            centerVertically: true
          ) {
            context.slot("lhs")
            context.slot("rhs")
          }
          actionIndicator
        }
      case "Overview":
        HStack(alignment: .top, spacing: context.theme.spacing("s")) {
          context.slot("top").multilineTextAlignment(.center).frame(maxWidth: .infinity, alignment: .center)
          if isAction {
            Spacer(minLength: 0)
            actionIndicator
          }
        }
        context.slot("bottom").multilineTextAlignment(.center).frame(maxWidth: .infinity, alignment: .center)
      case "Context":
        context.slot("title").openUIFont(context.theme.typography.caption)
          .foregroundStyle(contentTheme.secondary)
        if artworkSource != nil { Spacer(minLength: context.theme.contentSpacing) }
        if let body = context.string("body") {
          NativeMarkdownText(text: body, mode: .inline, style: .init(font: context.theme.typography.detail.weight(.semibold)))
        }
      case "Visual":
        context.slot("tag")
        if artworkSource != nil { Spacer(minLength: context.theme.contentSpacing) }
        HStack(alignment: .center, spacing: context.theme.spacing("s")) {
          context.slot("body")
          if isAction {
            Spacer(minLength: 0)
            actionIndicator
          }
        }
      default:
        context.slot("header").environment(\.openUICardHeaderInset, bannerHeaderInset)
        context.slot("body")
        if let footer = context.value("footer"), footer != .null {
          NativeCompositeFooter(context: context, footer: footer)
            .frame(maxHeight: .infinity, alignment: .bottom)
        }
      }
      groupEntry
    }
      .environment(\.openUICardGroupAction, nil)
      .padding(itemTheme.cardPadding)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
  @ViewBuilder private var groupEntry: some View {
    if let groupAction {
      // A sibling of content/links, inside this item's single surface.
      OpenUIActionSurface(context: context, message: groupAction.message, action: groupAction.action) {
        HStack(spacing: context.theme.spacing("s")) {
          Text(groupAction.message).multilineTextAlignment(.leading)
          Spacer(minLength: 0)
          Image(systemName: "chevron.right").accessibilityHidden(true)
        }
        .openUIFont(context.theme.typography.actionCompact)
        .foregroundStyle(contentTheme.foreground)
        .frame(maxWidth: .infinity, alignment: .leading)
      }
      .disabled(!context.canDispatch(groupAction.action))
      .accessibilityIdentifier("openui.card-item.group-action")
    }
  }
}

struct NativeCompositeFooter: View {
  let context: OpenUIComponentContext
  let footer: Value
  var body: some View {
    // An object footer balances amount and action when their complete widths
    // fit. It becomes a column before compressing either reading value. The
    // same mounted action survives that placement change.
    NativeLabelValueLayout(gap: context.theme.contentSpacing,
      minimumLabelWidth: .greatestFiniteMagnitude, centerVertically: true,
      collapsesEmptySlots: true) {
      context.render(NativeValue.prop(footer, "price") ?? .null)
      context.render(NativeValue.prop(footer, "button") ?? .null)
    }
  }
}
struct NativeCardBlock: View {
  let context: OpenUIComponentContext
  let kind: String
  @EnvironmentObject private var state: OpenUIState
  @Environment(\.dynamicTypeSize) private var typeSize
  @State private var selectedID = ""
  private var children: [OpenUIRenderChild] { context.children("items") }
  private var selection: Binding<String> {
    Binding(get: { children.contains(where: { $0.id == selectedID }) ? selectedID : children.first?.id ?? "" },
      set: { selectedID = $0 })
  }
  private var minimumWidth: CGFloat {
    kind == "Overview"
      ? context.theme.minimumCompactCardWidth : context.theme.minimumCardWidth
  }
  private var gap: CGFloat {
    CGFloat(
      min(
        128, max(0, context.number("gap") ?? Double(context.theme.spacing(context.string("gap"))))))
  }
  private var grid: NativeCardGrid? {
    let layout = context.string("layout")
    // Positional layout arguments may arrive after large inline item arrays.
    // Until the mode is known, keep a browsable card viewport rather than
    // expanding every item into a temporary vertical document.
    let pending = !context.element.isSourceComplete && !["grid", "carousel"].contains(layout ?? "")
    guard layout != "carousel", !pending else { return nil }
    return NativeCardGrid(fixedColumns: context.flag("responsive") == false ? 2
      : typeSize.isAccessibilitySize || children.count == 1 ? 1 : nil,
      minimumWidth: minimumWidth, spacing: gap)
  }
  var body: some View {
    Group {
      if children.isEmpty {
        EmptyView()
      } else {
        NativePager(ids: children.map(\.id), selection: selection, enabled: true,
          identifier: "openui.card-block.\(kind.lowercased())", showsControls: false,
          maximumPageWidth: context.theme.maximumCarouselCardWidth,
          trailingPeek: context.theme.carouselPeek, pageSpacing: gap, grid: grid, supportsAdjustment: false) { id in
          if let index = children.firstIndex(where: { $0.id == id }) {
            item(children[index], index: index)
          }
        }
      }
    }
  }
  @ViewBuilder private func item(_ item: OpenUIRenderChild, index: Int) -> some View {
    if let value = context.value("action"), value != .null {
      let message = NativeCardAction.label(item.value, kind: kind, index: index)
      let action = NativeCardAction.action(value, item: item.value, kind: kind, index: index)
      if ["Snippet", "Overview", "Visual"].contains(kind) {
        // These upstream item types contain presentation-only slots.
        // The image and text share one native Button hit target.
        OpenUIActionSurface(context: context, message: message, action: action) {
          context.render(item.value).environment(\.openUICardIsAction, true)
        }.accessibilityLabel(message)
      } else {
        if case .element = item.value {
          context.render(item.value).environment(\.openUICardGroupAction,
            NativeCardGroupAction(message: message, action: action))
        } else {
          context.render(item.value)
        }
      }
    } else {
      context.render(item.value)
    }
  }
}
