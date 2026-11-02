import SwiftUI

/// Native presentation policy. These values are not OpenUI Lang parameters or React theme tokens.
public struct OpenUIPresentation {
    static let defaults = OpenUIPresentation()
    public var motion = OpenUIMotion()
    #if os(iOS)
    public var minimumControlTargetSize: CGFloat = 44
    #else
    public var minimumControlTargetSize: CGFloat = 24
    #endif
    public var thumbnailSize: CGFloat = 112
    public var compactThumbnailSize: CGFloat = 80
    public var inlineThumbnailSize: CGFloat = 40
    public var minimumTextColumnWidth: CGFloat = 160
    public var coverAspectRatio: CGFloat = 3 / 2
    public var maximumCarouselCardWidth: CGFloat = 320
    public var carouselPeek: CGFloat = 32
    public var borderWidth: CGFloat = 1
    public var minimumCardWidth: CGFloat = 240
    public var minimumCompactCardWidth: CGFloat = 160
    public var minimumChoiceWidth: CGFloat = 136
    public var chartGrid = NativeControlPalette.adaptive(light: 0xE8EAEE, dark: 0x34373C)
    public var chartAxis = NativeControlPalette.adaptive(light: 0x6A6F78, dark: 0xB4BBC6)
    // One shared thickness for drawing and sizing a single distribution strip.
    // This is native geometry, not a new model-facing style parameter.
    var singleStackedBarThickness: CGFloat = 28
    public init() {}
}
