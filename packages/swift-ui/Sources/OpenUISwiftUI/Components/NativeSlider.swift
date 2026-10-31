@_spi(RuntimeInspection) import OpenUILang
import SwiftUI

struct NativeSliderConfiguration: Equatable {
  let minimum: Double
  let maximum: Double
  let step: Double
  let discrete: Bool
  init(minimum: Double, maximum: Double, step: Double?, discrete: Bool) {
    self.minimum = minimum; self.maximum = maximum; self.discrete = discrete
    let proposed = step ?? 1
    self.step = proposed.isFinite && proposed > 0 ? (discrete ? proposed : max(1, proposed)) : 1
  }
  var valid: Bool { minimum.isFinite && maximum.isFinite && maximum > minimum && (maximum - minimum).isFinite }
  var lastIndex: Double {
    guard valid else { return 0 }
    let count = floor((maximum - minimum) / step)
    return count.isFinite ? count : Double.greatestFiniteMagnitude
  }
  func value(at index: Double) -> Double { min(maximum, max(minimum, minimum + index * step)) }
  func snapped(_ value: Double) -> Double {
    guard valid else { return minimum }
    let index = ((min(maximum, max(minimum, value)) - minimum) / step).rounded()
    guard index.isFinite else { return min(maximum, max(minimum, value)) }
    let raw = self.value(at: index)
    let parts = jsNumberString(step).lowercased().split(separator: "e")
    let fractional = parts[0].split(separator: ".", omittingEmptySubsequences: false).dropFirst().first?.count ?? 0
    let exponent = parts.count > 1 ? Int(parts[1]) ?? 0 : 0
    let digits = min(100, max(0, fractional - exponent))
    return Double(jsNumberToFixed(raw, digits: digits)) ?? raw
  }
  func error(for values: [Double], index: Int) -> String? {
    guard values.indices.contains(index) else { return nil }
    let value = values[index]
    if !value.isFinite { return "Invalid number" }
    if value < minimum || value > maximum {
      return "Value must be between \(jsNumberString(minimum)) and \(jsNumberString(maximum))"
    }
    if index == 0, values.count > 1, value > values[1] { return "Min must be less than max" }
    return nil
  }
}

@MainActor
final class NativeSliderDraft: ObservableObject {
  @Published private(set) var values: [Double] = []
  @Published private(set) var text: [String] = []
  private var external: [Double] = []
  private var pending: [Double]?
  private var work: Task<Void, Never>?
  var commit: (([Double]) -> Void)?

  func receive(_ values: [Double]) {
    guard values != external || self.values.isEmpty else { return }
    external = values
    if values != self.values {
      work?.cancel(); pending = nil
      self.values = values; text = values.map(jsNumberString)
    }
  }
  func edit(_ input: String, at index: Int) {
    guard text.indices.contains(index) else { return }
    text[index] = input
    let number = toNumber(.string(input))
    guard number.isFinite else { return }
    var next = values; next[index] = number
    values = next
    schedule(next)
  }
  func select(_ value: Double, at index: Int, sorted: Bool = true) {
    guard values.indices.contains(index) else { return }
    var next = values; next[index] = value
    if sorted { next.sort() }
    values = next; text = next.map(jsNumberString)
    schedule(next)
  }
  private func schedule(_ values: [Double]) {
    pending = values
    work?.cancel()
    work = Task { @MainActor [weak self] in
      do { try await Task.sleep(nanoseconds: 200_000_000) } catch { return }
      self?.flush()
    }
  }
  func flush() {
    work?.cancel(); work = nil
    guard let pending else { return }
    self.pending = nil
    commit?(pending)
  }
  deinit { work?.cancel() }
}

private struct NativeSliderTarget: Equatable {
  let context: OpenUIComponentContext
  static func == (lhs: Self, rhs: Self) -> Bool {
    lhs.context.presentationSourceRevision == rhs.context.presentationSourceRevision
      && lhs.context.isStreaming == rhs.context.isStreaming
      && lhs.context.element.isSourceComplete == rhs.context.element.isSourceComplete
      && lhs.context.interactionScopeReady == rhs.context.interactionScopeReady
      && lhs.context.element == rhs.context.element
      && lhs.context.exactFormName == rhs.context.exactFormName
  }
}

struct NativeSliderField: View {
  let context: OpenUIComponentContext
  @Environment(\.openUIFieldLabel) private var fieldLabel
  @StateObject private var draft = NativeSliderDraft()
  @State private var picker: NativeSliderPickerRequest?
  private var field: NativeFieldState { .init(context: context) }
  private var configuration: NativeSliderConfiguration {
    .init(minimum: context.number("min") ?? 0, maximum: context.number("max") ?? 100,
      step: context.number("step"), discrete: context.string("variant") == "discrete")
  }
  private var external: [Double] {
    let values = NativeChartData.numbers(field.value)
    return values.isEmpty ? [configuration.minimum] : values
  }
  private var target: NativeSliderTarget { .init(context: context) }
  private var label: String { context.string("label") ?? field.name.displayString }

  var body: some View {
    VStack(alignment: .leading, spacing: context.theme.spacing("s")) {
      if fieldLabel == nil { Text(label).openUIFont(context.theme.typography.detail) }
      if configuration.valid {
        if context.canInteract {
          HStack(alignment: .top, spacing: context.theme.spacing("m")) {
            ForEach(Array(draft.values.indices.prefix(2)), id: \.self) { index in
              valueControl(index)
            }
          }
        }
        NativeSliderTrack(values: draft.values.isEmpty ? external : draft.values,
          configuration: configuration, enabled: context.canInteract,
          showsDots: configuration.discrete && context.canInteract, label: label,
          select: { value, index in draft.select(value, at: index) })
      } else {
        Text("Value unavailable", bundle: NativeControlResources.bundle).foregroundStyle(context.theme.secondary)
      }
    }
    .modifier(NativeFieldSurface(theme: context.theme))
    .onAppear { configure(target); draft.receive(external) }
    .onChange(of: target) { configure($0) }
    .onChange(of: external) { draft.receive($0) }
    .onChange(of: context.presentationSourceRevision) { _ in picker = nil }
    .onChange(of: context.canInteract) { ready in if !ready { picker = nil } }
    .onChange(of: draft.values.count) { count in if let picker, picker.index >= count { self.picker = nil } }
    .onDisappear { draft.flush() }
    .sheet(item: $picker) { request in
      if draft.values.indices.contains(request.index) {
        NativeSliderPicker(configuration: configuration, current: draft.values[request.index],
          lower: request.index == 1 ? draft.values.first : nil,
          upper: request.index == 0 && draft.values.count > 1 ? draft.values[1] : nil,
          label: label) { value in
            guard context.canInteract else { return }
            draft.select(value, at: request.index)
            picker = nil
          }
      }
    }
  }
  private func configure(_ target: NativeSliderTarget) {
    draft.commit = { values in
      NativeFieldState(context: target.context).write(.array(values.map(Value.number)))
    }
  }
  @ViewBuilder private func valueControl(_ index: Int) -> some View {
    VStack(alignment: .leading, spacing: context.theme.spacing("2xs")) {
      if configuration.discrete {
        Button { picker = .init(index: index) } label: {
          HStack {
            Text(jsNumberString(draft.values[index])).monospacedDigit()
            Spacer(minLength: context.theme.spacing("s"))
            Image(systemName: "chevron.up.chevron.down").openUIFont(context.theme.typography.caption)
          }.padding(context.theme.spacing("sm")).frame(minHeight: 44).background(context.theme.surface, in: RoundedRectangle(cornerRadius: context.theme.controlCornerRadius))
        }.buttonStyle(.plain).accessibilityIdentifier("openui.slider.choice.\(field.name.displayString).\(index)")
      } else {
        TextField(label, text: Binding(get: { draft.text.indices.contains(index) ? draft.text[index] : "" },
          set: { draft.edit($0, at: index) }))
          .textFieldStyle(.plain).monospacedDigit().nativeSliderKeyboard()
          .padding(context.theme.spacing("sm")).frame(minHeight: 44).background(context.theme.surface, in: RoundedRectangle(cornerRadius: context.theme.controlCornerRadius))
          .accessibilityIdentifier("openui.slider.input.\(field.name.displayString).\(index)")
        if let error = configuration.error(for: draft.values, index: index) {
          Text(error).openUIFont(context.theme.typography.caption).foregroundStyle(context.theme.error)
            .accessibilityIdentifier("openui.slider.validation.\(field.name.displayString).\(index)")
        }
      }
    }.frame(maxWidth: .infinity)
  }
}

private struct NativeSliderPickerRequest: Identifiable { let index: Int; var id: Int { index } }

/// A virtualized native choice list keeps every discrete value reachable without
/// allocating a view for every step in a potentially enormous numeric domain.
private struct NativeSliderPicker: View {
  let configuration: NativeSliderConfiguration
  let current: Double
  let lower: Double?
  let upper: Double?
  let label: String
  let select: (Double) -> Void
  @Environment(\.dismiss) private var dismiss
  @State private var firstIndex: Double = 0
  @State private var search = ""
  private var indices: [Double] {
    (0..<100).map { firstIndex + Double($0) }.filter { $0 <= configuration.lastIndex }
  }
  var body: some View {
    NavigationView {
      List {
        TextField(text: $search) { Text("Value", bundle: NativeControlResources.bundle) }
          .nativeSliderKeyboard().accessibilityIdentifier("openui.slider.search")
        if !search.isEmpty {
          let number = toNumber(.string(search))
          if number.isFinite, number >= configuration.minimum, number <= configuration.maximum {
            let value = configuration.snapped(number)
            if lower.map({ value > $0 }) ?? true, upper.map({ value < $0 }) ?? true {
              Button(jsNumberString(value)) { select(value) }.accessibilityIdentifier("openui.slider.use-value")
            }
          }
        }
        ForEach(Array(indices.enumerated()), id: \.offset) { _, index in
          let value = configuration.value(at: index)
          if lower.map({ value > $0 }) ?? true, upper.map({ value < $0 }) ?? true {
            Button(jsNumberString(value)) { select(value) }.accessibilityIdentifier("openui.slider.option." + jsNumberString(value))
          }
        }
        HStack {
          Button { firstIndex = max(0, firstIndex - 100) } label: { Text("Previous page", bundle: NativeControlResources.bundle) }.disabled(firstIndex <= 0)
          Spacer()
          Button { firstIndex += 100 } label: { Text("Next page", bundle: NativeControlResources.bundle) }.disabled(firstIndex + 100 > configuration.lastIndex)
        }
      }.navigationTitle(label)
        .toolbar { ToolbarItem(placement: .cancellationAction) { Button { dismiss() } label: { Text("Cancel", bundle: NativeControlResources.bundle) } } }
    }
      #if os(iOS)
      .navigationViewStyle(.stack)
      #endif
      .onAppear {
        let index = floor(((current - configuration.minimum) / configuration.step) / 100) * 100
        firstIndex = index.isFinite ? max(0, min(configuration.lastIndex, index)) : 0
      }
      .onChange(of: search) { text in
        let value = toNumber(.string(text))
        guard value.isFinite else { return }
        let index = floor((value - configuration.minimum) / configuration.step)
        firstIndex = index.isFinite ? max(0, min(configuration.lastIndex, index)) : 0
      }
  }
}

private struct NativeSliderTrack: View {
  let values: [Double]
  let configuration: NativeSliderConfiguration
  let enabled: Bool
  let showsDots: Bool
  let label: String
  let select: (Double, Int) -> Void
  @Environment(\.openUITheme) private var theme
  @State private var dragging: Int?
  private func fraction(_ value: Double) -> CGFloat {
    CGFloat(min(1, max(0, (value - configuration.minimum) / (configuration.maximum - configuration.minimum))))
  }
  var body: some View {
    GeometryReader { geometry in
      let width = max(1, geometry.size.width - 28)
      ZStack(alignment: .leading) {
        Capsule().fill(theme.border).frame(height: 5).padding(.horizontal, 14)
        let low = values.count > 1 ? values.min() ?? configuration.minimum : configuration.minimum
        let high = values.max() ?? configuration.minimum
        Capsule().fill(theme.accent).frame(width: max(0, width * (fraction(high) - fraction(low))), height: 5)
          .offset(x: 14 + width * fraction(low))
        if showsDots {
          Canvas { canvas, size in
            let available = max(1, size.width - 28)
            let count = configuration.lastIndex
            let stride = max(1, ceil(count / max(1, floor(available / 6))))
            var index = 0.0
            while index <= count {
              let x = 14 + available * fraction(configuration.value(at: index))
              canvas.fill(Path(ellipseIn: CGRect(x: x - 2, y: size.height / 2 - 2, width: 4, height: 4)), with: .color(theme.secondary))
              index += stride
            }
          }.allowsHitTesting(false)
        }
        ForEach(values.indices, id: \.self) { index in
          Circle().fill(theme.controlSurface).overlay(Circle().strokeBorder(theme.accent, lineWidth: 2))
            .frame(width: 28, height: 28).shadow(color: .black.opacity(0.08), radius: 2, y: 1)
            .frame(width: 44, height: 44).offset(x: width * fraction(values[index]) - 8)
            .accessibilityRepresentation {
              Slider(value: Binding(get: { min(configuration.maximum, max(configuration.minimum, values[index])) },
                set: { if enabled { select(configuration.snapped($0), index) } }),
                in: configuration.minimum...configuration.maximum, step: configuration.step)
                .accessibilityLabel(label).accessibilityValue(jsNumberString(values[index]))
                .accessibilityIdentifier("openui.slider.thumb.\(index)").disabled(!enabled)
            }
        }
      }.frame(maxHeight: .infinity).contentShape(Rectangle())
        .gesture(DragGesture(minimumDistance: 0).onChanged { gesture in
          guard enabled, !values.isEmpty else { return }
          let index = dragging ?? values.indices.min { abs(14 + width * fraction(values[$0]) - gesture.startLocation.x) < abs(14 + width * fraction(values[$1]) - gesture.startLocation.x) } ?? 0
          let proposed = configuration.minimum + Double((gesture.location.x - 14) / width) * (configuration.maximum - configuration.minimum)
          let value = configuration.snapped(proposed)
          var next = values; next[index] = value; next.sort()
          dragging = next.firstIndex(of: value) ?? index
          select(value, index)
        }.onEnded { _ in dragging = nil })
    }.frame(height: 44).opacity(enabled ? 1 : 0.5)
  }
}

private extension View {
  @ViewBuilder func nativeSliderKeyboard() -> some View {
    #if os(iOS)
    self.keyboardType(.numbersAndPunctuation)
    #else
    self
    #endif
  }
}
