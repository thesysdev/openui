import Foundation
import OpenUILang
import SwiftUI
#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

enum NativeMediaStatus: Equatable { case loading, loaded, unavailable }
enum NativeMediaLayout {
  case cover, aspect(CGFloat), thumbnail(CGSize), fit, fill, intrinsic
}

/// Completed media belongs to the presentation, rather than a transient layout
/// branch. A late grid/carousel argument may relocate an already loaded image.
@MainActor final class NativeMediaCache {
  @MainActor struct Entry {
    let image: Image
    let size: CGSize
    let cost: Int
    // Keep ObjectIdentifier(loader) valid for the lifetime of this entry.
    let resourceOwner: any OpenUIResourceLoading
    var wasPresented = false
  }
  private var entries: [NativeResourceRequestID: Entry] = [:]
  private var order: [NativeResourceRequestID] = []
  private var pending: [NativeResourceRequestID: Task<Entry, Error>] = [:]
  private let maximumCost = 32 * 1024 * 1024
  private(set) var generation = 0
  subscript(_ key: NativeResourceRequestID) -> Entry? { entries[key] }
  func markPresented(_ key: NativeResourceRequestID) { entries[key]?.wasPresented = true }
  func insert(_ entry: Entry, for key: NativeResourceRequestID) {
    guard entry.cost <= maximumCost else { return }
    entries[key] = entry
    order.removeAll { $0 == key }; order.append(key)
    while order.count > 8 || entries.values.reduce(0, { $0 + $1.cost }) > maximumCost {
      entries.removeValue(forKey: order.removeFirst())
    }
  }
  func resource(_ key: NativeResourceRequestID, loader: any OpenUIResourceLoading) async throws -> Entry {
    if let value = entries[key] { return value }
    if let task = pending[key] { return try await task.value }
    guard let request = key.request else { throw URLError(.badURL) }
    let current = generation
    let task = Task { @MainActor [weak self] in
      let data = try await loader.data(for: request)
      try Task.checkCancellation()
      guard let self, self.generation == current else { throw CancellationError() }
      let entry = try Self.decode(data, loader: loader)
      self.insert(entry, for: key)
      return entry
    }
    pending[key] = task
    defer { if generation == current { pending[key] = nil } }
    return try await task.value
  }
  static func decode(_ data: Data, loader: any OpenUIResourceLoading) throws -> Entry {
    #if os(iOS)
    guard let image = UIImage(data: data) else { throw URLError(.cannotDecodeContentData) }
    let result = Image(uiImage: image)
    let pixels = image.size.width * image.scale * image.size.height * image.scale
    #else
    guard let image = NSImage(data: data) else { throw URLError(.cannotDecodeContentData) }
    let result = Image(nsImage: image)
    let pixels = image.representations.map { Double($0.pixelsWide) * Double($0.pixelsHigh) }.max()
      ?? Double(image.size.width * image.size.height)
    #endif
    let cost = Int(min(Double(32 * 1024 * 1024 + 1), max(0, Double(pixels) * 4)))
    return Entry(image: result, size: image.size, cost: cost, resourceOwner: loader)
  }
  func removeAll() {
    generation &+= 1
    pending.values.forEach { $0.cancel() }; pending.removeAll()
    entries.removeAll(); order.removeAll()
  }
}
private struct NativeMediaCacheKey: EnvironmentKey { static let defaultValue: NativeMediaCache? = nil }
private struct NativeMediaSourceKey: EnvironmentKey { static let defaultValue = true }
private struct NativeMediaTaskID: Hashable {
  let request: NativeResourceRequestID?
  let sourceReady: Bool
}
extension EnvironmentValues {
  var openUIMediaSourceReady: Bool {
    get { self[NativeMediaSourceKey.self] }
    set { self[NativeMediaSourceKey.self] = newValue }
  }
  var openUIMediaCache: NativeMediaCache? {
    get { self[NativeMediaCacheKey.self] }
    set { self[NativeMediaCacheKey.self] = newValue }
  }
}

/// Shared native resource presentation. Resource states preserve the declared
/// media layout; network failures remain separate from language diagnostics.
struct NativeRemoteImage: View {
  let src: String?
  var alt = ""
  var layout: NativeMediaLayout = .cover
  var showsFailureSymbol = true
  var cachedImage: Image?
  var attempt = 0
  var onStatus: ((NativeMediaStatus, Image?) -> Void)?
  @Environment(\.openUIMediaSourceReady) private var sourceReady
  @State private var phase: AsyncImagePhase = .empty
  @State private var imageSize: CGSize?
  @State private var loadedRequest: NativeResourceRequestID?
  @State private var revealLoadedImage = true
  @Environment(\.openUIResourceContext) private var resources
  @Environment(\.openUITheme) private var theme
  @Environment(\.openUICardIsAction) private var cardIsAction
  @Environment(\.openUIMediaCache) private var mediaCache

  var body: some View {
    Group {
      // Each media role owns its frame before pixels arrive. A later parent
      // layout argument must not temporarily replace it with a small thumbnail.
      if !sourceReady {
        placeholder(loading: true).onAppear { onStatus?(.loading, nil) }
      } else if let cachedImage {
        picture(cachedImage).onAppear { onStatus?(.loaded, cachedImage) }
      } else if loadedRequest != requestID, let retained = mediaCache?[requestID] {
        picture(retained.image, retainedSize: retained.size, reveal: !retained.wasPresented)
          .onAppear { mediaCache?.markPresented(requestID); onStatus?(.loaded, retained.image) }
      } else if resources.request(for: src) != nil {
        Group {
          switch loadedRequest == requestID ? phase : .empty {
          case .success(let image): picture(image, reveal: revealLoadedImage).onAppear {
            mediaCache?.markPresented(requestID); onStatus?(.loaded, image)
          }
          case .empty: loading.onAppear { onStatus?(.loading, nil) }
          case .failure: unavailable.onAppear { onStatus?(.unavailable, nil) }
          @unknown default: unavailable.onAppear { onStatus?(.unavailable, nil) }
          }
        }
      } else {
        unavailable.onAppear { onStatus?(.unavailable, nil) }
      }
    }
    .task(id: NativeMediaTaskID(request: sourceReady ? requestID : nil, sourceReady: sourceReady)) {
      guard sourceReady, cachedImage == nil else { return }
      if let retained = mediaCache?[requestID] {
        // A mounted image owns its successful phase. The bounded presentation
        // cache can evict this entry while later cards are still arriving.
        loadedRequest = requestID
        imageSize = retained.size
        revealLoadedImage = !retained.wasPresented
        phase = .success(retained.image)
        return
      }
      if requestID.request == nil { onStatus?(.unavailable, nil) } else { await load() }
    }
  }
  private var requestID: NativeResourceRequestID {
    var request = resources.request(for: src)
    if attempt > 0 { request?.cachePolicy = .reloadIgnoringLocalCacheData }
    return .init(request: request, loader: ObjectIdentifier(resources.loader), attempt: attempt)
  }
  @MainActor private func load() async {
    let id = requestID
    let generation = mediaCache?.generation
    guard let request = id.request else { return }
    loadedRequest = id; phase = .empty; imageSize = nil; revealLoadedImage = true
    do {
      let entry: NativeMediaCache.Entry
      if let mediaCache { entry = try await mediaCache.resource(id, loader: resources.loader) }
      else { entry = try NativeMediaCache.decode(try await resources.loader.data(for: request), loader: resources.loader) }
      try Task.checkCancellation()
      guard id == requestID, mediaCache?.generation == generation else { return }
      guard id == requestID else { return }
      imageSize = entry.size
      phase = .success(entry.image)
    } catch {
      guard !Task.isCancelled, id == requestID else { return }
      phase = .failure(error)
    }
  }
  private func picture(_ image: Image, retainedSize: CGSize? = nil, reveal: Bool = true) -> some View {
    Group {
      switch layout {
      case .intrinsic, .fit:
        canvas(sourceSize: retainedSize) { image.resizable().scaledToFit().modifier(NativeMediaReveal(enabled: reveal)) }
      default:
        canvas(sourceSize: retainedSize) { image.resizable().scaledToFill().modifier(NativeMediaReveal(enabled: reveal)) }
      }
    }
    .accessibilityElement(children: .ignore).accessibilityLabel(alt)
    .accessibilityAddTraits(.isImage).accessibilityHidden(alt.isEmpty)
  }
  private var loading: some View { placeholder(loading: true) }
  private var unavailable: some View { placeholder(loading: false) }
  private func placeholder(loading: Bool) -> some View {
    canvas {
      if loading {
        NativeMediaSkeleton()
      } else {
        ZStack {
          theme.surface
          if showsFailureSymbol {
            GeometryReader { geometry in
              VStack(spacing: theme.spacing("xs")) {
                Image(systemName: "exclamationmark.triangle").openUIFont(theme.typography.body)
                if geometry.size.width >= 160 && geometry.size.height >= 96 {
                  Text("Image unavailable", bundle: NativeControlResources.bundle)
                    .openUIFont(theme.typography.caption)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, theme.spacing("s"))
                }
              }
              .foregroundStyle(theme.secondary)
              .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
          }
        }
      }
    }
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(
      alt.isEmpty
        ? Text(loading ? "Loading image" : "Image unavailable", bundle: NativeControlResources.bundle) : Text(alt)
    )
    .accessibilityValue(Text(loading ? "Loading image" : "Image unavailable", bundle: NativeControlResources.bundle))
    .accessibilityAddTraits(.isImage)
    .accessibilityIdentifier(loading ? "openui.media.loading" : "openui.media.unavailable")
  }
  // Document illustrations retain their source proportions; photo previews
  // use the same declared role in every resource state.
  @ViewBuilder private func canvas<Content: View>(sourceSize: CGSize? = nil,
    @ViewBuilder _ content: () -> Content) -> some View {
    let surface = Color.clear.overlay { content().accessibilityHidden(true) }.clipped().contentShape(Rectangle())
    switch layout {
    case .cover:
      surface.aspectRatio(theme.coverAspectRatio, contentMode: .fit).fixedSize(horizontal: false, vertical: true)
    case .aspect(let ratio):
      surface.aspectRatio(ratio, contentMode: .fit).fixedSize(horizontal: false, vertical: true)
    case .thumbnail(let size): surface.frame(width: size.width, height: size.height)
    case .fit, .fill: surface.frame(maxWidth: .infinity, maxHeight: .infinity)
    case .intrinsic:
      surface.aspectRatio(NativeMediaPreview.aspectRatio(sourceSize: sourceSize ?? imageSize), contentMode: .fit)
        .fixedSize(horizontal: false, vertical: true)
    }
  }
}

private struct NativeGalleryResourceID: Hashable {
  let itemID: String
  let source: String?
  let request: NativeResourceRequestID
}

private struct NativeGalleryImage: Identifiable {
  let id: String
  let index: Int
  let src: String?
  let alt: String
  let details: String?
  let requestID: NativeResourceRequestID
  let sourceReady: Bool
  var key: NativeGalleryResourceID { .init(itemID: id, source: src, request: requestID) }
}

/// Small galleries are measured synchronously at their actual container width.
/// Columns never outnumber the supplied images, so sparse galleries fill the row.
private struct NativeGalleryGridLayout: Layout {
  let minimumWidth: CGFloat
  let gap: CGFloat
  var maximumColumns: Int?

  private func frames(_ proposal: ProposedViewSize, _ subviews: Subviews) -> (CGFloat, [CGRect]) {
    let width = proposal.width.flatMap { $0.isFinite ? max(1, $0) : nil } ?? max(1, minimumWidth)
    guard !subviews.isEmpty else { return (width, []) }
    let columns = min(subviews.count, maximumColumns ?? subviews.count,
      max(1, Int((width + gap) / max(1, minimumWidth + gap))))
    let tileWidth = max(1, (width - gap * CGFloat(columns - 1)) / CGFloat(columns))
    let sizes = subviews.map { $0.sizeThatFits(ProposedViewSize(width: tileWidth, height: nil)) }
    var result: [CGRect] = []
    var y: CGFloat = 0
    for start in stride(from: 0, to: subviews.count, by: columns) {
      let end = min(start + columns, subviews.count)
      let rowHeight = sizes[start..<end].map(\.height).max() ?? 0
      for index in start..<end {
        result.append(CGRect(x: CGFloat(index - start) * (tileWidth + gap), y: y,
          width: tileWidth, height: sizes[index].height))
      }
      y += rowHeight + gap
    }
    return (width, result)
  }
  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let (width, frames) = frames(proposal, subviews)
    return CGSize(width: width, height: frames.map(\.maxY).max() ?? 0)
  }
  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    let (_, frames) = frames(ProposedViewSize(width: bounds.width, height: nil), subviews)
    for (view, frame) in zip(subviews, frames) {
      view.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
        anchor: .topLeading, proposal: ProposedViewSize(width: frame.width, height: nil))
    }
  }
}

struct NativeImageGallery: View {
  let context: OpenUIComponentContext
  @Environment(\.openUIResourceContext) private var resources
  @Environment(\.dynamicTypeSize) private var typeSize
  @State private var phases: [NativeGalleryResourceID: NativeMediaStatus] = [:]
  @State private var pictures: [NativeGalleryResourceID: Image] = [:]
  @State private var selected: NativeGalleryResourceID?
  @State private var preview = false
  @State private var retries: [String: Int] = [:]
  // The pinned upstream ImageGallery previews five items, with Show All.
  private let previewLimit = 5
  private var images: [NativeGalleryImage] {
    context.children("images").enumerated().map { index, child in
      let attempt = retries[child.id, default: 0]
      var request = resources.request(for: NativeValue.string(child.value, "src"))
      if attempt > 0 { request?.cachePolicy = .reloadIgnoringLocalCacheData }
      return NativeGalleryImage(id: child.id, index: index,
        src: NativeValue.string(child.value, "src"), alt: NativeValue.string(child.value, "alt") ?? "",
        details: NativeValue.string(child.value, "details"),
        requestID: .init(request: request, loader: ObjectIdentifier(resources.loader), attempt: attempt),
        sourceReady: { if case .element(let image) = child.value { return image.isSourceComplete }; return context.element.isSourceComplete }())
    }
  }
  private var visible: [NativeGalleryImage] { Array(images.prefix(previewLimit)) }
  private var failed: [NativeGalleryImage] { images.filter { phases[$0.key] == .unavailable } }
  var body: some View {
    VStack(alignment: .leading, spacing: context.theme.contentSpacing) {
      if !visible.isEmpty {
        NativeGalleryGridLayout(minimumWidth: context.theme.thumbnailSize,
          gap: context.theme.contentSpacing, maximumColumns: typeSize.isAccessibilitySize ? 1 : nil) {
          ForEach(visible) { image in
            VStack(alignment: .leading, spacing: context.theme.spacing("xs")) {
              Button {
                guard context.canActivate else { return }
                selected = image.key; preview = true
              } label: {
                NativeRemoteImage(
                  src: image.src, alt: image.alt, layout: .cover,
                  cachedImage: pictures[image.key], attempt: image.requestID.attempt,
                  onStatus: { record($0, image: $1, for: image.key) }
                )
                .environment(\.openUIMediaSourceReady, image.sourceReady)
                .background(context.theme.surface)
                .clipShape(RoundedRectangle(cornerRadius: context.theme.mediaCornerRadius, style: .continuous))
              }
              .buttonStyle(.plain).disabled(!context.canInteract || pictures[image.key] == nil)
              .accessibilityLabel(image.alt.isEmpty ? Text("View image", bundle: NativeControlResources.bundle) : Text(image.alt))
              .accessibilityValue(
                phases[image.key] == .unavailable
                  ? Text("Image unavailable", bundle: NativeControlResources.bundle)
                  : pictures[image.key] == nil ? Text("Loading image", bundle: NativeControlResources.bundle) : Text("")
              )
              .accessibilityIdentifier("openui.gallery.image.\(image.index)")
              if let details = image.details { Text(details).openUIFont(context.theme.typography.caption).foregroundStyle(context.theme.secondary) }
            }
          }
        }
      }
      if images.count > previewLimit || !failed.isEmpty {
        HStack {
          if images.count > previewLimit {
            Button {
              guard context.canActivate else { return }
              if !images.contains(where: { $0.key == selected && pictures[$0.key] != nil }) {
                selected = images.first(where: { pictures[$0.key] != nil })?.key
              }
              preview = true
            } label: {
              Text("Show all photos", bundle: NativeControlResources.bundle)
                .openUIFont(context.theme.typography.actionCompact).openUIControlTarget(alignment: .leading)
            }
            .disabled(!context.canInteract).accessibilityIdentifier("openui.gallery.showAll")
          }
          Spacer(minLength: 0)
          if !failed.isEmpty {
            Button {
              guard context.canActivate else { return }
              for image in failed { retries[image.id, default: 0] += 1 }
            } label: {
              Text("Retry", bundle: NativeControlResources.bundle)
                .openUIFont(context.theme.typography.actionCompact).openUIControlTarget()
            }
              .accessibilityIdentifier("openui.gallery.retry")
              .disabled(!context.canInteract)
          }
        }
      }
    }
    .accessibilityElement(children: .contain).accessibilityIdentifier("openui.gallery")
    .sheet(isPresented: $preview) {
      NativeGalleryPreview(images: images, selected: $selected, pictures: pictures, phases: phases, record: record)
    }
    .onChange(of: images.map(\.key)) { keys in
      let current = Set(keys)
      phases = phases.filter { current.contains($0.key) }
      pictures = pictures.filter { current.contains($0.key) }
      if selected.map(current.contains) != true { preview = false; selected = nil }
    }
  }
  private func record(_ phase: NativeMediaStatus, image: Image?, for key: NativeGalleryResourceID) {
    guard images.contains(where: { $0.key == key }) else { return }
    if let image, pictures[key] == nil { pictures[key] = image }
    if phases[key] != .loaded && phases[key] != phase { phases[key] = phase }
  }
}

private struct NativeGalleryPreview: View {
  let images: [NativeGalleryImage]
  @Binding var selected: NativeGalleryResourceID?
  let pictures: [NativeGalleryResourceID: Image]
  let phases: [NativeGalleryResourceID: NativeMediaStatus]
  let record: (NativeMediaStatus, Image?, NativeGalleryResourceID) -> Void
  @Environment(\.dismiss) private var dismiss
  @Environment(\.openUITheme) private var theme
  @Environment(\.openUIResourceContext) private var resources
  @Environment(\.openURL) private var openURL
  private var image: NativeGalleryImage? { images.first { $0.key == selected } }
  var body: some View {
    VStack(alignment: .leading, spacing: theme.spacing("m")) {
      HStack {
        Text("All photos", bundle: NativeControlResources.bundle).openUIFont(theme.typography.heading)
        Spacer()
        if let image { Text("\(image.index + 1) / \(images.count)").openUIFont(theme.typography.detail).foregroundStyle(theme.secondary) }
        if let image, let destination = resources.request(for: image.src)?.url {
          Button { openURL(destination) } label: {
            Image(systemName: "arrow.up.right.square").openUIFont(theme.typography.actionRegular).openUIControlTarget()
          }
            .buttonStyle(.plain)
            .accessibilityLabel(Text("Open original image", bundle: NativeControlResources.bundle))
            .accessibilityIdentifier("openui.gallery.open-original")
        }
        Button { dismiss() } label: { Image(systemName: "xmark") }
          .buttonStyle(.plain).openUIControlTarget().disabled(false)
          .keyboardShortcut(.cancelAction).accessibilityLabel(Text("Close gallery", bundle: NativeControlResources.bundle))
          .accessibilityIdentifier("openui.gallery.close")
      }
      if let image {
        GeometryReader { _ in
          NativeRemoteImage(src: image.src, alt: image.alt, layout: .fit,
            cachedImage: pictures[image.key], attempt: image.requestID.attempt, onStatus: { record($0, $1, image.key) })
        }.accessibilityIdentifier("openui.gallery.preview.image")
        if !image.alt.isEmpty { Text(image.alt).openUIFont(theme.typography.detail) }
        if let details = image.details { Text(details).openUIFont(theme.typography.caption).foregroundStyle(theme.secondary) }
      }
      ScrollView(.horizontal) {
        HStack(spacing: theme.contentSpacing) {
          ForEach(images) { image in
            Button { selected = image.key } label: {
              NativeRemoteImage(src: image.src, alt: image.alt,
                layout: .thumbnail(CGSize(width: theme.compactThumbnailSize,
                  height: theme.compactThumbnailSize / theme.coverAspectRatio)),
                cachedImage: pictures[image.key], attempt: image.requestID.attempt, onStatus: { record($0, $1, image.key) })
                .clipShape(RoundedRectangle(cornerRadius: theme.mediaCornerRadius, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: theme.mediaCornerRadius, style: .continuous).strokeBorder(selected == image.key ? theme.accent : .clear, lineWidth: 2))
            }.buttonStyle(.plain).disabled(phases[image.key] == .unavailable)
              .accessibilityLabel(image.alt.isEmpty ? Text("View image", bundle: NativeControlResources.bundle) : Text(image.alt))
              .accessibilityIdentifier("openui.gallery.thumbnail.\(image.index)")
          }
        }
      }
    }
    .padding(20).frame(idealWidth: 720, idealHeight: 640)
    .accessibilityElement(children: .contain).accessibilityIdentifier("openui.gallery.preview")
  }
}
