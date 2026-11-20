import Charts
import SwiftUI

/// The motion react-ui uses while a response streams in, so both renderers
/// feel the same. Everything here is skipped when Reduce Motion is on.
enum Motion {
  /// react-ui's `dataMorph` spring (stiffness 480, damping 44): chart values
  /// glide to their new positions as more data streams in.
  static let dataMorph = Animation.interpolatingSpring(mass: 1, stiffness: 480, damping: 44)

  /// How a newly streamed part of the response appears.
  static let insertion = Animation.easeOut(duration: 0.25)

  /// A tab, accordion or section changing what it shows.
  static let reveal = Animation.easeInOut(duration: 0.2)
}

extension AnyTransition {
  /// Newly streamed nodes fade in and settle up a few points; removed ones fade out.
  static var openUIInsertion: AnyTransition {
    .asymmetric(insertion: .opacity.combined(with: .offset(y: 6)), removal: .opacity)
  }
}

extension View {
  /// Animates changes to `value` unless Reduce Motion is on.
  func openUIAnimation<V: Equatable>(_ animation: Animation, value: V) -> some View {
    modifier(MotionAnimation(animation: animation, value: value))
  }
}

private struct MotionAnimation<V: Equatable>: ViewModifier {
  let animation: Animation
  let value: V
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  func body(content: Content) -> some View {
    content.animation(reduceMotion ? nil : animation, value: value)
  }
}

/// Runs `change` with `animation`, or without one when Reduce Motion is on.
@MainActor
func withOpenUIAnimation(_ animation: Animation, _ change: () -> Void) {
  #if canImport(UIKit)
    let reduceMotion = UIAccessibility.isReduceMotionEnabled
  #else
    let reduceMotion = NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
  #endif
  if reduceMotion { change() } else { withAnimation(animation, change) }
}

/// A pulsing placeholder, like react-ui's skeleton bar: 30% to 85% opacity
/// and back every 1.2 seconds.
struct SkeletonBlock: View {
  var height: CGFloat
  var cornerRadius: CGFloat = 6
  @State private var bright = false
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  var body: some View {
    RoundedRectangle(cornerRadius: cornerRadius)
      .fill(Color.primary.opacity(0.08))
      .frame(maxWidth: .infinity)
      .frame(height: height)
      .opacity(reduceMotion ? 0.6 : (bright ? 0.85 : 0.3))
      .onAppear {
        guard !reduceMotion else { return }
        withAnimation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true)) { bright = true }
      }
      .accessibilityHidden(true)
  }
}

/// A chart's entrance, like react-ui's: bars grow up from the axis over 0.6s,
/// lines and areas draw from left to right over 1s.
struct ChartEntrance: ViewModifier {
  enum Style {
    case grow, growSideways, draw
  }

  let style: Style
  @State private var progress: CGFloat = 0
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  func body(content: Content) -> some View {
    content
      .chartPlotStyle { plot in
        plot.mask {
          Rectangle().scaleEffect(
            x: style == .grow ? 1 : progress, y: style == .grow ? progress : 1,
            anchor: style == .grow ? .bottom : .leading)
        }
      }
      .onAppear {
        guard progress == 0 else { return }
        if reduceMotion {
          progress = 1
        } else {
          withAnimation(.easeOut(duration: style == .draw ? 1 : 0.6)) { progress = 1 }
        }
      }
  }
}

extension View {
  func chartEntrance(_ style: ChartEntrance.Style) -> some View {
    modifier(ChartEntrance(style: style))
  }
}

/// react-ui's fade-appear entrance (0.6s) for charts that don't grow or draw:
/// pie, radial, radar and scatter.
private struct FadeAppear: ViewModifier {
  @State private var visible = false
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  func body(content: Content) -> some View {
    content
      .opacity(visible || reduceMotion ? 1 : 0)
      .onAppear {
        guard !visible else { return }
        withAnimation(.easeOut(duration: 0.6)) { visible = true }
      }
  }
}

extension View {
  func fadeAppear() -> some View { modifier(FadeAppear()) }
}
