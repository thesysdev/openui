import Foundation
import JavaScriptCore

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


