import SwiftUI

/// The public IconText sizes select a base glyph; drawing and its box use
/// the same nearest-view Dynamic Type scale. Aliases retain the same meaning.
enum NativeIconTextMetrics {
  static func glyph(_ size: String?) -> CGFloat {
    switch size {
    case "xs": return 12
    case "s", "sm": return 14
    case "l", "lg": return 20
    case "xl": return 24
    default: return 16
    }
  }
}

private struct NativeIconSizeKey: EnvironmentKey { static let defaultValue: CGFloat? = nil }
extension EnvironmentValues {
  var openUIIconSize: CGFloat? {
    get { self[NativeIconSizeKey.self] }
    set { self[NativeIconSizeKey.self] = newValue }
  }
}

/// Same pinned artwork and fallback categories as the upstream library.
enum NativeIconCatalog {
  struct Catalog: Decodable {
    let version: String
    let fallbacks: [String: String]
    let icons: [String: [Primitive]]
  }
  struct Command: Decodable {
    let op: String
    let values: [CGFloat]
    init(from decoder: Decoder) throws {
      var values = try decoder.unkeyedContainer()
      op = try values.decode(String.self)
      var coordinates: [CGFloat] = []
      while !values.isAtEnd { coordinates.append(try values.decode(CGFloat.self)) }
      self.values = coordinates
    }
  }
  struct Primitive: Decodable {
    var fill: Bool
    var commands: [Command]?
    var ellipse: [CGFloat]?
    var rect: [CGFloat]?
    var path: Path {
      var path = Path()
      if let ellipse, ellipse.count == 4 {
        path.addEllipse(in: CGRect(x: ellipse[0], y: ellipse[1], width: ellipse[2], height: ellipse[3]))
      }
      if let rect, rect.count == 6 {
        path.addRoundedRect(in: CGRect(x: rect[0], y: rect[1], width: rect[2], height: rect[3]),
                            cornerSize: CGSize(width: rect[4], height: rect[5]))
      }
      for command in commands ?? [] {
        let v = command.values
        switch command.op {
        case "M": path.move(to: CGPoint(x: v[0], y: v[1]))
        case "L": path.addLine(to: CGPoint(x: v[0], y: v[1]))
        case "C": path.addCurve(to: CGPoint(x: v[4], y: v[5]), control1: CGPoint(x: v[0], y: v[1]), control2: CGPoint(x: v[2], y: v[3]))
        case "Q": path.addQuadCurve(to: CGPoint(x: v[2], y: v[3]), control: CGPoint(x: v[0], y: v[1]))
        case "Z": path.closeSubpath()
        default: break
        }
      }
      return path
    }
  }
  static let catalog: Catalog = {
    guard let url = NativeControlResources.bundle.url(forResource: "lucide-icons", withExtension: "json"),
      let data = try? Data(contentsOf: url), let catalog = try? JSONDecoder().decode(Catalog.self, from: data)
    else { preconditionFailure("Missing or invalid pinned Lucide resource") }
    return catalog
  }()
  static func resolvedName(_ name: String, category: String?) -> String {
    if catalog.icons[name] != nil { return name }
    return catalog.fallbacks[category?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() ?? ""] ?? "circle-dot"
  }
}

struct NativeIcon: View {
  let context: OpenUIComponentContext
  @ScaledMetric(relativeTo: .body) private var size: CGFloat = 18
  @Environment(\.openUIIconSize) private var requestedSize
  var body: some View {
    let name = context.string("name") ?? ""
    let resolved = NativeIconCatalog.resolvedName(name, category: context.string("category"))
    Canvas { canvas, dimensions in
      let scale = min(dimensions.width, dimensions.height) / 24
      canvas.translateBy(x: (dimensions.width - 24 * scale) / 2, y: (dimensions.height - 24 * scale) / 2)
      canvas.scaleBy(x: scale, y: scale)
      for primitive in NativeIconCatalog.catalog.icons[resolved] ?? [] {
        if primitive.fill { canvas.fill(primitive.path, with: .foreground) }
        canvas.stroke(primitive.path, with: .foreground, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
      }
    }
    .frame(width: size * (requestedSize ?? 18) / 18, height: size * (requestedSize ?? 18) / 18)
    .accessibilityLabel(name).accessibilityAddTraits(.isImage)
    .accessibilityIdentifier("openui.icon." + resolved)
  }
}
