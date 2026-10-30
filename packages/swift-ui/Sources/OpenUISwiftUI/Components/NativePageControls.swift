import SwiftUI

struct NativePageControls: View {
  @Environment(\.openUITheme) private var theme
  let page: Int
  let count: Int
  let enabled: Bool
  let identifier: String
  let select: (Int) -> Void
  var body: some View {
    HStack(spacing: theme.spacing("s")) {
      Spacer(minLength: 0)
      Button { select(page - 1) } label: {
        Image(systemName: "chevron.left").openUIFont(theme.typography.actionRegular).openUIControlTarget()
      }
      .accessibilityLabel(Text("Previous page", bundle: NativeControlResources.bundle))
      .accessibilityIdentifier(identifier + ".previous")
      .disabled(!enabled || page <= 0)
      Text("\(page + 1) / \(count)").openUIFont(theme.typography.caption).monospacedDigit()
        .accessibilityIdentifier(identifier + ".page")
      Button { select(page + 1) } label: {
        Image(systemName: "chevron.right").openUIFont(theme.typography.actionRegular).openUIControlTarget()
      }
      .accessibilityLabel(Text("Next page", bundle: NativeControlResources.bundle))
      .accessibilityIdentifier(identifier + ".next")
      .disabled(!enabled || page >= count - 1)
    }.buttonStyle(.plain)
  }
}
