import SwiftUI

/// Ordered categorical colors. Growing a chart adds colors without recoloring
/// existing series; filtering uses the original series indices.
enum NativeChartPalette {
  struct Swatch: Equatable {
    let light: UInt32
    let dark: UInt32
    var color: Color { NativeControlPalette.adaptive(light: light, dark: dark) }
  }

  // Chart-only colors: mineral, clay and ink-like tones. This order keeps
  // neighboring series distinct without using primary RGB hues.
  private static let base: [Swatch] = [
    .init(light: 0x476F72, dark: 0x9EC8C4), // mineral petrol
    .init(light: 0xAD7055, dark: 0xE9B499), // fired clay
    .init(light: 0x896D89, dark: 0xD0B1CE), // ink plum
    .init(light: 0x917846, dark: 0xDCC590), // antique brass
    .init(light: 0x5D7D68, dark: 0xABCCB8), // sage
    .init(light: 0x627798, dark: 0xA9BEDC), // blue slate
    .init(light: 0xA16C79, dark: 0xDBAFBC), // dry rose
    .init(light: 0x796F67, dark: 0xCBBEAF), // warm stone
    .init(light: 0xA3644A, dark: 0xDCA98C), // cedar
    .init(light: 0x4D7267, dark: 0x96BFAF), // deep pine
    .init(light: 0x786B93, dark: 0xBEAED7), // violet ash
    .init(light: 0x947C39, dark: 0xDDC783), // aged gold
  ]

  static func swatches(count: Int) -> [Swatch] {
    (0..<max(1, count)).map { index in
      if index < base.count { return base[index] }
      let seed = base[index % base.count]
      let level = index / base.count
      let retained = pow(0.82, Double(level))
      return Swatch(light: tone(seed.light, retained: retained, towardWhite: false),
        dark: tone(seed.dark, retained: retained, towardWhite: true))
    }
  }

  private static func tone(_ hex: UInt32, retained: Double, towardWhite: Bool) -> UInt32 {
    let target = towardWhite ? 255.0 : 0.0
    let red = Double((hex >> 16) & 255)
    let green = Double((hex >> 8) & 255)
    let blue = Double(hex & 255)
    func channel(_ value: Double) -> UInt32 { UInt32((target + (value - target) * retained).rounded()) }
    return channel(red) << 16 | channel(green) << 8 | channel(blue)
  }
}
