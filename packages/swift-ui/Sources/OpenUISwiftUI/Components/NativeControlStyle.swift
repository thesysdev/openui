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
    @Environment(\.openUIPresentation) private var nativePresentation

    let theme: OpenUIThemeValues
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
        content.openUIFont(theme.fieldFont(size)).foregroundStyle(theme.textNeutralPrimary)
            .padding(.horizontal, standalone ? (textEditor ? 11 : theme.spaceM) : 0)
            .padding(.vertical, standalone ? verticalInset : 0)
            .frame(minHeight: max(nativePresentation.minimumControlTargetSize, standalone ? height * sizeScale : presentation == .inline ? inlineHeight : 0))
            .background(
                standalone ? (enabled ? theme.sunkLight : theme.sunk) : .clear,
                in: RoundedRectangle(cornerRadius: theme.radiusL, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: theme.radiusL, style: .continuous)
                    .strokeBorder(
                        standalone ? (error != nil ? theme.textDangerPrimary
                            : (focused || keyboardFocused) ? theme.textNeutralPrimary.opacity(0.3) : theme.borderInteractive) : .clear,
                        lineWidth: nativePresentation.borderWidth)
            )
            .opacity(enabled ? 1 : 0.45)
    }
}

struct NativeActionButtonStyle: ButtonStyle {
    @Environment(\.openUIPresentation) private var nativePresentation

    let theme: OpenUIThemeValues
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
    @State private var hovered = false
    @ScaledMetric(relativeTo: .body) private var unit: CGFloat = 1

    private var accent: Color { destructive ? theme.interactiveDestructiveAccentDefault : theme.interactiveAccentDefault }
    private var foreground: Color {
        if !enabled && variant != "primary" {
            return destructive ? theme.textDangerTertiary : theme.textNeutralTertiary
        }
        if variant == "primary" {
            return (destructive ? theme.textDangerInvertedPrimary : theme.textAccentPrimary)
                ?? NativeControlPalette.foreground(on: accent, scheme: scheme)
        }
        return destructive ? theme.textDangerPrimary : theme.textNeutralPrimary
    }
    private func background(pressed: Bool) -> Color {
        if variant == "primary" {
            if !enabled { return destructive ? theme.interactiveDestructiveAccentDisabled : theme.interactiveAccentDisabled }
            if pressed { return destructive ? theme.interactiveDestructiveAccentPressed : theme.interactiveAccentPressed }
            if hovered { return destructive ? theme.interactiveDestructiveAccentHover : theme.interactiveAccentHover }
            return accent
        }
        if destructive {
            if !enabled { return variant == "secondary" ? theme.interactiveDestructiveDisabled : .clear }
            if pressed { return theme.interactiveDestructivePressed }
            if hovered { return theme.interactiveDestructiveHover }
            return variant == "secondary" ? theme.interactiveDestructiveDefault : .clear
        }
        return enabled && (pressed || hovered) ? theme.highlight : .clear
    }
    private var border: Color {
        if variant == "primary" { return theme.borderAccent }
        if variant == "secondary" { return destructive ? theme.borderDanger : theme.borderInteractive }
        return .clear
    }
    private var resolvedSize: String { size ?? (formActions || density == .regular ? "medium" : "small") }
    private var font: OpenUIFont {
        switch resolvedSize {
        case "extra-small": return theme.textLabelSmHeavy
        case "small": return theme.textLabelSmHeavy
        case "large": return theme.textLabelDefaultHeavy
        default: return theme.textLabelDefaultHeavy
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
        circular ? max(theme.radiusL, minimumHeight) : theme.radiusL
    }
    private var minimumHeight: CGFloat {
        #if os(iOS)
            return (resolvedSize == "large" ? 48 : resolvedSize == "extra-small" ? 28 : resolvedSize == "small" ? 32 : 40) * unit
        #else
            return (resolvedSize == "large" ? 36 : resolvedSize == "extra-small" ? 24 : resolvedSize == "small" ? 28 : 32) * unit
        #endif
    }
    private var minimumControlTargetSize: CGFloat { nativePresentation.minimumControlTargetSize }
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
                .strokeBorder(border, lineWidth: nativePresentation.borderWidth).allowsHitTesting(false))
            .opacity(configuration.isPressed && enabled ? nativePresentation.motion.pressedOpacity : 1)
            .scaleEffect(configuration.isPressed && enabled && !reduceMotion ? nativePresentation.motion.pressedScale : 1)
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(theme.interactiveAccentDefault, lineWidth: 2).padding(-3).opacity(focused && enabled ? 1 : 0)
            )
            // Keep a native touch target without inflating the visible capsule.
            .frame(minWidth: minimumControlTargetSize, minHeight: minimumControlTargetSize)
            .contentShape(Rectangle())
            .onHover { hovered = $0 }
            .animation(reduceMotion ? nil : .easeOut(duration: nativePresentation.motion.pressDuration), value: configuration.isPressed)
    }
}
