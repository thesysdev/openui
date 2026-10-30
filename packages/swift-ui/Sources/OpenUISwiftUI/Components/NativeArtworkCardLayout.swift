import SwiftUI

/// Photo geometry belongs to the container. Copy can move below the photo,
/// but never changes the photo's aspect or gets clipped to preserve that aspect.
struct NativeArtworkCardMetrics {
  let photo: CGRect
  let copy: CGRect
  let size: CGSize
  let overlaysCopy: Bool

  init(width: CGFloat, aspectRatio: CGFloat, copyHeight: CGFloat, accessibility: Bool) {
    let width = width.isFinite && width > 0 ? width : 1
    let ratio = aspectRatio.isFinite && aspectRatio > 0 ? aspectRatio : 1.5
    let height = copyHeight.isFinite ? max(0, copyHeight) : 0
    let photoHeight = width / ratio
    overlaysCopy = !accessibility && height <= photoHeight + 0.5
    photo = CGRect(x: 0, y: 0, width: width, height: photoHeight)
    copy = CGRect(x: 0, y: overlaysCopy ? 0 : photoHeight,
      width: width, height: overlaysCopy ? photoHeight : height)
    size = CGSize(width: width, height: overlaysCopy ? photoHeight : photoHeight + height)
  }
}

/// Two stable children: the photo and its copy. Reflow changes placement only,
/// preserving the mounted image and its pending resource request.
struct NativeArtworkCardLayout: Layout {
  let aspectRatio: CGFloat
  let fallbackWidth: CGFloat
  let accessibility: Bool

  private func metrics(_ proposal: ProposedViewSize, subviews: Subviews) -> NativeArtworkCardMetrics {
    let width = proposal.width.flatMap { $0.isFinite && $0 > 0 ? $0 : nil } ?? fallbackWidth
    let height = subviews.count > 1
      ? subviews[1].sizeThatFits(ProposedViewSize(width: width, height: nil)).height : 0
    return NativeArtworkCardMetrics(width: width, aspectRatio: aspectRatio,
      copyHeight: height, accessibility: accessibility)
  }
  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    metrics(proposal, subviews: subviews).size
  }
  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    let layout = metrics(ProposedViewSize(width: bounds.width, height: nil), subviews: subviews)
    for (index, frame) in [layout.photo, layout.copy].enumerated() where subviews.indices.contains(index) {
      subviews[index].place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
        anchor: .topLeading, proposal: ProposedViewSize(frame.size))
    }
  }
}
