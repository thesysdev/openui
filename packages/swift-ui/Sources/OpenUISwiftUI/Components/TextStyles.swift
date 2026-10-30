import SwiftUI

// Official text-size variants select semantic roles; theme values stay independent.
struct NativeRichTextStyle {
  var font: OpenUIFont?
  var numeric = false
  var color: Color?
  static func textContent(_ size: String?, theme: OpenUITheme) -> Self {
    let font: OpenUIFont?
    switch size {
    case "small": font = theme.typography.detail
    case "small-heavy": font = theme.typography.detailHeavy
    case "large": font = theme.typography.bodyLarge
    case "large-heavy": font = theme.typography.bodyLargeHeavy
    case "default": font = theme.typography.body
    default: font = nil
    }
    // Size variants select a reading scale, not an information-priority color.
    return .init(font: font, color: theme.foreground)
  }
}

