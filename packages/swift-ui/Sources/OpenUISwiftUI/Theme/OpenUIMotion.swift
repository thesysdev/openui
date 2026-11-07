import SwiftUI

/// Shared feedback timing. Views still honor the nearest Reduce Motion setting.
public struct OpenUIMotion {
    public var pressDuration: Double = 0.12
    public var pressedOpacity: Double = 0.82
    public var pressedScale: CGFloat = 0.985
    public var pagingResponse: Double = 0.32
    public var pagingDamping: Double = 0.86
    public var loadingShimmerDuration: Double = 1.6
    public var mediaRevealDuration: Double = 0.18
    public init() {}
}

