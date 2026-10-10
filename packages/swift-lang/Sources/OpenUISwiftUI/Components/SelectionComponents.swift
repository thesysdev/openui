import OpenUILang
import SwiftUI

// MARK: - Shared selection model

/// The selected values of a single- or multiple-choice field, following
/// react-ui's `normalizeSelection`: a single choice is stored as a string,
/// multiple choices as a string array; unset fields fall back to `defaultValue`.
private func selection(stored: OpenUIValue, defaultValue: OpenUIValue, single: Bool) -> [String] {
  func strings(_ value: OpenUIValue) -> [String]? {
    switch value {
    case .string(let string): return string.isEmpty ? [] : [string]
    case .array(let items): return items.compactMap(\.stringValue)
    default: return nil
    }
  }
  let values = strings(stored) ?? strings(defaultValue) ?? []
  return single ? Array(values.prefix(1)) : values
}

/// How a selection is stored (`getStoredDefaultValue` / the change handlers).
private func storedSelection(_ values: [String], single: Bool) -> OpenUIValue {
  if single { return values.first.map(OpenUIValue.string) ?? .undefined }
  return .array(values.map(OpenUIValue.string))
}

/// Field plumbing shared by Chips (wrapping row) and OptionCards (card grid).
private struct SelectionField<Option: View>: View {
  let props: ComponentProps
  let componentType: String
  var grid = false
  @ViewBuilder let option: (ComponentProps, Bool, @escaping () -> Void) -> Option
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUIFormName) private var form
  @Environment(FormValidation.self) private var validation: FormValidation?

  var body: some View {
    let single = props.string("type") == "single"
    let field = context.stateField(name: props.text("name"), binding: props["value"], form: form)
    let rules = parseStructuredRules(props["rules"])
    let selected = selection(
      stored: field.value, defaultValue: props["defaultValue"], single: single)
    let items = props.children("items")
    Group {
      if grid {
        ResponsiveCardGrid(count: items.count, maxPerRow: 3) { index in
          optionView(items[index], selected: selected, single: single, field: field, rules: rules)
        }
      } else {
        FlowLayout(spacing: 8) {
          ForEach(items.indices, id: \.self) { index in
            optionView(items[index], selected: selected, single: single, field: field, rules: rules)
          }
        }
      }
    }
    .disabled(context.isStreaming)
    .formField(field.name, rules: rules, value: field.value)
    .onAppear { seedDefault(single: single, field: field) }
    .onChange(of: context.isStreaming) { seedDefault(single: single, field: field) }
  }

  private func optionView(
    _ item: ComponentProps, selected: [String], single: Bool, field: StateField,
    rules: [ParsedRule]
  ) -> some View {
    let value = item.text("value")
    return option(item, selected.contains(value)) {
      var next = selected
      if single {
        next = selected == [value] ? [] : [value]
      } else if let index = next.firstIndex(of: value) {
        next.remove(at: index)
      } else {
        next.append(value)
      }
      let stored = storedSelection(next, single: single)
      field.setValue(stored)
      if !rules.isEmpty {
        validation?.validateField(field.name, value: stored, rules: rules)
      }
    }
    .disabled(item.bool("disabled") == true)
  }

  /// Stores the default once streaming ends, without notifying the host.
  private func seedDefault(single: Bool, field: StateField) {
    guard !field.isReactive else { return }
    let defaults = selection(
      stored: .undefined, defaultValue: props["defaultValue"], single: single)
    guard !defaults.isEmpty else { return }
    context.setDefaultValue(
      form: form, componentType: componentType, name: field.name,
      value: storedSelection(defaults, single: single))
  }
}

// MARK: - Chips

struct ChipsView: View {
  let props: ComponentProps
  var body: some View {
    SelectionField(props: props, componentType: "Chips") { item, isOn, toggle in
      Chip(item: item, isOn: isOn, action: toggle)
    }
  }
}

struct ChipItemView: View {
  let props: ComponentProps
  var body: some View { Chip(item: props, isOn: false, action: {}) }
}

private struct Chip: View {
  let item: ComponentProps
  let isOn: Bool
  let action: () -> Void
  @Environment(\.openUITheme) private var theme

  var body: some View {
    Button(action: action) {
      Hovering { hovered in
        HStack(spacing: 4) {
          if let symbol = iconSymbol(item["icon"]) { Image(systemName: symbol) }
          Text(item.text("label"))
        }
        .font(.subheadline)
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(
          isOn ? Color.primary.opacity(0.08) : hovered ? theme.subtleSurface : .clear,
          in: RoundedRectangle(cornerRadius: 8)
        )
        .overlay(
          RoundedRectangle(cornerRadius: 8).strokeBorder(
            isOn ? .primary : hovered ? theme.border : theme.interactiveBorder)
        )
        .contentShape(RoundedRectangle(cornerRadius: 8))
      }
    }
    .buttonStyle(.openUIHover)
    .accessibilityAddTraits(isOn ? .isSelected : [])
  }
}

// MARK: - Option cards

struct OptionCardsView: View {
  let props: ComponentProps
  var body: some View {
    SelectionField(props: props, componentType: "OptionCards", grid: true) { item, isOn, toggle in
      OptionCardTile(item: item, isOn: isOn, action: toggle)
    }
  }
}

struct OptionCardView: View {
  let props: ComponentProps
  var body: some View { OptionCardTile(item: props, isOn: false, action: {}) }
}

private struct OptionCardTile: View {
  let item: ComponentProps
  let isOn: Bool
  let action: () -> Void
  @Environment(\.openUITheme) private var theme

  var body: some View {
    Button(action: action) {
      Hovering { hovered in
        VStack(alignment: .leading, spacing: 6) {
          switch item["topContent"] {
          case .element(let element) where element.typeName == "Icon":
            Image(systemName: iconSymbol(item["topContent"]) ?? "circle")
              .font(.system(size: 14))
              .frame(width: 32, height: 32)
              .background(theme.sunkSurface, in: RoundedRectangle(cornerRadius: 8))
          case .element:
            OpenUINode(item["topContent"]).frame(height: 90).clipped()
          default:
            EmptyView()
          }
          Text(item.text("title")).font(.subheadline.weight(.semibold))
          if let subtitle = item.string("subtitle"), !subtitle.isEmpty {
            Text(subtitle).font(.caption).foregroundStyle(.secondary)
          }
        }
        .padding(10)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(isOn ? theme.sunkSurface : .clear, in: RoundedRectangle(cornerRadius: 14))
        .overlay(
          RoundedRectangle(cornerRadius: 14).strokeBorder(
            // react-ui darkens an unselected card's border under the pointer.
            isOn ? .primary : hovered ? Color.primary.opacity(0.3) : theme.interactiveBorder)
        )
        .contentShape(RoundedRectangle(cornerRadius: 14))
      }
    }
    .buttonStyle(.openUIHover)
    .accessibilityAddTraits(isOn ? .isSelected : [])
  }
}

// MARK: - Editable table

/// A spreadsheet-like table. Edits stay local until Save, which stores the rows
/// as `{ id, values }` under the table's name and sends "Save Changes", as in
/// react-ui.
struct EditableTableView: View {
  let props: ComponentProps
  @State private var edits = TableEdits()
  @FocusState private var focus: Cell?
  @Environment(OpenUIContext.self) private var context
  @Environment(\.openUITheme) private var theme

  var body: some View {
    let columns = props.array("columns")
    let rows = props.array("data")
    let name = props.string("name") ?? "editable-table"
    let changed = edits.count
    VStack(alignment: .leading, spacing: theme.compactSpacing) {
      ScrollView(.horizontal, showsIndicators: false) {
        Grid(alignment: .leading, horizontalSpacing: 10, verticalSpacing: 6) {
          GridRow {
            ForEach(Array(columns.enumerated()), id: \.offset) { _, column in
              Text(displayText(column["header"].isNullish ? column["key"] : column["header"]))
                .font(.subheadline.weight(.semibold))
            }
          }
          Divider()
          ForEach(Array(rows.enumerated()), id: \.offset) { rowIndex, row in
            let id = displayText(row["id"])
            GridRow {
              ForEach(Array(columns.enumerated()), id: \.offset) { index, column in
                cell(
                  Cell(row: rowIndex, column: index), rowId: id, column: column,
                  value: row["values"].arrayValue?[safe: index], rowCount: rows.count)
              }
            }
          }
        }
      }
      if changed > 0 {
        HStack {
          Text("\(changed) unsaved change\(changed == 1 ? "" : "s")").font(.caption)
            .foregroundStyle(.secondary)
          Spacer()
          Button("Reset") { edits = TableEdits() }.buttonStyle(.borderless)
          Button("Save Changes") {
            let saved = OpenUIValue.array(
              rows.map { row in
                let id = displayText(row["id"])
                let values = (0..<columns.count).map { index -> OpenUIValue in
                  if let edit = edits[id, index] {
                    let number = jsStringToNumber(edit)
                    let numeric = columns[index]["type"].stringValue == "number" && !number.isNaN
                    return numeric ? .number(number) : .string(edit)
                  }
                  return row["values"].arrayValue?[safe: index] ?? .null
                }
                return ["id": row["id"], "values": .array(values)]
              })
            context.runtime.setFieldValue(
              form: name, componentType: "EditableTable", name: name, value: saved)
            context.triggerAction("Save Changes", form: name)
            edits = TableEdits()
          }
          .modifier(ProminentButton())
        }
      }
    }
    .disabled(context.isStreaming)
  }

  /// A cell's place in the table, for keyboard focus.
  private struct Cell: Hashable {
    let row: Int
    let column: Int
  }

  /// Moves focus `rows` rows from `cell`, staying in its column.
  private func move(_ rows: Int, from cell: Cell, rowCount: Int) -> KeyPress.Result {
    let row = cell.row + rows
    guard (0..<rowCount).contains(row) else { return .ignored }
    focus = Cell(row: row, column: cell.column)
    return .handled
  }

  private func cell(
    _ position: Cell, rowId: String, column: OpenUIValue, value: OpenUIValue?, rowCount: Int
  ) -> some View {
    let index = position.column
    let width = column["width"].numberValue.flatMap(\.finite).map { CGFloat(max($0, 40)) } ?? 120
    let original = displayText(value ?? .null)
    let binding = Binding<String>(
      get: { edits[rowId, index] ?? original },
      set: { edits.set($0, row: rowId, column: index, original: original) })
    return Group {
      if column["type"].stringValue == "select", let options = column["options"].arrayValue {
        Picker("", selection: binding) {
          ForEach(Array(options.enumerated()), id: \.offset) { _, option in
            Text(displayText(option["label"])).tag(displayText(option["value"]))
          }
        }
        .labelsHidden()
      } else {
        // react-ui's spreadsheet keys, for a hardware keyboard: Enter keeps
        // the edit and moves down, Up and Down move between rows. Tab already
        // moves across.
        TextField("", text: binding)
          .textFieldStyle(.roundedBorder)
          .focused($focus, equals: position)
          .onSubmit { _ = move(1, from: position, rowCount: rowCount) }
          .onKeyPress(.upArrow) { move(-1, from: position, rowCount: rowCount) }
          .onKeyPress(.downArrow) { move(1, from: position, rowCount: rowCount) }
      }
    }
    .frame(width: width)
  }
}

/// An editable table's unsaved edits, by row id and column. Only text that
/// differs from the data is an edit: a focused field writes its text back
/// unchanged, which must not count as a change.
struct TableEdits: Equatable {
  private var rows: [String: [Int: String]] = [:]

  /// How many cells have unsaved edits.
  var count: Int { rows.values.reduce(0) { $0 + $1.count } }

  subscript(row: String, column: Int) -> String? { rows[row]?[column] }

  mutating func set(_ text: String, row: String, column: Int, original: String) {
    rows[row, default: [:]][column] = text == original ? nil : text
    if rows[row]?.isEmpty == true { rows[row] = nil }
  }
}

extension Array {
  subscript(safe index: Int) -> Element? { indices.contains(index) ? self[index] : nil }
}
