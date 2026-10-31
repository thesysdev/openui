import OpenUILang
import SwiftUI

/// Draft editing is local until Save Changes, matching the upstream renderer.
/// The persisted value keeps the upstream positional { id, values } row shape.
struct NativeTableDraft {
  struct Row: Equatable {
    let id: OpenUIString
    var values: [Value]
  }
  private(set) var rows: [Row] = []
  private var baseline: [Row] = []
  mutating func load(_ value: Value) {
    rows = NativeValue.array(value).compactMap { row in
      guard case .string(let id) = NativeValue.prop(row, "id") else { return nil }
      return Row(id: id, values: NativeValue.array(NativeValue.prop(row, "values")))
    }
    baseline = rows
  }
  mutating func write(_ value: Value, row: Int, column: Int) {
    guard rows.indices.contains(row), column >= 0 else { return }
    while rows[row].values.count <= column { rows[row].values.append(.undefined) }
    rows[row].values[column] = value
  }
  func value(row: Int, column: Int) -> Value {
    guard rows.indices.contains(row), rows[row].values.indices.contains(column) else {
      return .undefined
    }
    return rows[row].values[column]
  }
  func changes(columns: Int) -> Int {
    rows.reduce(0) { count, row in
      guard let previous = baseline.first(where: { $0.id == row.id }) else { return count }
      return count
        + (0..<columns).filter { index in
          let a = row.values.indices.contains(index) ? row.values[index] : .undefined
          let b = previous.values.indices.contains(index) ? previous.values[index] : .undefined
          return a != b
        }.count
    }
  }
  mutating func reset() { rows = baseline }
  mutating func commit() { baseline = rows }
  var value: Value {
    .array(
      rows.map {
        .object([
          ObjectField(key: "id", value: .string($0.id)),
          ObjectField(key: "values", value: .array($0.values)),
        ])
      })
  }
}

struct NativeEditableTable: View {
  let context: OpenUIComponentContext
  @EnvironmentObject private var state: OpenUIState
  @State private var draft = NativeTableDraft()
  @State private var saving = false
  private var name: OpenUIString { context.codeUnitString("name") ?? "" }
  private var columns: [Value] { NativeValue.array(context.value("columns")) }
  private var source: Value {
    state.fieldValue(form: name, name: name, fallback: context.value("data") ?? .array([]))
  }
  private var changed: Int { draft.changes(columns: columns.count) }

  var body: some View {
    VStack(alignment: .leading, spacing: context.theme.spacing("m")) {
      ScrollView(.horizontal) {
        VStack(spacing: 0) {
          HStack(spacing: 0) {
            ForEach(Array(columns.enumerated()), id: \.offset) { index, column in
              Text(NativeValue.string(column, "header") ?? "").openUIFont(context.theme.typography.detail.weight(.semibold))
                .frame(width: width(index), alignment: .leading).padding(context.theme.cardPadding)
            }
          }.background(context.theme.surface)
          ForEach(Array(draft.rows.enumerated()), id: \.offset) { row, item in
            Divider()
            HStack(alignment: .center, spacing: 0) {
              ForEach(Array(columns.enumerated()), id: \.offset) { column, definition in
                cell(definition, row: row, column: column)
                  .frame(width: width(column), alignment: .leading).padding(context.theme.cardPadding)
                  .accessibilityIdentifier(
                    "openui.table.\(name.displayString).\(item.id.displayString).\(column)")
              }
            }
          }
        }
      }.disabled(!context.canInteract || saving)
        .background(
          context.theme.controlSurface,
          in: RoundedRectangle(cornerRadius: context.theme.controlCornerRadius)
        )
        .overlay(
          RoundedRectangle(cornerRadius: context.theme.controlCornerRadius).strokeBorder(
            context.theme.border, lineWidth: context.theme.cardBorderWidth))
      if changed > 0 {
        HStack(spacing: context.theme.spacing("m")) {
          Text("\(changed)").monospacedDigit()
          Text("Changed cells", bundle: NativeControlResources.bundle).foregroundStyle(
            context.theme.secondary)
          Spacer(minLength: 8)
          Button {
            draft.reset()
          } label: {
            Text("Reset", bundle: NativeControlResources.bundle)
          }
          .buttonStyle(
            NativeActionButtonStyle(theme: context.theme, variant: "tertiary", size: "small"))
          Button(action: save) { Text("Save Changes", bundle: NativeControlResources.bundle) }
            .buttonStyle(
              NativeActionButtonStyle(theme: context.theme, variant: "primary", size: "small"))
        }.openUIFont(context.theme.typography.detail).disabled(!context.canInteract || saving)
      }
    }
    .onAppear { draft.load(source) }
    .onChange(of: source) { value in draft.load(value) }
    .onChange(of: state.sourceRevision) { _ in draft.load(source) }
  }
  private func width(_ index: Int) -> CGFloat {
    CGFloat(min(600, max(100, NativeValue.number(columns[index], "width") ?? 160)))
  }
  private func binding(_ row: Int, _ column: Int) -> Binding<String> {
    Binding(
      get: {
        switch draft.value(row: row, column: column) {
        case .string(let value): return value.displayString
        case .number(let value): return jsNumberString(value)
        default: return ""
        }
      },
      set: { text in
        guard context.canInteract else { return }
        let numeric = NativeValue.string(columns[column], "type") == "number"
        if numeric, let value = Double(text), value.isFinite {
          draft.write(.number(value), row: row, column: column)
        } else {
          draft.write(.string(text), row: row, column: column)
        }
      })
  }
  @ViewBuilder private func cell(_ definition: Value, row: Int, column: Int) -> some View {
    let text = binding(row, column)
    let label = NativeValue.string(definition, "header") ?? ""
    switch NativeValue.string(definition, "type") {
    case "select":
      Picker(label, selection: text) {
        let options = NativeValue.array(NativeValue.prop(definition, "options"))
        if !options.contains(where: { NativeValue.string($0, "value") == text.wrappedValue }) {
          Text(text.wrappedValue).tag(text.wrappedValue)
        }
        ForEach(Array(options.enumerated()), id: \.offset) { _, option in
          Text(NativeValue.string(option, "label") ?? "").tag(
            NativeValue.string(option, "value") ?? "")
        }
      }.labelsHidden().pickerStyle(.menu).accessibilityLabel(label)
    case "date-single": NativeTableDateCell(value: text, label: label)
    default:
      TextField(label, text: text).textFieldStyle(.plain).accessibilityLabel(label)
        .multilineTextAlignment(
          NativeValue.string(definition, "type") == "number" ? .trailing : .leading)
    }
  }
  private func save() {
    guard context.canInteract, !saving, changed > 0 else { return }
    saving = true
    state.setFieldValue(form: name, name: name, value: draft.value, componentType: "EditableTable")
    draft.commit()
    Task { @MainActor in
      defer { saving = false }
      guard context.canInteract else { return }
      _ = await state.triggerAction("Save Changes", formName: name)
    }
  }
}

private struct NativeTableDateCell: View {
  @Environment(\.openUITheme) private var theme
  @Binding var value: String
  let label: String
  @State private var showing = false
  @State private var draft = Date()
  private var formatter: DateFormatter {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter
  }
  var body: some View {
    Button {
      draft = formatter.date(from: value) ?? Date()
      showing = true
    } label: {
      HStack {
        Image(systemName: "calendar")
        Text(value.isEmpty ? label : value)
      }
    }.buttonStyle(.plain).accessibilityLabel(label)
      .popover(isPresented: $showing) {
        VStack(spacing: theme.spacing("ml")) {
          DatePicker(label, selection: $draft, displayedComponents: .date).datePickerStyle(
            .graphical)
          HStack {
            Button {
              showing = false
            } label: {
              Text("Cancel", bundle: NativeControlResources.bundle)
            }
            Spacer()
            Button {
              value = formatter.string(from: draft)
              showing = false
            } label: {
              Text("Done", bundle: NativeControlResources.bundle)
            }
          }
        }.padding(theme.spacing("ml")).frame(minWidth: 300)
      }
  }
}
