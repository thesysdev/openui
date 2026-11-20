import OpenUILang
import SwiftUI

#if canImport(UIKit)
  import UIKit
#else
  import AppKit
#endif

/// Maps lucide icon names (what the model writes) to SF Symbols, with the
/// same category fallbacks as react-ui: an unknown name falls back to its
/// category's representative icon, then to `circle-dot`.
enum LucideSymbols {
  static func systemName(for name: String, category: String?) -> String {
    let key = name.trimmingCharacters(in: .whitespaces).lowercased()
    if let symbol = symbols[key] ?? symbols[aliases[key] ?? ""], exists(symbol) { return symbol }
    let fallback = categoryFallbacks[
      category?.trimmingCharacters(in: .whitespaces).lowercased() ?? ""]
    if let fallback, let symbol = symbols[fallback], exists(symbol) { return symbol }
    return symbols[defaultFallback]!
  }

  /// Older OS versions lack some symbols; fall back rather than show nothing.
  private static func exists(_ symbol: String) -> Bool {
    #if canImport(UIKit)
      UIImage(systemName: symbol) != nil
    #else
      NSImage(systemSymbolName: symbol, accessibilityDescription: nil) != nil
    #endif
  }

  static let defaultFallback = "circle-dot"

  /// Lucide's renamed icons, mapped to the names in `symbols`.
  static let aliases: [String: String] = [
    "triangle-alert": "alert-triangle", "circle-alert": "alert-circle",
    "check-circle-2": "check-circle",
    "circle-check-big": "circle-check", "chart-no-axes-column": "bar-chart",
    "settings-2": "settings",
    "house-plus": "house", "utensils-crossed": "utensils", "file-chart-column": "file-text",
    "mail-open": "mail", "map-pinned": "map-pin", "sparkle": "sparkles", "dollar": "dollar-sign",
  ]

  /// react-ui's `categoryFallbacks`: category → representative lucide name.
  static let categoryFallbacks: [String: String] = [
    "accessibility": "accessibility", "account": "user", "animals": "cat", "arrows": "arrow-right",
    "brands": "box", "buildings": "building", "charts": "chart-line",
    "communication": "message-square", "connectivity": "wifi", "cursors": "mouse-pointer",
    "design": "palette", "development": "code", "devices": "smartphone", "emoji": "smile",
    "files": "file", "finance": "dollar-sign", "food-beverage": "cooking-pot", "gaming": "gamepad",
    "home": "house", "layout": "layout", "mail": "mail", "math": "calculator",
    "medical": "heart-pulse", "multimedia": "music", "nature": "tree-pine",
    "navigation": "map-pin", "notifications": "bell", "people": "users",
    "photography": "camera", "science": "microscope", "seasons": "sun", "security": "shield",
    "shapes": "circle", "shopping": "shopping-cart", "social": "share-2", "sports": "trophy",
    "sustainability": "leaf", "text": "type", "time": "clock", "tools": "wrench",
    "transportation": "car", "travel": "plane", "weather": "cloud",
  ]

  static let symbols: [String: String] = [
    "activity": "waveform.path.ecg",
    "alarm-clock": "alarm",
    "alert-circle": "exclamationmark.circle",
    "alert-triangle": "exclamationmark.triangle",
    "archive": "archivebox",
    "arrow-down": "arrow.down",
    "arrow-down-right": "arrow.down.right",
    "arrow-left": "arrow.left",
    "arrow-right": "arrow.right",
    "arrow-up": "arrow.up",
    "arrow-up-right": "arrow.up.right",
    "award": "rosette",
    "baby": "figure.and.child.holdinghands",
    "backpack": "backpack",
    "badge-check": "checkmark.seal",
    "banknote": "banknote",
    "bar-chart": "chart.bar",
    "bar-chart-2": "chart.bar",
    "bath": "bathtub",
    "battery": "battery.100",
    "bed": "bed.double",
    "beer": "mug",
    "bell": "bell",
    "bike": "bicycle",
    "book": "book",
    "book-open": "book",
    "bookmark": "bookmark",
    "box": "shippingbox",
    "brain": "brain",
    "briefcase": "briefcase",
    "bug": "ant",
    "building": "building",
    "building-2": "building.2",
    "bus": "bus",
    "cake": "birthday.cake",
    "calculator": "function",
    "calendar": "calendar",
    "calendar-days": "calendar",
    "camera": "camera",
    "car": "car",
    "cart": "cart",
    "cat": "cat",
    "chart-bar": "chart.bar",
    "chart-column": "chart.bar",
    "chart-line": "chart.xyaxis.line",
    "chart-pie": "chart.pie",
    "check": "checkmark",
    "check-circle": "checkmark.circle",
    "chevron-down": "chevron.down",
    "chevron-left": "chevron.left",
    "chevron-right": "chevron.right",
    "chevron-up": "chevron.up",
    "circle": "circle",
    "circle-alert": "exclamationmark.circle",
    "circle-check": "checkmark.circle",
    "circle-dollar-sign": "dollarsign.circle",
    "circle-dot": "smallcircle.filled.circle",
    "circle-help": "questionmark.circle",
    "circle-x": "xmark.circle",
    "clapperboard": "movieclapper",
    "clipboard": "clipboard",
    "clock": "clock",
    "cloud": "cloud",
    "cloud-rain": "cloud.rain",
    "cloud-sun": "cloud.sun",
    "code": "chevron.left.forwardslash.chevron.right",
    "coffee": "cup.and.saucer",
    "coins": "dollarsign.circle",
    "compass": "safari",
    "cooking-pot": "frying.pan",
    "copy": "doc.on.doc",
    "cpu": "cpu",
    "credit-card": "creditcard",
    "crown": "crown",
    "database": "cylinder",
    "disc-3": "opticaldisc",
    "dollar-sign": "dollarsign",
    "download": "arrow.down.to.line",
    "droplet": "drop",
    "dumbbell": "dumbbell",
    "edit": "pencil",
    "euro": "eurosign",
    "external-link": "arrow.up.right.square",
    "eye": "eye",
    "eye-off": "eye.slash",
    "figma": "paintbrush",
    "file": "doc",
    "file-text": "doc.text",
    "film": "film",
    "filter": "line.3.horizontal.decrease",
    "fish": "fish",
    "flag": "flag",
    "flame": "flame",
    "flask-conical": "flask",
    "folder": "folder",
    "gamepad": "gamecontroller",
    "gamepad-2": "gamecontroller",
    "gauge": "gauge.with.dots.needle.33percent",
    "gift": "gift",
    "git-branch": "arrow.triangle.branch",
    "glasses": "eyeglasses",
    "globe": "globe",
    "graduation-cap": "graduationcap",
    "grid": "square.grid.2x2",
    "hammer": "hammer",
    "hand": "hand.raised",
    "hard-drive": "internaldrive",
    "hash": "number",
    "headphones": "headphones",
    "heart": "heart",
    "heart-pulse": "heart.text.square",
    "help-circle": "questionmark.circle",
    "history": "clock.arrow.circlepath",
    "home": "house",
    "hotel": "bed.double",
    "house": "house",
    "image": "photo",
    "inbox": "tray",
    "info": "info.circle",
    "key": "key",
    "landmark": "building.columns",
    "laptop": "laptopcomputer",
    "layers": "square.3.layers.3d",
    "layout": "rectangle.3.group",
    "layout-dashboard": "rectangle.3.group",
    "leaf": "leaf",
    "lightbulb": "lightbulb",
    "line-chart": "chart.xyaxis.line",
    "link": "link",
    "list": "list.bullet",
    "list-checks": "checklist",
    "loader": "arrow.triangle.2.circlepath",
    "lock": "lock",
    "log-in": "arrow.right.to.line",
    "log-out": "rectangle.portrait.and.arrow.right",
    "mail": "envelope",
    "map": "map",
    "map-pin": "mappin.and.ellipse",
    "medal": "medal",
    "megaphone": "megaphone",
    "menu": "line.3.horizontal",
    "message-circle": "message",
    "message-square": "bubble.left",
    "mic": "mic",
    "microscope": "microbe",
    "minus": "minus",
    "monitor": "display",
    "moon": "moon",
    "more-horizontal": "ellipsis",
    "mountain": "mountain.2",
    "mouse-pointer": "cursorarrow",
    "music": "music.note",
    "navigation": "location.north",
    "newspaper": "newspaper",
    "notebook": "book.closed",
    "package": "shippingbox",
    "palette": "paintpalette",
    "paperclip": "paperclip",
    "pause": "pause",
    "pen": "pencil",
    "pencil": "pencil",
    "percent": "percent",
    "phone": "phone",
    "pie-chart": "chart.pie",
    "pill": "pills",
    "pizza": "fork.knife",
    "plane": "airplane",
    "play": "play",
    "plug": "powerplug",
    "plus": "plus",
    "pound-sterling": "sterlingsign",
    "power": "power",
    "printer": "printer",
    "puzzle": "puzzlepiece",
    "receipt": "receipt",
    "refresh-cw": "arrow.clockwise",
    "rocket": "paperplane",
    "rotate-ccw": "arrow.counterclockwise",
    "route": "point.topleft.down.to.point.bottomright.curvepath",
    "ruler": "ruler",
    "save": "square.and.arrow.down",
    "scale": "scalemass",
    "school": "building.columns",
    "scissors": "scissors",
    "search": "magnifyingglass",
    "send": "paperplane",
    "server": "server.rack",
    "settings": "gearshape",
    "share": "square.and.arrow.up",
    "share-2": "square.and.arrow.up",
    "shield": "shield",
    "shield-check": "checkmark.shield",
    "ship": "ferry",
    "shirt": "tshirt",
    "shopping-bag": "bag",
    "shopping-cart": "cart",
    "smartphone": "iphone",
    "smile": "face.smiling",
    "snowflake": "snowflake",
    "sparkles": "sparkles",
    "speaker": "hifispeaker",
    "square": "square",
    "star": "star",
    "stethoscope": "stethoscope",
    "store": "storefront",
    "sun": "sun.max",
    "sunrise": "sunrise",
    "sunset": "sunset",
    "swords": "figure.fencing",
    "tablet": "ipad",
    "tag": "tag",
    "target": "scope",
    "tent": "tent",
    "terminal": "apple.terminal",
    "thermometer": "thermometer.medium",
    "thumbs-down": "hand.thumbsdown",
    "thumbs-up": "hand.thumbsup",
    "ticket": "ticket",
    "timer": "timer",
    "train": "tram",
    "train-front": "tram",
    "trash": "trash",
    "trash-2": "trash",
    "tree-pine": "tree",
    "trees": "tree",
    "trending-down": "chart.line.downtrend.xyaxis",
    "trending-up": "chart.line.uptrend.xyaxis",
    "trophy": "trophy",
    "truck": "truck.box",
    "tv": "tv",
    "type": "textformat",
    "umbrella": "umbrella",
    "upload": "arrow.up.to.line",
    "user": "person",
    "user-check": "person.crop.circle.badge.checkmark",
    "user-minus": "person.badge.minus",
    "user-plus": "person.badge.plus",
    "users": "person.2",
    "utensils": "fork.knife",
    "video": "video",
    "volume-2": "speaker.wave.2",
    "wallet": "wallet.bifold",
    "watch": "applewatch",
    "waves": "water.waves",
    "wifi": "wifi",
    "wind": "wind",
    "wine": "wineglass",
    "wrench": "wrench.adjustable",
    "x": "xmark",
    "zap": "bolt",
    "accessibility": "accessibility",
    "mouse": "computermouse",
  ]
}

/// The SF Symbol for an `Icon` element value (or nil when the value isn't one).
func iconSymbol(_ value: OpenUIValue) -> String? {
  guard let icon = value.elementValue, icon.typeName == "Icon",
    let name = icon.props["name"]?.stringValue, !name.isEmpty
  else { return nil }
  return LucideSymbols.systemName(for: name, category: icon.props["category"]?.stringValue)
}

struct IconView: View {
  let props: ComponentProps

  var body: some View {
    if let name = props.string("name"), !name.isEmpty {
      Image(systemName: LucideSymbols.systemName(for: name, category: props.string("category")))
    }
  }
}

struct IconButtonView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form

  var body: some View {
    let label = props.text("name")
    let symbol =
      iconSymbol(props["icon"]) ?? LucideSymbols.systemName(for: "circle-dot", category: nil)
    let circle = props.string("shape") == "circle"
    Button {
      let action = props["action"]
      context.triggerAction(label, form: form, action: action.isNullish ? nil : action)
    } label: {
      Image(systemName: symbol)
        .frame(width: 18, height: 18)
        .padding(4)
    }
    .modifier(IconButtonStyle(variant: props.string("variant") ?? "primary", circle: circle))
    .controlSize(controlSize)
    .accessibilityLabel(label)
    .disabled(context.isStreaming)
  }

  private var controlSize: ControlSize {
    switch props.string("size") {
    case "extra-small": return .mini
    case "small": return .small
    case "large": return .large
    default: return .regular
    }
  }
}

private struct IconButtonStyle: ViewModifier {
  let variant: String
  let circle: Bool

  func body(content: Content) -> some View {
    let styled = Group {
      switch variant {
      case "secondary": content.buttonStyle(.bordered)
      case "tertiary": content.buttonStyle(.borderless)
      default: content.modifier(ProminentButton())
      }
    }
    if circle {
      styled.buttonBorderShape(.circle)
    } else {
      styled.buttonBorderShape(.roundedRectangle)
    }
  }
}

struct TagView: View {
  let props: ComponentProps
  var body: some View {
    TagLabel(
      text: props.text("text"), symbol: iconSymbol(props["icon"]), size: props.string("size"),
      variant: props.string("variant"))
  }
}

/// A small pill with optional icon, tinted by status variant.
struct TagLabel: View {
  let text: String
  let symbol: String?
  let size: String?
  let variant: String?
  @Environment(\.openUITagOnImage) private var onImage
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let neutral = variant == nil || variant == "neutral"
    let color = neutral ? Color.secondary : theme.status(variant)
    HStack(spacing: 4) {
      if let symbol { Image(systemName: symbol) }
      // One line, cut short when the tag would be wider than its container.
      Text(text).lineLimit(1)
    }
    .font(font)
    .foregroundStyle(onImage ? Color.white : neutral ? Color.primary : color)
    .padding(tagPadding(size))
    // On a photo the variant tint isn't readable, so react-ui switches every
    // tag to white on translucent black there.
    .background(
      onImage ? Color.black.opacity(0.4) : color.opacity(0.12),
      in: RoundedRectangle(cornerRadius: tagRadius(size)))
  }

  private var font: Font {
    switch size {
    case "sm": return .caption2.weight(.medium)
    case "lg": return .callout.weight(.medium)
    default: return .caption.weight(.medium)
    }
  }
}

private struct TagOnImageKey: EnvironmentKey {
  static let defaultValue = false
}

extension EnvironmentValues {
  /// True for tags drawn over an image, like a visual card's.
  var openUITagOnImage: Bool {
    get { self[TagOnImageKey.self] }
    set { self[TagOnImageKey.self] = newValue }
  }
}

/// react-ui's tag padding per size: 4/6, 6/8 and 8/12.
func tagPadding(_ size: String?) -> EdgeInsets {
  switch size {
  case "sm": return EdgeInsets(top: 4, leading: 6, bottom: 4, trailing: 6)
  case "lg": return EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12)
  default: return EdgeInsets(top: 6, leading: 8, bottom: 6, trailing: 8)
  }
}

/// react-ui's tag corner radius: 6, or 8 for large tags.
func tagRadius(_ size: String?) -> CGFloat { size == "lg" ? 8 : 6 }
