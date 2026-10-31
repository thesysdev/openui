import SwiftUI

/// A horizontal scroller measures its row with an unspecified width. A plain
/// maxWidth frame can therefore report a one-line height and wrap only during
/// placement. Measure the same label again at its bounded reading width before
/// reporting its height, without mounting a second label or control.
struct NativeBoundedLabelLayout: Layout {
  let maximumWidth: CGFloat
  private func size(_ proposal: ProposedViewSize, _ views: Subviews) -> CGSize {
    guard let label = views.first else { return .zero }
    let ideal = label.sizeThatFits(.unspecified)
    let bound = min(max(1, maximumWidth), proposal.width.flatMap { $0.isFinite ? max(1, $0) : nil } ?? maximumWidth)
    let width = min(ideal.width, bound)
    let measured = label.sizeThatFits(.init(width: width, height: nil))
    return CGSize(width: width, height: measured.height)
  }
  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    size(proposal, subviews)
  }
  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    subviews.first?.place(at: bounds.origin, anchor: .topLeading, proposal: .init(bounds.size))
  }
}

/// Each option contributes a copy-only measuring view followed by its one real
/// button. Measuring text never mounts a second field, image loader or action.
struct NativeChoiceCardsLayout: Layout {
  let minimumWidth: CGFloat
  let gap: CGFloat
  let padding: CGFloat
  let extraCopyHeight: CGFloat
  var singleColumn = false
  var rightToLeft = false

  private func frames(_ proposal: ProposedViewSize, _ views: Subviews) -> [CGRect] {
    let count = views.count / 2
    guard count > 0 else { return [] }
    let width = proposal.width.flatMap { $0.isFinite ? max(1, $0) : nil } ?? minimumWidth
    var columns = singleColumn ? 1 : min(count, max(1, Int((width + gap) / max(1, minimumWidth + gap))))
    let fullCopyWidth = max(1, width - 2 * padding)
    let fullHeights = (0..<count).map { views[$0 * 2].sizeThatFits(.init(width: fullCopyWidth, height: nil)).height }
    while columns > 1 {
      let copyWidth = max(1, (width - CGFloat(columns - 1) * gap) / CGFloat(columns) - 2 * padding)
      let fits = (0..<count).allSatisfy {
        views[$0 * 2].sizeThatFits(.init(width: copyWidth, height: nil)).height <= fullHeights[$0] + extraCopyHeight
      }
      if fits { break }
      columns -= 1
    }
    let cellWidth = max(1, (width - CGFloat(columns - 1) * gap) / CGFloat(columns))
    var result = Array(repeating: CGRect.zero, count: count * 2)
    var y: CGFloat = 0
    for start in stride(from: 0, to: count, by: columns) {
      let end = min(count, start + columns)
      let rowHeight = (start..<end).map {
        views[$0 * 2 + 1].sizeThatFits(.init(width: cellWidth, height: nil)).height
      }.max() ?? 0
      for index in start..<end {
        let column = index - start
        let x = CGFloat(column) * (cellWidth + gap)
        result[index * 2 + 1] = CGRect(x: rightToLeft ? width - x - cellWidth : x,
          y: y, width: cellWidth, height: rowHeight)
      }
      y += rowHeight + gap
    }
    return result
  }
  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let frames = frames(proposal, subviews)
    return CGSize(width: frames.map(\.maxX).max() ?? 0, height: frames.map(\.maxY).max() ?? 0)
  }
  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    for (index, frame) in frames(.init(width: bounds.width, height: nil), subviews).enumerated() {
      subviews[index].place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
        anchor: .topLeading, proposal: .init(frame.size))
    }
  }
}

/// The same buttons stay mounted when their complete labels need a column.
struct NativeButtonsLayout: Layout {
  var column = false
  var rightToLeft = false
  var rowGap: CGFloat = 12
  var columnGap: CGFloat = 8
  private func frames(_ proposal: ProposedViewSize, _ views: Subviews) -> [CGRect] {
    guard !views.isEmpty else { return [] }
    let ideal = views.map { $0.sizeThatFits(.unspecified) }
    let idealWidth = ideal.reduce(CGFloat.zero) { $0 + $1.width } + rowGap * CGFloat(views.count - 1)
    let width = proposal.width.flatMap { $0.isFinite ? max(1, $0) : nil } ?? idealWidth
    let stacked = column || idealWidth > width + 0.5
    let sizes = views.indices.map {
      views[$0].sizeThatFits(.init(width: min(width, ideal[$0].width), height: nil))
    }
    let rowHeight = sizes.map(\.height).max() ?? 0
    var offset: CGFloat = 0
    return sizes.map { size in
      let x = stacked ? 0 : offset
      let result = CGRect(x: rightToLeft ? width - x - size.width : x,
        y: stacked ? offset : (rowHeight - size.height) / 2, width: size.width, height: size.height)
      offset += stacked ? size.height + columnGap : size.width + rowGap
      return result
    }
  }
  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let frames = frames(proposal, subviews)
    return CGSize(width: frames.map(\.maxX).max() ?? 0, height: frames.map(\.maxY).max() ?? 0)
  }
  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    for (view, frame) in zip(subviews, frames(.init(width: bounds.width, height: nil), subviews)) {
      view.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
        anchor: .topLeading, proposal: .init(frame.size))
    }
  }
}

/// Equal reading columns balance the last legend row without reducing targets.
struct NativeChartLegendLayout: Layout {
  var gap: CGFloat = 16
  var rightToLeft = false
  private func frames(_ proposal: ProposedViewSize, _ views: Subviews) -> [CGRect] {
    guard !views.isEmpty else { return [] }
    let ideal = views.map { $0.sizeThatFits(.unspecified) }
    let minimum = max(1, ideal.map(\.width).max() ?? 1)
    let width = proposal.width.flatMap { $0.isFinite ? max(1, $0) : nil } ?? minimum
    let capacity = min(views.count, max(1, Int((width + gap) / (minimum + gap))))
    let rows = Int(ceil(Double(views.count) / Double(capacity)))
    let columns = Int(ceil(Double(views.count) / Double(rows)))
    let cellWidth = max(1, (width - CGFloat(columns - 1) * gap) / CGFloat(columns))
    var result = Array(repeating: CGRect.zero, count: views.count)
    var y: CGFloat = 0
    for start in stride(from: 0, to: views.count, by: columns) {
      let end = min(views.count, start + columns)
      let sizes = (start..<end).map { views[$0].sizeThatFits(.init(width: cellWidth, height: nil)) }
      let height = sizes.map(\.height).max() ?? 0
      for index in start..<end {
        let x = CGFloat(index - start) * (cellWidth + gap)
        result[index] = CGRect(x: rightToLeft ? width - x - cellWidth : x,
          y: y, width: cellWidth, height: height)
      }
      y += height
    }
    return result
  }
  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let frames = frames(proposal, subviews)
    return CGSize(width: frames.map(\.maxX).max() ?? 0, height: frames.map(\.maxY).max() ?? 0)
  }
  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    for (view, frame) in zip(subviews, frames(.init(width: bounds.width, height: nil), subviews)) {
      view.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
        anchor: .topLeading, proposal: .init(frame.size))
    }
  }
}
