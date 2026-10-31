import SwiftUI

/// Source data has the same fields as the upstream CardSourceSchema. Ordering is
/// meaningful: [1] refers to the first source supplied by the enclosing provider.
public struct CardSource: Codable, Hashable, Sendable {
  public var url: String?
  public var title: String
  public var sourceName: String
  public init(url: String? = nil, title: String, sourceName: String) {
    self.url = url; self.title = title; self.sourceName = sourceName
  }
}

public struct CardSourceProvider<Content: View>: View {
  private let sources: [CardSource]
  private let content: Content
  public init(sources: [CardSource]?, @ViewBuilder content: () -> Content) {
    self.sources = sources ?? []; self.content = content()
  }
  public var body: some View { content.environment(\.cardSources, sources) }
}

private struct CardSourcesKey: EnvironmentKey { static let defaultValue: [CardSource] = [] }
extension EnvironmentValues {
  var cardSources: [CardSource] {
    get { self[CardSourcesKey.self] }
    set { self[CardSourcesKey.self] = newValue }
  }
}

struct NativeCitationSelection: Identifiable {
  let indices: [Int]
  var id: String { indices.map(String.init).joined(separator: ",") }
  init?(url: URL, sources: [CardSource]) {
    guard url.scheme == "openui-citation" else { return nil }
    let values = url.lastPathComponent.split(separator: ",").compactMap { Int($0) }
      .filter { $0 > 0 && $0 <= sources.count && Self.valid(sources[$0 - 1]) }
    guard !values.isEmpty else { return nil }
    indices = values
  }
  static func valid(_ source: CardSource) -> Bool {
    !source.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
      && !source.sourceName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
  }
}

struct NativeCitationSources: View {
  let indices: [Int]
  let sources: [CardSource]
  @Environment(\.dismiss) private var dismiss
  @Environment(\.openURL) private var openURL
  @Environment(\.openUITheme) private var theme
  @Environment(\.openUIResourceContext) private var resources
  var body: some View {
    VStack(alignment: .leading, spacing: theme.spacing("ml")) {
      HStack {
        Text("Sources", bundle: NativeControlResources.bundle).openUIFont(theme.typography.heading)
        Spacer()
        Button { dismiss() } label: { Image(systemName: "xmark").frame(width: 44, height: 44) }
          .buttonStyle(.plain).accessibilityLabel(Text("Close", bundle: NativeControlResources.bundle))
      }
      ScrollView {
        VStack(alignment: .leading, spacing: theme.spacing("ml")) {
          ForEach(Array(indices.filter { $0 > 0 && $0 <= sources.count && NativeCitationSelection.valid(sources[$0 - 1]) }.enumerated()), id: \.offset) { _, index in
            let source = sources[index - 1]
            let target = NativeRichTextEngine.shared.sourceURL(source.url)
              .flatMap { URL(string: $0, relativeTo: resources.baseURL)?.absoluteURL }
            Button {
              guard let target else { return }
              openURL(target); dismiss()
            } label: {
              HStack(alignment: .top, spacing: theme.spacing("m")) {
                if let host = target?.host {
                  let favicon = "https://www.google.com/s2/favicons?sz=128&domain="
                    + (host.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? host)
                  NativeRemoteImage(src: favicon, alt: source.sourceName, layout: .thumbnail(CGSize(width: 20, height: 20)))
                } else { Image(systemName: "globe").frame(width: 20, height: 20) }
                VStack(alignment: .leading, spacing: theme.spacing("2xs")) {
                  Text(source.title).openUIFont(theme.typography.heading).foregroundStyle(theme.foreground)
                  Text(source.sourceName).openUIFont(theme.typography.caption).foregroundStyle(theme.secondary)
                  if let target { Text(target.absoluteString).openUIFont(theme.typography.caption).foregroundStyle(theme.secondary).lineLimit(2) }
                }.frame(maxWidth: .infinity, alignment: .leading)
              }.contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityIdentifier("openui.citation.source.\(index)")
          }
        }
      }
    }.padding(theme.spacing("ml")).frame(idealWidth: 420, idealHeight: 300)
      .accessibilityElement(children: .contain).accessibilityIdentifier("openui.citation.sources")
  }
}
