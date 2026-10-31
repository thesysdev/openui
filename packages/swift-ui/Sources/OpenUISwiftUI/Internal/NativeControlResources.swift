import SwiftUI

#if canImport(UIKit)
    import UIKit
#elseif canImport(AppKit)
    import AppKit
#endif

enum NativeControlResources {
    static let bundle = resolve(in: .main) { .module }

    static func resolve(in host: Bundle, fallback: () -> Bundle) -> Bundle {
        if let resources = host.resourceURL {
            for name in ["openui_OpenUISwiftUI.bundle", "swift-ui_OpenUISwiftUI.bundle"] {
                if let embedded = Bundle(url: resources.appendingPathComponent(name)) {
                    return embedded
                }
            }
        }
        return fallback()
    }
}

/// Foundation's ordinary bundle lookup follows process language. Controls use
/// the nearest SwiftUI locale, including embedded and preview subtrees.
enum NativeControlText {
    static func localized(_ key: String, locale: Locale) -> String {
        let resources = NativeControlResources.bundle
        let language =
            Bundle.preferredLocalizations(
                from: resources.localizations, forPreferences: [locale.identifier]
            ).first ?? "en"
        let localizedBundle =
            resources.path(forResource: language, ofType: "lproj").flatMap(Bundle.init(path:)) ?? resources
        return localizedBundle.localizedString(forKey: key, value: key, table: nil)
    }
}

