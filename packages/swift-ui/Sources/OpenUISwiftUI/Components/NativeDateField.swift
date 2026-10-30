import OpenUILang
import SwiftUI

/// Same JSON boundary as the reference's Date / DateRange values.
enum NativeCalendarDate {
    static func parse(_ value: Value?) -> Date? {
        guard case .string(let raw) = value, let text = raw.wellFormedString else { return nil }
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.isLenient = false
        if text.count == 10, let date = formatter.date(from: text), formatter.string(from: date) == text {
            return date
        }
        let timestamp = ISO8601DateFormatter()
        timestamp.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return timestamp.date(from: text) ?? ISO8601DateFormatter().date(from: text)
    }
    static func encode(_ date: Date) -> Value {
        let formatter = ISO8601DateFormatter()
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return .string(formatter.string(from: date))
    }
}

enum NativeDatePart: String {
    case single, from, to
    var key: String? { self == .single ? nil : rawValue }
}
struct NativeDateRequest: Identifiable {
    let id = UUID()
    let part: NativeDatePart
    let label: String
    let date: Date
    let context: OpenUIComponentContext
}

struct NativeDateField: View {
    let context: OpenUIComponentContext
    let label: String
    @Environment(\.locale) private var locale
    @Environment(\.openUIFieldPresentation) private var fieldPresentation
    @EnvironmentObject private var runtime: OpenUIState
    @State private var request: NativeDateRequest?
    private var field: NativeFieldState { .init(context: context) }
    private var range: Bool { context.string("mode") == "range" }
    private func date(_ part: NativeDatePart) -> Date? {
        if let key = part.key, case .object(let object) = field.value {
            return NativeCalendarDate.parse(object[key])
        }
        return NativeCalendarDate.parse(field.value)
    }
    private func write(_ selected: Date, part: NativeDatePart, context: OpenUIComponentContext) {
        let field = NativeFieldState(context: context)
        guard context.canInteract else { return }
        let selected = Calendar.current.startOfDay(for: selected)
        if let key = part.key {
            var values: [ObjectField] = []
            if case .object(let object) = field.value { values = Array(object).filter { $0.key != key } }
            values.append(ObjectField(key: key, value: NativeCalendarDate.encode(selected)))
            let from = values.first { $0.key == "from" }.flatMap { NativeCalendarDate.parse($0.value) }
            let to = values.first { $0.key == "to" }.flatMap { NativeCalendarDate.parse($0.value) }
            if let from, let to, from > to {
                let other = key == "from" ? "to" : "from"
                values.removeAll { $0.key == other }
                values.append(ObjectField(key: other, value: NativeCalendarDate.encode(selected)))
            }
            field.write(.object(values))
        } else {
            field.write(NativeCalendarDate.encode(selected))
        }
    }
    var body: some View {
        presentation
            .onChange(of: context.canInteract) { active in if !active { request = nil } }
            .onChange(of: runtime.sourceRevision) { _ in request = nil }
    }
    @ViewBuilder private var presentation: some View {
        #if os(macOS)
            content.popover(item: $request) { value in editor(value).frame(width: 360, height: 480) }
        #else
            content.sheet(item: $request) { value in editor(value).modifier(NativeCalendarPresentation()) }
        #endif
    }
    private var content: some View {
        VStack(alignment: .leading, spacing: context.theme.spacing("s")) {
            if range {
                dateControl(NativeControlText.localized("Start date", locale: locale), part: .from)
                dateControl(NativeControlText.localized("End date", locale: locale), part: .to)
            } else {
                dateControl(label, part: .single)
            }

        }
    }
    private func dateControl(_ title: String, part: NativeDatePart) -> some View {
        VStack(alignment: .leading, spacing: context.theme.spacing("xs")) {
            if range { Text(title).openUIFont(context.theme.typography.detail).foregroundStyle(context.theme.secondary) }
            Button {
                request = NativeDateRequest(
                    part: part, label: title, date: date(part) ?? Date(), context: context)
            } label: {
                HStack(spacing: 8) {
                    if fieldPresentation == .inline { Spacer(minLength: 0) }
                    if let date = date(part) {
                        Text(
                            date.formatted(
                                Date.FormatStyle(date: .abbreviated, time: .omitted).locale(locale)))
                    } else {
                        Text("Select date", bundle: NativeControlResources.bundle).foregroundStyle(context.theme.secondary)
                    }
                    if fieldPresentation != .inline { Spacer(minLength: 8) }
                    Image(systemName: "calendar").openUIFont(context.theme.typography.detail).foregroundStyle(context.theme.secondary)
                }.frame(maxWidth: .infinity, minHeight: minimumHeight, alignment: .leading).modifier(
                    NativeFieldSurface(theme: context.theme))
            }.buttonStyle(.plain).disabled(!context.canInteract).accessibilityLabel(title)
                .accessibilityIdentifier("openui.date.\(field.name.displayString).\(part.key ?? "value")")
        }
    }
    private var minimumHeight: CGFloat {
        #if os(iOS)
            44
        #else
            28
        #endif
    }
    private func editor(_ value: NativeDateRequest) -> some View {
        NativeCalendarEditor(
            request: value, theme: context.theme, cancel: { request = nil },
            clear: date(value.part) == nil
                ? nil
                : {
                    NativeFieldState(context: value.context).write(.null)
                    request = nil
                },
            commit: { selected in
                write(selected, part: value.part, context: value.context)
                request = nil
            })
    }
}

private struct NativeCalendarPresentation: ViewModifier {
    @ScaledMetric(relativeTo: .body) private var height: CGFloat = 500
    @ViewBuilder func body(content: Content) -> some View {
        #if os(iOS)
            content.presentationDetents([.height(height), .large]).presentationDragIndicator(.visible)
        #else
            content
        #endif
    }
}

struct NativeCalendarEditor: View {
    let request: NativeDateRequest
    let theme: OpenUITheme
    let cancel: () -> Void
    let clear: (() -> Void)?
    let commit: (Date) -> Void
    @State private var selection: Date
    init(
        request: NativeDateRequest, theme: OpenUITheme, cancel: @escaping () -> Void,
        clear: (() -> Void)? = nil, commit: @escaping (Date) -> Void
    ) {
        self.request = request
        self.theme = theme
        self.cancel = cancel
        self.clear = clear
        self.commit = commit
        _selection = State(initialValue: request.date)
    }
    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                Button(action: cancel) { Text("Cancel", bundle: NativeControlResources.bundle) }
                    .buttonStyle(NativeActionButtonStyle(theme: theme, variant: "tertiary", size: "small"))
                    .keyboardShortcut(.cancelAction).accessibilityIdentifier("openui.date.cancel")
                Spacer(minLength: 0)
                Text(request.label).openUIFont(theme.typography.heading).foregroundStyle(theme.foreground).multilineTextAlignment(
                    .center)
                Spacer(minLength: 0)
                Button {
                    commit(selection)
                } label: {
                    Text("Done", bundle: NativeControlResources.bundle)
                }
                .buttonStyle(NativeActionButtonStyle(theme: theme, size: "small"))
                .keyboardShortcut(.defaultAction).accessibilityIdentifier("openui.date.done")
            }.padding(.horizontal, 12).padding(.top, 16).padding(.bottom, 8)
            Divider()
            ScrollView {
                DatePicker(request.label, selection: $selection, displayedComponents: .date)
                    .datePickerStyle(.graphical).labelsHidden().tint(theme.accent).padding(16)
                if let clear {
                    Button(action: clear) { Text("Clear", bundle: NativeControlResources.bundle) }
                        .buttonStyle(
                            NativeActionButtonStyle(theme: theme, variant: "tertiary", size: "small")
                        )
                        .accessibilityIdentifier("openui.date.clear")
                        .padding(.bottom, 12)
                }
            }
        }.openUIFont(theme.typography.body).foregroundStyle(theme.foreground).background(theme.controlSurface)
    }
}
