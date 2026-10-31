import Foundation
import JavaScriptCore
import OpenUILang
import SwiftUI

#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

struct NativeCodeToken: Sendable, Equatable {
  let text: String
  let types: [String]
}

/// The same refractor grammars used by the upstream Prism renderer. This realm
/// only tokenizes strings; it is separate from OpenUI Lang and never runs code
/// supplied by a model. A serialized worker keeps tokenization off the UI thread.
final class NativeCodeSyntax: @unchecked Sendable {
  static let shared = NativeCodeSyntax()
  private let lock = NSLock()
  private var context: JSContext?

  func tokens(code: String, language: String) -> [NativeCodeToken] {
    let plain = [NativeCodeToken(text: code, types: [])]
    lock.lock()
    defer { lock.unlock() }
    guard !Task.isCancelled else { return plain }
    if context == nil {
      guard let url = NativeControlResources.bundle.url(forResource: "code-highlighting", withExtension: "js"),
        let source = try? String(contentsOf: url, encoding: .utf8), let candidate = JSContext()
      else { return plain }
      candidate.exceptionHandler = { _, _ in }
      candidate.evaluateScript(source, withSourceURL: url)
      guard candidate.exception == nil else { return plain }
      context = candidate
    }
    guard let context else { return plain }
    defer { context.exception = nil }
    let output = context.objectForKeyedSubscript("NativeCodeSyntax")
      .invokeMethod("highlight", withArguments: [code, language])
    guard context.exception == nil, let rows = output?.toArray() as? [[String: Any]] else { return plain }
    let tokens = rows.compactMap { row -> NativeCodeToken? in
      guard let text = row["text"] as? String, let types = row["types"] as? [String] else { return nil }
      return NativeCodeToken(text: text, types: types)
    }
    // Highlighting must never change the code, including whitespace and Unicode.
    guard tokens.map(\.text).joined().utf16.elementsEqual(code.utf16) else { return plain }
    return tokens
  }
}

struct NativeCodeBlock: View {
  let context: OpenUIComponentContext
  var body: some View {
    NativeCodeBlockContent(code: context.codeUnitString("codeString") ?? "",
      language: context.codeUnitString("language") ?? "", theme: context.theme)
  }
}

struct NativeCodeBlockContent: View {
  let code: OpenUIString
  let language: OpenUIString
  let theme: OpenUITheme
  @State private var tokens: [NativeCodeToken] = []
  @State private var highlighted: Source?
  @State private var copied = false

  private struct Source: Hashable, Sendable { let code: OpenUIString; let language: OpenUIString }
  private var source: Source {
    Source(code: code, language: language)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: theme.spacing("2xs")) {
      HStack(spacing: theme.spacing("m")) {
        Text(source.language.displayString).openUIFont(theme.typography.caption).foregroundStyle(theme.secondary)
        Spacer(minLength: 0)
        Button(action: copy) {
          Image(systemName: copied ? "checkmark" : "doc.on.doc")
            .openUIFont(theme.typography.detail)
            .frame(width: 44, height: 44).contentShape(Rectangle())
        }.buttonStyle(.plain)
          .accessibilityLabel(Text(copied ? "Copied to clipboard" : "Copy code", bundle: NativeControlResources.bundle))
          .accessibilityValue(copied ? "copied" : "ready")
          .accessibilityIdentifier("openui.code.copy")
      }
      ScrollView(.horizontal) {
        codeText.openUIFont(theme.typography.code).textSelection(.enabled)
          .fixedSize(horizontal: true, vertical: false)
          .accessibilityIdentifier("openui.code.content")
      }
    }
    .padding(.horizontal, theme.cardPadding).padding(.bottom, theme.cardPadding)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(theme.surface, in: RoundedRectangle(cornerRadius: theme.controlCornerRadius))
    .accessibilityElement(children: .contain).accessibilityIdentifier("openui.code-block")
    .task(id: source) {
      let request = source
      let worker = Task.detached(priority: .userInitiated) {
        NativeCodeSyntax.shared.tokens(code: request.code.displayString, language: request.language.displayString)
      }
      let result = await withTaskCancellationHandler(operation: { await worker.value }, onCancel: { worker.cancel() })
      guard !Task.isCancelled else { return }
      tokens = result
      highlighted = request
    }
    .task(id: copied) {
      guard copied else { return }
      try? await Task.sleep(nanoseconds: 1_000_000_000)
      guard !Task.isCancelled else { return }
      copied = false
    }
    .onChange(of: source) { _ in copied = false }
  }

  private var codeText: Text {
    guard highlighted == source else { return Text(verbatim: source.code.displayString).foregroundColor(theme.foreground) }
    return tokens.reduce(Text("")) { result, token in
      var text = Text(verbatim: token.text).foregroundColor(color(for: token.types))
      if token.types.contains("bold") || token.types.contains("important") { text = text.bold() }
      if token.types.contains("italic") { text = text.italic() }
      return result + text
    }
  }

  private func color(for types: [String]) -> Color {
    for type in types.reversed() {
      switch type {
      case "comment", "prolog", "doctype", "cdata": return NativeControlPalette.adaptive(light: 0x55734D, dark: 0x81A875)
      case "keyword", "atrule", "tag": return NativeControlPalette.adaptive(light: 0x275EB3, dark: 0x7EAAE8)
      case "string", "char", "attr-value", "inserted": return NativeControlPalette.adaptive(light: 0xA14C35, dark: 0xDCA189)
      case "number", "boolean", "constant": return NativeControlPalette.adaptive(light: 0x25735C, dark: 0xA6C5A4)
      case "function", "class-name", "builtin": return NativeControlPalette.adaptive(light: 0x815A22, dark: 0xD5C28C)
      case "operator", "punctuation": return theme.secondary
      default: continue
      }
    }
    return theme.foreground
  }

  private func copy() {
    #if canImport(UIKit)
    UIPasteboard.general.string = source.code.displayString
    #elseif canImport(AppKit)
    NSPasteboard.general.clearContents()
    NSPasteboard.general.setString(source.code.displayString, forType: .string)
    #endif
    copied = true
  }
}
