import SwiftUI

struct NativeTableSkeleton: View {
  let columns: Int
  @Environment(\.openUITheme) private var theme
  var body: some View {
    VStack(spacing: theme.spacing("ml")) {
      ForEach(0..<5, id: \.self) { _ in
        HStack(spacing: theme.spacing("ml")) {
          ForEach(0..<max(3, columns), id: \.self) { _ in
            RoundedRectangle(cornerRadius: 4).fill(theme.textNeutralSecondary.opacity(0.12)).frame(height: 16)
          }
        }
      }
    }.padding(.vertical, theme.spacing("m")).frame(maxWidth: .infinity)
      .accessibilityElement(children: .ignore)
      .accessibilityLabel(Text("Loading data", bundle: NativeControlResources.bundle))
      .accessibilityIdentifier("openui.table.loading")
  }
}

struct NativePieSkeleton: View {
  let donut: Bool
  let semi: Bool
  @Environment(\.openUITheme) private var theme
  var body: some View {
    Circle().trim(from: semi ? 0.5 : 0, to: 1)
      .stroke(theme.textNeutralSecondary.opacity(0.12), lineWidth: donut ? 28 : 70)
      .padding(40).frame(height: semi ? 150 : 250)
      .accessibilityElement(children: .ignore)
      .accessibilityLabel(Text("Loading data", bundle: NativeControlResources.bundle))
      .accessibilityIdentifier("openui.chart.loading")
  }
}

/// A resource state, not a generated component. The clipped light band changes
/// only drawing, never the media slot's dimensions or the containing card.
struct NativeMediaSkeleton: View {
    @Environment(\.openUIPresentation) private var nativePresentation

  @Environment(\.openUITheme) private var theme
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.layoutDirection) private var direction
  @State private var sweeping = false

  var body: some View {
    GeometryReader { geometry in
      ZStack {
        theme.sunk
        theme.textNeutralSecondary.opacity(0.035)
        if geometry.size.width >= 64 && geometry.size.height >= 48 {
          Image(systemName: "photo")
            .openUIFont(theme.textBodyDefault)
            .foregroundStyle(theme.textNeutralSecondary.opacity(0.22))
        }
        if !reduceMotion {
          LinearGradient(colors: [.clear, .white.opacity(colorScheme == .dark ? 0.10 : 0.55), .clear],
            startPoint: .leading, endPoint: .trailing)
            .frame(width: geometry.size.width * 0.55)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .offset(x: (sweeping ? 1.1 : -0.65) * geometry.size.width
              * (direction == .rightToLeft ? -1 : 1))
            .animation(.linear(duration: nativePresentation.motion.loadingShimmerDuration)
              .repeatForever(autoreverses: false), value: sweeping)
        }
      }
    }
    .allowsHitTesting(false).accessibilityHidden(true)
    .onAppear { sweeping = true }
    .onDisappear { sweeping = false }
  }
}

/// Only image opacity animates. A successful download never animates the
/// parent layout, the crop, or the dimensions of its neighboring text.
struct NativeMediaReveal: ViewModifier {
    @Environment(\.openUIPresentation) private var nativePresentation

  var enabled = true
  @Environment(\.openUITheme) private var theme
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @State private var visible = false
  func body(content: Content) -> some View {
    ZStack {
      theme.sunk.opacity(visible || !enabled ? 0 : 1)
      content.opacity(visible || !enabled ? 1 : 0)
    }
      .onAppear {
        withAnimation(reduceMotion ? nil : .easeOut(duration: nativePresentation.motion.mediaRevealDuration)) {
          visible = true
        }
      }
  }
}
