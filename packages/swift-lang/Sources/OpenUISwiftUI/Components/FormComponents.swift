import OpenUILang
import SwiftUI

// MARK: - Form

struct FormView: View {
  let props: ComponentProps
  @State private var validation = FormValidation()
  @Environment(\.openUITheme) private var theme

  var body: some View {
    VStack(alignment: .leading, spacing: theme.spacing + 4) {
      OpenUINode(props["fields"])
      OpenUINode(props["buttons"])
    }
    .environment(\.openUIFormName, props.string("name"))
    .environment(validation)
  }
}

struct FormControlView: View {
  let props: ComponentProps
  @Environment(FormValidation.self) private var validation: FormValidation?
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let input = props.children("input").first
    let fieldName = input?.string("name")
    let required = input?["rules"]["required"] == true
    VStack(alignment: .leading, spacing: 6) {
      Text(props.text("label") + (required ? "*" : "")).font(.subheadline.weight(.medium))
      OpenUINode(props["input"])
      if let fieldName, let error = validation?.error(for: fieldName) {
        Label(error, systemImage: "exclamationmark.circle").font(.caption).foregroundStyle(
          theme.danger)
      } else if let hint = props.string("hint"), !hint.isEmpty {
        Text(hint).font(.caption).foregroundStyle(.secondary)
      }
    }
  }
}

struct LabelView: View {
  let props: ComponentProps

  var body: some View {
    Text(props.text("text")).font(.subheadline.weight(.medium))
  }
}

/// The field a form component reads and writes, plus its validation rules.
private struct FieldContext {
  let field: StateField
  let rules: [ParsedRule]

  @MainActor
  init(_ props: ComponentProps, context: OpenUIContext, form: String?) {
    self.field = context.stateField(name: props.text("name"), binding: props["value"], form: form)
    self.rules = parseStructuredRules(props["rules"])
  }
}

// MARK: - Text input

struct InputView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form
  @Environment(FormValidation.self) private var validation: FormValidation?

  var body: some View {
    let state = FieldContext(props, context: context, form: form)
    let text = Binding<String>(
      get: { displayText(state.field.value) },
      set: { newValue in
        state.field.setValue(.string(newValue))
        if !state.rules.isEmpty { validation?.clearError(state.field.name) }
      })
    Group {
      if props.string("type") == "password" {
        SecureField(props.text("placeholder"), text: text)
      } else {
        TextField(props.text("placeholder"), text: text)
          #if os(iOS)
            .keyboardType(keyboard)
            .textInputAutocapitalization(autocapitalization)
          #endif
      }
    }
    .textFieldStyle(.plain)
    .fieldSurface()
    .disabled(context.isStreaming)
    .onSubmit {
      if !state.rules.isEmpty {
        validation?.validateField(state.field.name, value: state.field.value, rules: state.rules)
      }
    }
    .formField(state.field.name, rules: state.rules, value: state.field.value)
  }

  #if os(iOS)
    private var keyboard: UIKeyboardType {
      switch props.string("type") {
      case "email": return .emailAddress
      case "url": return .URL
      case "number": return .decimalPad
      default: return .default
      }
    }

    private var autocapitalization: TextInputAutocapitalization {
      ["email", "url"].contains(props.string("type") ?? "") ? .never : .sentences
    }
  #endif
}

struct TextAreaView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form
  @Environment(FormValidation.self) private var validation: FormValidation?

  var body: some View {
    let state = FieldContext(props, context: context, form: form)
    // At most a screenful: the count comes from the response.
    let rows = Int(min(max(props.number("rows").flatMap(\.finite) ?? 3, 1), 20))
    TextField(
      props.text("placeholder"),
      text: Binding(
        get: { displayText(state.field.value) },
        set: { newValue in
          state.field.setValue(.string(newValue))
          if !state.rules.isEmpty { validation?.clearError(state.field.name) }
        }),
      axis: .vertical
    )
    .lineLimit(rows...max(rows, 12))
    .textFieldStyle(.plain)
    .fieldSurface()
    .disabled(context.isStreaming)
    .formField(state.field.name, rules: state.rules, value: state.field.value)
  }
}

// MARK: - Choices

struct SelectView: View {
  let props: ComponentProps
  @Environment(\.openUITheme) private var theme
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form
  @Environment(FormValidation.self) private var validation: FormValidation?

  var body: some View {
    let state = FieldContext(props, context: context, form: form)
    let items = props.children("items")
    let current = displayText(state.field.value)
    let label = items.first { $0.text("value") == current }?.text("label")
    // A full-width field like react-ui's select, opening a native menu.
    Menu {
      Picker(
        props.text("placeholder"),
        selection: Binding<String>(
          get: { current },
          set: { newValue in
            state.field.setValue(.string(newValue))
            if !state.rules.isEmpty {
              validation?.validateField(
                state.field.name, value: .string(newValue), rules: state.rules)
            }
          })
      ) {
        ForEach(items.indices, id: \.self) { index in
          Text(items[index].text("label")).tag(items[index].text("value"))
        }
      }
      .pickerStyle(.inline)
    } label: {
      HStack {
        Text(label ?? props.string("placeholder") ?? "Select…")
          .foregroundStyle(label == nil ? .secondary : .primary)
        Spacer()
        Image(systemName: "chevron.down").font(.caption).foregroundStyle(.secondary)
      }
      .frame(maxWidth: .infinity)
      .fieldSurface(border: theme.border)
      .contentShape(Rectangle())
    }
    .menuIndicator(.hidden)
    .buttonStyle(.plain)
    .disabled(context.isStreaming)
    .formField(state.field.name, rules: state.rules, value: state.field.value)
  }
}

struct SelectItemView: View {
  let props: ComponentProps

  var body: some View {
    Text(props.text("label"))
  }
}

struct RadioGroupView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form
  @Environment(FormValidation.self) private var validation: FormValidation?

  var body: some View {
    let state = FieldContext(props, context: context, form: form)
    let selected =
      state.field.value.isNullish ? props.text("defaultValue") : displayText(state.field.value)
    VStack(alignment: .leading, spacing: 8) {
      ForEach(Array(props.children("items").enumerated()), id: \.offset) { _, item in
        let value = item.text("value")
        Button {
          state.field.setValue(.string(value))
          if !state.rules.isEmpty {
            validation?.validateField(state.field.name, value: .string(value), rules: state.rules)
          }
        } label: {
          OptionRow(
            symbol: value == selected ? "largecircle.fill.circle" : "circle",
            label: item.text("label"), description: item.text("description"))
        }
        .buttonStyle(.openUIHover)
      }
    }
    .disabled(context.isStreaming)
    .formField(state.field.name, rules: state.rules, value: state.field.value)
  }
}

struct RadioItemView: View {
  let props: ComponentProps

  var body: some View {
    OptionRow(symbol: "circle", label: props.text("label"), description: props.text("description"))
  }
}

/// A group of named booleans stored as one `{ name: Bool }` record, shared by
/// check boxes and switches. Unset items fall back to `defaultChecked`.
private struct BooleanGroup: View {
  let props: ComponentProps
  let style: Style
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form
  @Environment(FormValidation.self) private var validation: FormValidation?

  enum Style { case checkbox, toggle }

  var body: some View {
    let state = FieldContext(props, context: context, form: form)
    let items = props.children("items")
    let stored = state.field.value.objectValue ?? OpenUIObject()
    let aggregate = OpenUIObject(
      items.map { item in
        let name = item.text("name")
        let value = stored[name]?.boolValue ?? item.bool("defaultChecked") ?? false
        return (name, OpenUIValue.bool(value))
      })
    VStack(alignment: .leading, spacing: 8) {
      ForEach(Array(items.enumerated()), id: \.offset) { _, item in
        let name = item.text("name")
        let isOn = aggregate[name]?.boolValue ?? false
        let toggle = {
          var next = aggregate
          next[name] = .bool(!isOn)
          state.field.setValue(.object(next))
          if !state.rules.isEmpty {
            validation?.validateField(state.field.name, value: .object(next), rules: state.rules)
          }
        }
        switch style {
        case .checkbox:
          Button(action: toggle) {
            OptionRow(
              symbol: isOn ? "checkmark.square.fill" : "square", label: item.text("label"),
              description: item.text("description"))
          }
          .buttonStyle(.openUIHover)
        case .toggle:
          // The switch leads and the text follows, as in react-ui's SwitchItem.
          HStack(alignment: .top, spacing: 8) {
            Toggle(item.text("label"), isOn: Binding(get: { isOn }, set: { _ in toggle() }))
              .toggleStyle(.switch)
              .labelsHidden()
            VStack(alignment: .leading, spacing: 2) {
              Text(item.text("label"))
              if let description = item.string("description"), !description.isEmpty {
                Text(description).font(.caption).foregroundStyle(.secondary)
              }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
          }
        }
      }
    }
    .disabled(context.isStreaming)
    .formField(state.field.name, rules: state.rules, value: state.field.value)
  }
}

struct CheckBoxGroupView: View {
  let props: ComponentProps
  var body: some View { BooleanGroup(props: props, style: .checkbox) }
}

struct SwitchGroupView: View {
  let props: ComponentProps
  var body: some View {
    BooleanGroup(props: props, style: .toggle).surface(props.string("variant") ?? "clear")
  }
}

struct CheckBoxItemView: View {
  let props: ComponentProps
  var body: some View {
    OptionRow(
      symbol: props.bool("defaultChecked") == true ? "checkmark.square.fill" : "square",
      label: props.text("label"), description: props.text("description"))
  }
}

struct SwitchItemView: View {
  let props: ComponentProps
  var body: some View {
    Toggle(props.text("label"), isOn: .constant(props.bool("defaultChecked") ?? false))
      .toggleStyle(.switch)
      .disabled(true)
  }
}

/// A selectable row: indicator symbol, label and optional description.
private struct OptionRow: View {
  let symbol: String
  let label: String
  let description: String
  @Environment(\.openUITheme) private var theme
  @Environment(\.openUIHovered) private var hovered

  var body: some View {
    let radio = symbol.contains("circle")
    let empty = symbol == "circle" || symbol == "square"
    HStack(alignment: .firstTextBaseline, spacing: 8) {
      Image(systemName: symbol)
        .foregroundStyle(theme.accent)
        // react-ui fills an empty radio or check box under the pointer.
        .background {
          if hovered && empty {
            RoundedRectangle(cornerRadius: radio ? 10 : 3)
              .fill(radio ? theme.interactiveBorder : theme.sunkSurface)
              .padding(2)
          }
        }
      VStack(alignment: .leading, spacing: 2) {
        Text(label)
        if !description.isEmpty {
          Text(description).font(.caption).foregroundStyle(.secondary)
        }
      }
      Spacer(minLength: 0)
    }
    .contentShape(Rectangle())
  }
}

// MARK: - Date and slider

/// Dates are stored as `yyyy-MM-dd` strings; a range as `{ from, to }`.
private let dayFormatter: DateFormatter = {
  let formatter = DateFormatter()
  formatter.calendar = Calendar(identifier: .gregorian)
  formatter.locale = Locale(identifier: "en_US_POSIX")
  formatter.dateFormat = "yyyy-MM-dd"
  return formatter
}()

struct DatePickerView: View {
  let props: ComponentProps
  @Environment(\.openUITheme) private var theme
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form
  @Environment(FormValidation.self) private var validation: FormValidation?

  var body: some View {
    let state = FieldContext(props, context: context, form: form)
    let isRange = props.string("mode") == "range"
    if state.field.value.isNullish {
      // Nothing is picked until the user picks it, so the form can't submit a
      // date the user never chose.
      Button {
        let today = OpenUIValue.string(dayFormatter.string(from: Date()))
        set(state, isRange ? .object(["from": today, "to": today]) : today)
      } label: {
        HStack {
          Text(isRange ? "Select a range" : "Select a date").foregroundStyle(.secondary)
          Spacer()
          Image(systemName: "calendar").foregroundStyle(.secondary)
        }
        .fieldSurface(border: theme.border)
      }
      .buttonStyle(.plain)
      .disabled(context.isStreaming)
      .formField(state.field.name, rules: state.rules, value: state.field.value)
    } else if isRange {
      VStack(alignment: .leading, spacing: 6) {
        rangePicker("From", key: "from", state)
        rangePicker("To", key: "to", state)
      }
      .formField(state.field.name, rules: state.rules, value: state.field.value)
    } else {
      DatePicker(
        "",
        selection: Binding(
          get: { state.field.value.stringValue.flatMap(dayFormatter.date(from:)) ?? Date() },
          set: { set(state, .string(dayFormatter.string(from: $0))) }),
        displayedComponents: .date
      )
      .labelsHidden()
      .disabled(context.isStreaming)
      .formField(state.field.name, rules: state.rules, value: state.field.value)
    }
  }

  private func rangePicker(_ label: String, key: String, _ state: FieldContext) -> some View {
    let range = state.field.value.objectValue ?? OpenUIObject()
    let day = { (key: String) in range[key]?.stringValue.flatMap(dayFormatter.date(from:)) }
    let selection = Binding(
      get: { day(key) ?? Date() },
      set: { (date: Date) in
        var next = range
        next[key] = .string(dayFormatter.string(from: date))
        set(state, .object(next))
      })
    // The ends can't cross, as in react-ui's range calendar.
    return Group {
      if key == "from", let to = day("to") {
        DatePicker(label, selection: selection, in: ...to, displayedComponents: .date)
      } else if key == "to", let from = day("from") {
        DatePicker(label, selection: selection, in: from..., displayedComponents: .date)
      } else {
        DatePicker(label, selection: selection, displayedComponents: .date)
      }
    }
    .disabled(context.isStreaming)
  }

  private func set(_ state: FieldContext, _ value: OpenUIValue) {
    state.field.setValue(value)
    if !state.rules.isEmpty {
      validation?.validateField(state.field.name, value: value, rules: state.rules)
    }
  }
}

/// A slider like react-ui's SliderBlock: the label with editable values (a
/// menu of steps when discrete), then the track. Two values make it a range
/// with a thumb at each end.
struct SliderView: View {
  let props: ComponentProps
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form
  @Environment(FormValidation.self) private var validation: FormValidation?
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let state = FieldContext(props, context: context, form: form)
    // The bounds come from the response; one that isn't a finite number
    // (1e999, 0/0) falls back to react-ui's default rather than breaking the range.
    let minimum = props.number("min").flatMap(\.finite) ?? 0
    let maximum = max(props.number("max").flatMap(\.finite) ?? 100, minimum)
    let discrete = props.string("variant") == "discrete"
    // react-ui steps a continuous slider by at least 1.
    let step =
      props.number("step").flatMap(\.finite).map { discrete ? max($0, 0.0001) : max($0, 1) } ?? 1
    let stored = state.field.value.isNullish ? props["defaultValue"] : state.field.value
    let values = (stored.arrayValue ?? []).compactMap(\.numberValue)
    let current = values.isEmpty ? [minimum] : Array(values.prefix(2))
    let errors = discrete ? [] : Self.errors(current, minimum: minimum, maximum: maximum)
    let set: @MainActor ([Double]) -> Void = { next in
      state.field.setValue(.array(next.map { .number($0) }))
      if !state.rules.isEmpty {
        validation?.validateField(state.field.name, value: .number(next[0]), rules: state.rules)
      }
    }
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 8) {
        Text(props.string("label") ?? state.field.name).font(.subheadline)
        Spacer(minLength: 8)
        // Step-derived controls wait until the props stop streaming.
        if !context.isStreaming {
          SliderValueControls(
            values: current, minimum: minimum, maximum: maximum, step: step, discrete: discrete,
            errors: errors, onChange: set)
        }
      }
      if !context.isStreaming, let error = errors.first(where: { !$0.isEmpty }) {
        Label(error, systemImage: "exclamationmark.circle")
          .font(.caption).foregroundStyle(theme.danger)
      }
      if current.count > 1 {
        RangeSlider(
          lower: RangeSlider.clamp(min(current[0], current[1]), to: minimum...maximum),
          upper: RangeSlider.clamp(max(current[0], current[1]), to: minimum...maximum),
          bounds: minimum...maximum, step: step
        ) { set([$0, $1]) }
      } else if maximum - minimum < step {
        // SwiftUI's Slider traps unless its range holds a whole step. Mid-stream
        // `max` can be cut short below `min` ("8000" arrives as "800"), and a
        // response can give a step wider than the range, so the track stays
        // idle until there's a range to move in.
        Slider(value: .constant(0), in: 0...1).disabled(true)
      } else if (maximum - minimum) / step <= 100 {
        Slider(
          value: Binding(
            get: { RangeSlider.clamp(current[0], to: minimum...maximum) },
            set: { set([$0]) }),
          in: minimum...maximum, step: step)
      } else {
        // On the Mac a stepped Slider draws a tick mark per step, and AppKit
        // never finishes laying out millions of them; the value snaps here.
        Slider(
          value: Binding(
            get: { RangeSlider.clamp(current[0], to: minimum...maximum) },
            set: { set([RangeSlider.snap($0, bounds: minimum...maximum, step: step)]) }),
          in: minimum...maximum)
      }
      HStack {
        Text(compactNumber(minimum))
        Spacer()
        Text(compactNumber(maximum))
      }
      .font(.caption.monospacedDigit())
      .foregroundStyle(.secondary)
    }
    .disabled(context.isStreaming)
    .formField(state.field.name, rules: state.rules, value: state.field.value)
  }

  /// react-ui's messages for typed values: one per value, empty when fine.
  static func errors(_ values: [Double], minimum: Double, maximum: Double) -> [String] {
    var errors = values.map { value -> String in
      if value.isNaN { return "Invalid number" }
      if value < minimum || value > maximum {
        return "Value must be between \(jsNumberToString(minimum)) and \(jsNumberToString(maximum))"
      }
      return ""
    }
    if values.count > 1, values[0] > values[1] { errors[0] = "Min must be less than max" }
    return errors
  }
}

/// The values beside a slider's label: number fields, or menus of the steps
/// when the slider is discrete.
struct SliderValueControls: View {
  let values: [Double]
  let minimum: Double
  let maximum: Double
  let step: Double
  let discrete: Bool
  let errors: [String]
  let onChange: @MainActor ([Double]) -> Void

  /// Above this many steps a menu is unwieldy, so discrete sliders get a
  /// number field instead.
  private static let maximumMenuOptions = 200

  var body: some View {
    let options =
      discrete ? Self.options(minimum, maximum, step, limit: Self.maximumMenuOptions) : nil
    HStack(spacing: 6) {
      if values.count > 1 {
        let lower = values[0]
        let upper = values[1]
        if let options {
          menu(lower, options.filter { $0 < upper }) { onChange([$0, upper].sorted()) }
          separator
          menu(upper, options.filter { $0 > lower }) { onChange([lower, $0].sorted()) }
        } else {
          SliderValueField(value: lower, hasError: !errors[0].isEmpty) { onChange([$0, upper]) }
          separator
          SliderValueField(value: upper, hasError: !(errors.last ?? "").isEmpty) {
            onChange([lower, $0])
          }
        }
      } else if let options {
        menu(values[0], options) { onChange([$0]) }
      } else {
        SliderValueField(value: values[0], hasError: !(errors.first ?? "").isEmpty) {
          onChange([$0])
        }
      }
    }
  }

  private var separator: some View {
    Rectangle().fill(Color.secondary.opacity(0.5)).frame(width: 8, height: 1)
  }

  private func menu(
    _ value: Double, _ options: [Double], _ select: @escaping @MainActor (Double) -> Void
  )
    -> some View
  {
    Picker(
      "Value",
      selection: Binding(get: { value }, set: { select($0) })
    ) {
      ForEach(options, id: \.self) { Text(jsNumberToString($0)).tag($0) }
    }
    .labelsHidden()
    .pickerStyle(.menu)
    .fixedSize()
  }

  /// Every step from `minimum` to `maximum`, like react-ui's option list, or
  /// nil when there are more than `limit` of them.
  static func options(_ minimum: Double, _ maximum: Double, _ step: Double, limit: Int) -> [Double]?
  {
    let steps = ((maximum - minimum) / step).rounded(.down)
    guard steps.isFinite, steps >= 0, steps < Double(limit) else { return steps < 0 ? [] : nil }
    return (0...Int(steps)).map { minimum + Double($0) * step }
  }
}

/// A small number field that applies valid numbers as they're typed and shows
/// the slider's value again when it loses focus.
private struct SliderValueField: View {
  let value: Double
  let hasError: Bool
  let onChange: @MainActor (Double) -> Void
  @State private var text = ""
  @FocusState private var focused: Bool
  @Environment(\.openUITheme) private var theme

  var body: some View {
    TextField("Value", text: $text)
      .labelsHidden()
      .multilineTextAlignment(.center)
      .font(.subheadline.monospacedDigit())
      .frame(width: 64)
      .padding(.vertical, 4)
      .background(Color.primary.opacity(0.05), in: RoundedRectangle(cornerRadius: 6))
      .overlay(
        RoundedRectangle(cornerRadius: 6)
          .strokeBorder(hasError ? theme.danger : Color.primary.opacity(0.1))
      )
      .focused($focused)
      #if os(iOS)
        .keyboardType(.numbersAndPunctuation)
      #endif
      .onAppear { text = jsNumberToString(value) }
      .onChange(of: value) { if !focused { text = jsNumberToString(value) } }
      .onChange(of: focused) { if !focused { text = jsNumberToString(value) } }
      .onChange(of: text) {
        let number = jsStringToNumber(text)
        if !number.isNaN, focused { onChange(number) }
      }
  }
}

/// One track with a thumb at each end of a range, like react-ui's range
/// slider. A thumb stops at the other one rather than crossing it.
struct RangeSlider: View {
  let lower: Double
  let upper: Double
  let bounds: ClosedRange<Double>
  let step: Double
  let onChange: @MainActor (Double, Double) -> Void
  @Environment(\.isEnabled) private var isEnabled
  /// Where each thumb (keyed by whether it's the lower one) was when its drag
  /// began. A drag's translation is from there, not from where the thumb has
  /// moved to since.
  @State private var dragStarts: [Bool: CGFloat] = [:]
  private let thumbSize: CGFloat = 24

  var body: some View {
    GeometryReader { geometry in
      let track = max(geometry.size.width - thumbSize, 1)
      ZStack(alignment: .leading) {
        Capsule()
          .fill(Color.primary.opacity(0.12))
          .frame(height: 4)
          .padding(.horizontal, thumbSize / 2)
        Capsule()
          .fill(.tint)
          .frame(width: max(0, offset(upper, track) - offset(lower, track)), height: 4)
          .offset(x: offset(lower, track) + thumbSize / 2)
        thumb(isLower: true, value: lower, track: track)
        thumb(isLower: false, value: upper, track: track)
      }
      .frame(maxHeight: .infinity)
    }
    .frame(height: thumbSize + 4)
    .opacity(isEnabled ? 1 : 0.5)
  }

  private func offset(_ value: Double, _ track: CGFloat) -> CGFloat {
    let span = bounds.upperBound - bounds.lowerBound
    return span > 0 ? CGFloat((value - bounds.lowerBound) / span) * track : 0
  }

  private func thumb(isLower: Bool, value: Double, track: CGFloat) -> some View {
    Circle()
      .fill(.white)
      .shadow(color: .black.opacity(0.2), radius: 2, y: 1)
      .overlay(Circle().strokeBorder(Color.black.opacity(0.06)))
      .frame(width: thumbSize, height: thumbSize)
      .offset(x: offset(value, track))
      .gesture(
        DragGesture(minimumDistance: 0)
          .onChanged { drag in
            let start = dragStarts[isLower] ?? offset(value, track)
            dragStarts[isLower] = start
            move(
              isLower: isLower,
              to: Self.value(at: start + drag.translation.width, track: track, bounds: bounds))
          }
          .onEnded { _ in dragStarts[isLower] = nil }
      )
      .accessibilityElement()
      .accessibilityLabel(isLower ? "Minimum" : "Maximum")
      .accessibilityValue(jsNumberToString(value))
      .accessibilityAdjustableAction { direction in
        let delta = direction == .increment ? step : -step
        move(isLower: isLower, to: value + delta)
      }
      .focusable()
      .onKeyPress(.leftArrow) {
        move(isLower: isLower, to: value - step)
        return .handled
      }
      .onKeyPress(.rightArrow) {
        move(isLower: isLower, to: value + step)
        return .handled
      }
  }

  private func move(isLower: Bool, to value: Double) {
    let snapped = Self.snap(value, bounds: bounds, step: step)
    if isLower {
      onChange(min(snapped, upper), upper)
    } else {
      onChange(lower, max(snapped, lower))
    }
  }

  /// The value at `offset` points along a `track` that spans `bounds`.
  static func value(at offset: CGFloat, track: CGFloat, bounds: ClosedRange<Double>) -> Double {
    bounds.lowerBound + Double(offset / track) * (bounds.upperBound - bounds.lowerBound)
  }

  static func clamp(_ value: Double, to bounds: ClosedRange<Double>) -> Double {
    min(max(value, bounds.lowerBound), bounds.upperBound)
  }

  /// The nearest step to `value`, within `bounds`.
  static func snap(_ value: Double, bounds: ClosedRange<Double>, step: Double) -> Double {
    guard step > 0 else { return clamp(value, to: bounds) }
    let steps = ((value - bounds.lowerBound) / step).rounded()
    return clamp(bounds.lowerBound + steps * step, to: bounds)
  }
}

// MARK: - Buttons

struct ButtonView: View {
  let props: ComponentProps
  @Environment(\.openUIButtonFillsWidth) private var fillsWidth
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form
  @Environment(FormValidation.self) private var validation: FormValidation?

  var body: some View {
    let label = props.text("label")
    let variant = props.string("variant") ?? "primary"
    let destructive = props.string("type") == "destructive"
    Button(role: destructive ? .destructive : nil) {
      let action = props["action"]
      if let validation, variant == "primary", !shouldSkipValidation(action) {
        guard validation.validateForm() else { return }
      }
      context.triggerAction(label, form: form, action: action.isNullish ? nil : action)
    } label: {
      Text(label).frame(maxWidth: fillsWidth ? .infinity : nil)
    }
    .modifier(ButtonVariant(variant: variant))
    .controlSize(controlSize)
    .disabled(context.isStreaming)
  }

  /// Primary buttons validate the form first, unless their action plan only
  /// has steps that don't submit anything (no @ToAssistant, no mutation).
  private func shouldSkipValidation(_ action: OpenUIValue) -> Bool {
    guard case .actionPlan(let plan) = action else { return false }
    return !plan.steps.contains { step in
      switch step {
      case .continueConversation: return true
      case .run(_, let refType): return refType == .mutation
      default: return false
      }
    }
  }

  private var controlSize: ControlSize {
    switch props.string("size") {
    case "extra-small": return .mini
    case "small": return .small
    case "large": return .large
    default: return .regular
    }
  }
}

private struct ButtonFillsWidthKey: EnvironmentKey {
  static let defaultValue = false
}

extension EnvironmentValues {
  /// Whether buttons stretch to the available width, like a card footer's.
  var openUIButtonFillsWidth: Bool {
    get { self[ButtonFillsWidthKey.self] }
    set { self[ButtonFillsWidthKey.self] = newValue }
  }
}

private struct ButtonVariant: ViewModifier {
  let variant: String

  func body(content: Content) -> some View {
    switch variant {
    case "secondary": content.buttonStyle(.bordered)
    case "tertiary", "ghost": content.buttonStyle(.borderless)
    default: content.modifier(ProminentButton())
    }
  }
}

/// A filled button in the theme's accent, with its `onAccent` label.
struct ProminentButton: ViewModifier {
  @Environment(\.openUITheme) private var theme
  @Environment(\.isEnabled) private var isEnabled
  #if os(macOS)
    @Environment(\.controlActiveState) private var activeState
  #endif

  func body(content: Content) -> some View {
    content.buttonStyle(.borderedProminent).foregroundStyle(labelColor)
  }

  /// The system draws a disabled button, or any prominent button in an
  /// inactive Mac window, gray instead of in the accent. The accent's label
  /// color would be unreadable on that, so those keep the system's.
  private var labelColor: Color {
    #if os(macOS)
      if activeState == .inactive { return .primary }
    #endif
    return isEnabled ? theme.onAccent : .secondary
  }
}

struct ButtonsView: View {
  let props: ComponentProps
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let buttons = props.array("buttons")
    if props.string("direction") == "column" {
      VStack(alignment: .leading, spacing: theme.compactSpacing) {
        ForEach(NodeItem.list(buttons)) { OpenUINode($0.value) }
      }
    } else {
      FlowLayout(spacing: theme.compactSpacing) {
        ForEach(NodeItem.list(buttons)) { OpenUINode($0.value) }
      }
    }
  }
}

/// react-ui's slider labels: 1000 and up in short compact notation ("10k",
/// "2.5m"), smaller numbers as JavaScript prints them.
func compactNumber(_ number: Double) -> String {
  guard number >= 1000 else { return jsNumberToString(number) }
  return number.formatted(
    .number.notation(.compactName).locale(Locale(identifier: "en_US"))
  ).lowercased()
}

/// react-ui's field look: a faint fill, a 1pt border and 10pt corners.
private struct FieldSurface: ViewModifier {
  var border: Color?
  @Environment(\.openUITheme) private var theme

  func body(content: Content) -> some View {
    content
      .padding(.horizontal, 10)
      .padding(.vertical, 8)
      .background(theme.subtleSurface, in: RoundedRectangle(cornerRadius: 10))
      .overlay(
        RoundedRectangle(cornerRadius: 10).strokeBorder(border ?? theme.interactiveBorder))
  }
}

extension View {
  fileprivate func fieldSurface(border: Color? = nil) -> some View {
    modifier(FieldSurface(border: border))
  }
}
