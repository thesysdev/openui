import Foundation
import JavaScriptCore
import OpenUILang

enum NativeRichTextMode: String, Sendable { case markdown, textContent, inline }

enum NativeRichTextError: Error { case missingResource, script(String), invalidMathURL }

/// Executes the upstream remark citation plugin and pinned remark/KaTeX packages.
/// Input is passed as data. No application or generated code is evaluated here.
final class NativeRichTextEngine: @unchecked Sendable {
  static let shared = NativeRichTextEngine()
  private let lock = NSRecursiveLock()
  private var context: JSContext?

  private func call(_ name: String, _ arguments: [Any]) throws -> String? {
    lock.lock(); defer { lock.unlock() }
    try Task.checkCancellation()
    if context == nil {
      guard let url = NativeControlResources.bundle.url(forResource: "rich-text", withExtension: "js"),
        let source = try? String(contentsOf: url, encoding: .utf8), let candidate = JSContext()
      else { throw NativeRichTextError.missingResource }
      candidate.exceptionHandler = { _, _ in }
      candidate.evaluateScript(source, withSourceURL: url)
      if let error = candidate.exception { throw NativeRichTextError.script(error.toString()) }
      context = candidate
    }
    guard let context else { throw NativeRichTextError.missingResource }
    defer { context.exception = nil }
    let result = context.objectForKeyedSubscript("NativeRichText").invokeMethod(name, withArguments: arguments)
    if let error = context.exception { throw NativeRichTextError.script(error.toString()) }
    guard let result, !result.isNull, !result.isUndefined else { return nil }
    return result.toString()
  }

  func prepare(_ text: String, mode: NativeRichTextMode, sources: [CardSource], fontSize: Double = 17, color: String = "#202124") throws -> String {
    let values: [[String: String]] = sources.map { ["title": $0.title, "sourceName": $0.sourceName] }
    return try call("prepare", [text, mode.rawValue, values, ["fontSize": fontSize, "color": color] as [String: Any]]) ?? text
  }
  func mathHTML(_ descriptor: NativeMathDescriptor) throws -> String {
    try call("math", [descriptor.tex, descriptor.display]) ?? ""
  }
  func sourceURL(_ value: String?) -> String? {
    guard let value else { return nil }
    return try? call("sourceURL", [value])
  }
}

struct NativeMathDescriptor: Codable, Hashable, Sendable {
  let tex: String
  let display: Bool
  init?(url: URL) {
    guard url.scheme == "openui-math", let value = URLComponents(url: url, resolvingAgainstBaseURL: false)?
      .queryItems?.first(where: { $0.name == "value" })?.value,
      let data = value.data(using: .utf8), let descriptor = try? JSONDecoder().decode(Self.self, from: data)
    else { return nil }
    self = descriptor
  }
  init(tex: String, display: Bool) { self.tex = tex; self.display = display }
}

struct NativeRichTextRequest: Hashable, Sendable {
  let source: OpenUIString
  let mode: NativeRichTextMode
  let sources: [CardSource]
  let fontSize: Double
  let color: String
}
