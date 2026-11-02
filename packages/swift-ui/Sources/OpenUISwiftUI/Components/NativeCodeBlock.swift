import Foundation
import OpenUILang
import SwiftUI

#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

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
  let theme: OpenUIThemeValues
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
        Text(source.language.displayString).openUIFont(theme.textBodyXs).foregroundStyle(theme.textNeutralSecondary)
        Spacer(minLength: 0)
        Button(action: copy) {
          Image(systemName: copied ? "checkmark" : "doc.on.doc")
            .openUIFont(theme.textBodySm)
            .openUIControlTarget()
        }.buttonStyle(.plain)
          .accessibilityLabel(Text(copied ? "Copied to clipboard" : "Copy code", bundle: NativeControlResources.bundle))
          .accessibilityValue(copied ? "copied" : "ready")
          .accessibilityIdentifier("openui.code.copy")
      }
      ScrollView(.horizontal) {
        codeText.openUIFont(theme.textCodeDefault).textSelection(.enabled)
          .fixedSize(horizontal: true, vertical: false)
          .accessibilityIdentifier("openui.code.content")
      }
    }
    .padding(.horizontal, theme.spaceM).padding(.bottom, theme.spaceM)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(theme.sunk, in: RoundedRectangle(cornerRadius: theme.radiusL))
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
    guard highlighted == source else { return Text(verbatim: source.code.displayString).foregroundColor(theme.textNeutralPrimary) }
    return tokens.reduce(Text("")) { result, token in
      var text = Text(verbatim: token.text).foregroundColor(NativeControlPalette.syntaxColor(for: token.types, theme: theme))
      if token.types.contains("bold") || token.types.contains("important") { text = text.bold() }
      if token.types.contains("italic") { text = text.italic() }
      return result + text
    }
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
