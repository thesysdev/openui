import SwiftUI

#if canImport(UIKit)
    import UIKit
#elseif canImport(AppKit)
    import AppKit
#endif

enum NativeControlPalette {
    // Converted from the pinned reference's blue/green/yellow/red swatches.
    static var info: Color { adaptive(light: 0x1E40AF, dark: 0x93C5FD) }
    static var success: Color { adaptive(light: 0x166534, dark: 0x86EFAC) }
    static var warning: Color { adaptive(light: 0x854D0F, dark: 0xFDE046) }
    static func adaptive(light: UInt32, dark: UInt32) -> Color {
        func channels(_ hex: UInt32) -> (CGFloat, CGFloat, CGFloat) {
            (CGFloat((hex >> 16) & 255) / 255, CGFloat((hex >> 8) & 255) / 255, CGFloat(hex & 255) / 255)
        }
        #if canImport(UIKit)
            return Color(uiColor: UIColor { traits in
                let (r, g, b) = channels(traits.userInterfaceStyle == .dark ? dark : light)
                return UIColor(red: r, green: g, blue: b, alpha: 1)
            })
        #elseif canImport(AppKit)
            return Color(nsColor: NSColor(name: nil) { appearance in
                let (r, g, b) = channels(appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? dark : light)
                return NSColor(srgbRed: r, green: g, blue: b, alpha: 1)
            })
        #else
            let (r, g, b) = channels(light)
            return Color(red: Double(r), green: Double(g), blue: Double(b))
        #endif
    }
    // Resolve independently of a Button label's foreground style. Color.primary
    // can inherit that style when reused as a tint or background inside a sheet.
    static var ink: Color {
        #if canImport(UIKit)
            Color(uiColor: .label)
        #elseif canImport(AppKit)
            Color(nsColor: .labelColor)
        #else
            Color.primary
        #endif
    }
    static var error: Color { adaptive(light: 0xB91C1C, dark: 0xFCA5A5) }
    static func foreground(on color: Color, scheme: ColorScheme) -> Color {
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 1
        #if canImport(UIKit)
            let traits = UITraitCollection(userInterfaceStyle: scheme == .dark ? .dark : .light)
            guard
                UIColor(color).resolvedColor(with: traits).getRed(
                    &red, green: &green, blue: &blue, alpha: &alpha)
            else { return .white }
        #elseif canImport(AppKit)
            var resolved: NSColor?
            NSAppearance(named: scheme == .dark ? .darkAqua : .aqua)?.performAsCurrentDrawingAppearance {
                resolved = NSColor(color).usingColorSpace(.sRGB)
            }
            guard let resolved else { return .white }
            resolved.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
        #endif
        let background: CGFloat = scheme == .dark ? 0.11 : 1
        let components = [red, green, blue].map { Double($0 * alpha + background * (1 - alpha)) }
        return prefersDarkForeground(red: components[0], green: components[1], blue: components[2])
            ? .black : .white
    }

    static func prefersDarkForeground(red: Double, green: Double, blue: Double) -> Bool {
        func linear(_ value: Double) -> Double {
            value <= 0.04045 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4)
        }
        let luminance = 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
        return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05)
    }
}

