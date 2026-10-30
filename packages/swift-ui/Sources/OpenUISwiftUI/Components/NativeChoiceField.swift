import OpenUILang
import SwiftUI

/// Presentation state mapping for upstream selectionFieldUtils. Field storage,
/// validation and submission remain the existing shared runtime adapters.
enum NativeChoiceSelection {
  static func isSingle(_ context: OpenUIComponentContext) -> Bool {
    (context.string("type") ?? (context.element.typeName == "Chips" ? "multiple" : "single"))
      == "single"
  }
  static func values(_ value: Value) -> [OpenUIString] {
    switch value {
    case .string(let text): return text.isEmpty ? [] : [text]
    case .array(let array):
      return array.compactMap {
        if case .string(let text) = $0 { return text }
        return nil
      }
    default: return []
    }
  }
  static func stored(_ values: [OpenUIString], single: Bool) -> Value {
    if single { return values.first.flatMap { $0.isEmpty ? nil : Value.string($0) } ?? .undefined }
    return .array(values.map(Value.string))
  }
  static func toggle(_ key: OpenUIString, value: Value, single: Bool) -> Value {
    let selection = single ? Array(values(value).prefix(1)) : values(value)
    let next =
      single
      ? (selection.first == key ? [] : [key])
      : selection.contains(key) ? selection.filter { $0 != key } : selection + [key]
    return stored(next, single: single)
  }
}

struct NativeChoiceField: View {
  let context: OpenUIComponentContext
  let cards: Bool
  @EnvironmentObject private var state: OpenUIState
  @Environment(\.dynamicTypeSize) private var typeSize
  @Environment(\.layoutDirection) private var direction
  @ScaledMetric(relativeTo: .body) private var textScale: CGFloat = 1
  private var field: NativeFieldState { NativeFieldState(context: context) }
  private var selection: [OpenUIString] { NativeChoiceSelection.values(field.value) }
  var body: some View {
    Group {
      if cards {
        NativeChoiceCardsLayout(minimumWidth: context.theme.minimumChoiceWidth * textScale,
          gap: context.theme.spacing("m"), padding: context.theme.spacing("sm"),
          extraCopyHeight: context.theme.typography.resolve(context.theme.typography.body).size * textScale * 1.35,
          singleColumn: typeSize.isAccessibilitySize, rightToLeft: direction == .rightToLeft) { options }
      } else {
        NativeWrappingRow(gap: context.theme.spacing("s")) { options }
      }
    }.frame(maxWidth: .infinity, alignment: .leading).fixedSize(horizontal: false, vertical: true)
  }
  private var options: some View {
    ForEach(Array(field.options.enumerated()), id: \.offset) { _, item in
      if let key = PropValue.codeUnitString(item, "value"), !key.isEmpty {
        let selected = selection.contains(key)
        if cards {
          // Only text/symbols participate in density measurement. topContent
          // may own media or state and belongs exclusively to the real button.
          cardCopy(item, selected: selected).hidden().allowsHitTesting(false).accessibilityHidden(true)
        }
        Button {
          guard PropValue.value(item, "disabled") != .boolean(true) else { return }
          field.write(
            NativeChoiceSelection.toggle(
              key, value: field.value, single: NativeChoiceSelection.isSingle(context)))
        } label: {
          choice(item, selected: selected).openUIControlTarget(alignment: .leading)
        }.buttonStyle(.plain).disabled(
          !context.canInteract || PropValue.value(item, "disabled") == .boolean(true)
        )
        .accessibilityLabel(PropValue.string(item, cards ? "title" : "label") ?? key.displayString)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier("openui.choice.\(field.name.displayString).\(key.displayString)")
      }
    }
  }
  private func choice(_ item: EvaluatedElement, selected: Bool) -> some View {
    VStack(alignment: .leading, spacing: context.theme.spacing("m")) {
      if cards { context.render(PropValue.value(item, "topContent") ?? .null) }
      cardCopy(item, selected: selected)
    }.padding(.horizontal, context.theme.spacing(cards ? "sm" : "s"))
    .padding(.vertical, context.theme.spacing(cards ? "sm" : "xs")).frame(
      maxWidth: cards ? .infinity : nil, maxHeight: cards ? .infinity : nil, alignment: .topLeading
    )
    .background(
      selected ? context.theme.surface : .clear,
      in: RoundedRectangle(cornerRadius: choiceRadius)
    )
    .overlay(
      RoundedRectangle(cornerRadius: choiceRadius).strokeBorder(
        selected ? context.theme.foreground : context.theme.interactiveBorder, lineWidth: context.theme.cardBorderWidth))
    .opacity(PropValue.value(item, "disabled") == .boolean(true) || !context.canInteract ? 0.5 : 1)
  }
  private var choiceRadius: CGFloat { max(0, context.theme.controlCornerRadius + (cards ? 4 : -2)) }
  private func cardCopy(_ item: EvaluatedElement, selected: Bool) -> some View {
    VStack(alignment: .leading, spacing: context.theme.spacing("3xs")) {
      HStack(spacing: context.theme.spacing("xs")) {
        if !cards { context.render(PropValue.value(item, "icon") ?? .null) }
        Text(PropValue.string(item, cards ? "title" : "label") ?? "").openUIFont(
          context.theme.typography.body.weight(cards || selected ? .medium : .regular)
        )
        .fixedSize(horizontal: false, vertical: true)
        if cards {
          Spacer(minLength: 4)
          Image(systemName: selected ? "checkmark.circle.fill" : "circle").foregroundStyle(
            selected ? context.theme.foreground : context.theme.secondary)
        }
      }
      if cards, let subtitle = PropValue.string(item, "subtitle") {
        Text(subtitle).openUIFont(context.theme.typography.detail).foregroundStyle(context.theme.secondary)
          .fixedSize(horizontal: false, vertical: true)
      }
    }
  }
}
