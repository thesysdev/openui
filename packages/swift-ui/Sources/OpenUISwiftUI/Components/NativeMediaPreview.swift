import Foundation

/// Source-proportional geometry. Unknown or invalid source sizes use a loading
/// placeholder ratio; valid images do not acquire a private aspect-ratio limit.
enum NativeMediaPreview {
  static func aspectRatio(sourceSize: CGSize?) -> CGFloat {
    guard let size = sourceSize, size.width.isFinite, size.height.isFinite,
      size.width > 0, size.height > 0 else { return 4 / 3 }
    let ratio = size.width / size.height
    guard ratio.isFinite, ratio > 0 else { return 4 / 3 }
    return ratio
  }
}
