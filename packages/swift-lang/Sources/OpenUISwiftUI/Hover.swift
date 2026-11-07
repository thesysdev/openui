import SwiftUI

private struct HoveredKey: EnvironmentKey {
  static let defaultValue = false
}

extension EnvironmentValues {
  /// Whether a pointer is over the button this view is the label of (on the
  /// Mac, and on iPad with a pointer; never for touch). Labels use it for
  /// react-ui's hover state, which differs per control: chips fill in, option
  /// cards' borders darken, list markers grow.
  var openUIHovered: Bool {
    get { self[HoveredKey.self] }
    set { self[HoveredKey.self] = newValue }
  }
}

/// A plain button that tells its label when the pointer is over it, through
/// `openUIHovered`. With `sinks`, it's react-ui's clickable card: it sinks a
/// little under the pointer (scale 0.995) and more while pressed; otherwise it
/// dims while pressed, as the plain style does.
struct HoverButtonStyle: ButtonStyle {
  var sinks = false

  func makeBody(configuration: Configuration) -> some View {
    HoverLabel(configuration: configuration, sinks: sinks)
  }

  private struct HoverLabel: View {
    let configuration: Configuration
    let sinks: Bool
    @State private var hovering = false
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
      let hovered = hovering && isEnabled
      let pressed = configuration.isPressed
      configuration.label
        .environment(\.openUIHovered, hovered)
        .scaleEffect(sinks && !reduceMotion ? (pressed ? 0.98 : hovered ? 0.995 : 1) : 1)
        .opacity(!sinks && pressed ? 0.6 : 1)
        .onHover { hovering = $0 }
        .animation(.easeOut(duration: 0.15), value: hovered)
        .animation(.easeOut(duration: 0.1), value: pressed)
    }
  }
}

extension ButtonStyle where Self == HoverButtonStyle {
  /// A plain button whose label sees pointer hover (`openUIHovered`).
  static var openUIHover: HoverButtonStyle { HoverButtonStyle() }
  /// react-ui's clickable card: sinks a little under the pointer.
  static var openUICard: HoverButtonStyle { HoverButtonStyle(sinks: true) }
}

/// Reads `openUIHovered` for a label built inline in a button.
struct Hovering<Content: View>: View {
  @ViewBuilder let content: (Bool) -> Content
  @Environment(\.openUIHovered) private var hovered

  var body: some View { content(hovered) }
}
