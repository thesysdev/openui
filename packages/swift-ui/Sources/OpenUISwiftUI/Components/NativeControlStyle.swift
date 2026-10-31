import SwiftUI

#if canImport(UIKit)
    import UIKit
#elseif canImport(AppKit)
    import AppKit
#endif

enum NativeFieldPresentation { case standalone, grouped, inline }
private struct NativeFieldPresentationKey: EnvironmentKey {
    static let defaultValue = NativeFieldPresentation.standalone
}
private struct NativeFormActionsKey: EnvironmentKey { static let defaultValue = false }
/// Containers supply density, while an explicit program size always wins.
/// This is presentation context, independent of labels and business content.
enum NativeActionDensity { case regular, compact }
private struct NativeActionDensityKey: EnvironmentKey {
    static let defaultValue = NativeActionDensity.regular
}
private struct NativeFieldErrorKey: EnvironmentKey { static let defaultValue: String? = nil }
extension EnvironmentValues {
    var openUIActionDensity: NativeActionDensity {
        get { self[NativeActionDensityKey.self] }
        set { self[NativeActionDensityKey.self] = newValue }
    }
    var openUIFieldPresentation: NativeFieldPresentation {
        get { self[NativeFieldPresentationKey.self] }
        set { self[NativeFieldPresentationKey.self] = newValue }
    }
    var openUIFormActions: Bool {
        get { self[NativeFormActionsKey.self] }
        set { self[NativeFormActionsKey.self] = newValue }
    }
    var openUIFieldError: String? {
        get { self[NativeFieldErrorKey.self] }
        set { self[NativeFieldErrorKey.self] = newValue }
    }
}

/// Standalone controls own a quiet surface. Form rows share their parent's
/// surface, so native controls never acquire a second box inside the group.
struct NativeFieldSurface: ViewModifier {
    let theme: OpenUITheme
    var focused = false
    var textEditor = false
    var size: String? = nil
    @Environment(\.isEnabled) private var enabled
    @Environment(\.openUIFieldError) private var error
    @Environment(\.openUIFieldPresentation) private var presentation
    @Environment(\.isFocused) private var keyboardFocused
    @ScaledMetric(relativeTo: .body) private var height: CGFloat = {
        #if os(iOS)
            48
        #else
            32
        #endif
    }()
    private var standalone: Bool { presentation == .standalone }

    private var inlineHeight: CGFloat {
        #if os(iOS)
            44
        #else
            28
        #endif
    }

    private var verticalInset: CGFloat {
        #if os(iOS)
            10
        #else
            6
        #endif
    }
    private var sizeScale: CGFloat {
        #if os(iOS)
            size == "small" ? 44.0 / 48 : size == "large" ? 52.0 / 48 : 1
        #else
            size == "small" ? 28.0 / 32 : size == "large" ? 36.0 / 32 : 1
        #endif
    }

    func body(content: Content) -> some View {
        content.openUIFont(theme.typography.field(size)).foregroundStyle(theme.foreground)
            .padding(.horizontal, standalone ? (textEditor ? 11 : theme.cardPadding) : 0)
            .padding(.vertical, standalone ? verticalInset : 0)
            .frame(minHeight: max(theme.minimumControlTargetSize, standalone ? height * sizeScale : presentation == .inline ? inlineHeight : 0))
            .background(
                standalone ? (enabled ? theme.subtleSurface : theme.surface) : .clear,
                in: RoundedRectangle(cornerRadius: theme.controlCornerRadius, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: theme.controlCornerRadius, style: .continuous)
                    .strokeBorder(
                        standalone ? (error != nil ? theme.error
                            : (focused || keyboardFocused) ? theme.foreground.opacity(0.3) : theme.interactiveBorder) : .clear,
                        lineWidth: theme.cardBorderWidth)
            )
            .opacity(enabled ? 1 : 0.45)
    }
}

struct NativeActionButtonStyle: ButtonStyle {
    let theme: OpenUITheme
    var variant = "primary"
    var size: String? = nil
    var destructive = false
    var iconOnly = false
    var circular = false
    @Environment(\.isEnabled) private var enabled
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.isFocused) private var focused
    @Environment(\.openUIActionDensity) private var density
    @Environment(\.openUIFormActions) private var formActions
    @ScaledMetric(relativeTo: .body) private var unit: CGFloat = 1

    private var accent: Color { destructive ? theme.error : theme.accent }
    private var foreground: Color {
        if !enabled && variant != "primary" { return theme.foreground.opacity(0.2) }
        if variant == "primary" {
            return (!destructive ? theme.accentForeground : nil)
                ?? NativeControlPalette.foreground(on: accent, scheme: scheme)
        }
        return destructive ? theme.error : theme.foreground
    }
    private func background(pressed: Bool) -> Color {
        if variant == "primary" { return accent.opacity(enabled ? 1 : 0.4) }
        if enabled && pressed { return destructive ? theme.error.opacity(0.08) : theme.surface }
        return destructive && variant == "secondary" ? theme.error.opacity(0.02) : .clear
    }
    private var border: Color {
        if variant == "primary" { return accent.opacity(0.08) }
        if variant == "secondary" { return destructive ? theme.error.opacity(0.08) : theme.interactiveBorder }
        return .clear
    }
    private var resolvedSize: String { size ?? (formActions || density == .regular ? "medium" : "small") }
    private var font: OpenUIFont {
        switch resolvedSize {
        case "extra-small": return theme.typography.actionCompact
        case "small": return theme.typography.actionCompact
        case "large": return theme.typography.actionRegular
        default: return theme.typography.actionRegular
        }
    }
    private var horizontalInset: CGFloat {
        if iconOnly { return verticalInset * unit }
        if variant == "tertiary" { return theme.spacing("s") }
        switch resolvedSize {
        case "extra-small": return 8
        case "small": return theme.spacing("m")
        case "large": return theme.spacing("l")
        default: return theme.spacing("ml")
        }
    }
    private var verticalInset: CGFloat {
        switch resolvedSize {
        case "extra-small": return 4.25
        case "small": return 7
        case "large": return 11
        default: return 9
        }
    }
    private var radius: CGFloat {
        circular ? max(theme.controlCornerRadius, minimumHeight) : theme.controlCornerRadius
    }
    private var minimumHeight: CGFloat {
        #if os(iOS)
            return (resolvedSize == "large" ? 48 : resolvedSize == "extra-small" ? 28 : resolvedSize == "small" ? 32 : 40) * unit
        #else
            return (resolvedSize == "large" ? 36 : resolvedSize == "extra-small" ? 24 : resolvedSize == "small" ? 28 : 32) * unit
        #endif
    }
    private var minimumControlTargetSize: CGFloat { theme.minimumControlTargetSize }
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .openUIFont(font)
            .foregroundStyle(foreground).tint(foreground)
            .padding(.horizontal, horizontalInset)
            .padding(.vertical, verticalInset * unit)
            .frame(minWidth: iconOnly ? minimumHeight : nil, minHeight: minimumHeight)
            .background(
                background(pressed: configuration.isPressed), in: RoundedRectangle(cornerRadius: radius, style: .continuous)
            )
            .overlay(RoundedRectangle(cornerRadius: radius, style: .continuous)
                .strokeBorder(border, lineWidth: theme.cardBorderWidth).allowsHitTesting(false))
            .opacity(configuration.isPressed && enabled ? theme.motion.pressedOpacity : 1)
            .scaleEffect(configuration.isPressed && enabled && !reduceMotion ? theme.motion.pressedScale : 1)
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(theme.accent, lineWidth: 2).padding(-3).opacity(focused && enabled ? 1 : 0)
            )
            // Keep a native touch target without inflating the visible capsule.
            .frame(minWidth: minimumControlTargetSize, minHeight: minimumControlTargetSize)
            .contentShape(Rectangle())
            .animation(reduceMotion ? nil : .easeOut(duration: theme.motion.pressDuration), value: configuration.isPressed)
    }
}
