/// OpenUI Cloud's inline message format: the markers that separate a message's
/// openui-lang content from the context it carries (form state, what the user
/// clicked). Port of react-ui's `utils/sentinelParser.ts`, plus the messages
/// react-ui's `GenUIAssistantMessage` builds with it.
///
/// Like the JavaScript, this works on UTF-16 code units, so `\r\n` is two
/// units rather than one Swift `Character`.

private let inlineSentinel = "]]>openui:"
private let contentMarker = Array("\(inlineSentinel)content".utf16)
private let contextMarker = Array("\(inlineSentinel)context".utf16)
private let endMarker = Array("\(inlineSentinel)end".utf16)
private let artifactPrefix = Array("\(inlineSentinel)artifact ".utf16)

/// Tokens whose partial prefix can sit at the tail of a still-streaming chunk.
/// Trimming keeps a half-arrived marker from flashing as raw text; the next
/// delta re-parses the whole message, so a false positive is transient.
private let streamPartialTokens = [contentMarker, contextMarker, endMarker]

private let newline = UInt16(ascii: "\n")
private let carriageReturn = UInt16(ascii: "\r")

/// A message split into its sections.
public struct ParsedMessageContent: Sendable, Equatable {
  /// The openui-lang program (or plain text) to render.
  public var content: String
  /// The context section's JSON, if there is one.
  public var contextString: String?
  /// The content marker line, attributes included, so it can be written back
  /// unchanged when the message is saved again.
  public var contentHeader: String?
  /// Whether the `]]>openui:end` marker was present: the stream reached its
  /// last chunk. A saved message without it was cut off mid-stream.
  public var end: Bool

  public init(
    content: String, contextString: String? = nil, contentHeader: String? = nil, end: Bool = false
  ) {
    self.content = content
    self.contextString = contextString
    self.contentHeader = contentHeader
    self.end = end
  }
}

/// `text` as a content section.
public func wrapContent(_ text: String) -> String {
  "\(inlineSentinel)content\n\(text)"
}

/// `text` as a content section under its original header line, so the
/// header's attributes survive saving form state into the message.
public func wrapContentWithHeader(_ text: String, _ contentHeader: String?) -> String {
  if let contentHeader, !contentHeader.isEmpty { return "\(contentHeader)\n\(text)" }
  return wrapContent(text)
}

/// `json` as a context section, to append after the content.
public func wrapContext(_ json: String) -> String {
  "\n\(inlineSentinel)context\n\(json)"
}

/// Separates a message's content from its context, dropping what is only
/// noise for display: the end marker and a marker cut off at the end of a
/// streaming chunk.
public func separateContentAndContext(_ raw: String) -> ParsedMessageContent {
  let (text, end) = extractEndMarker(Array(raw.utf16))
  let sections = splitSections(text)
  return ParsedMessageContent(
    content: string(stripStreamingTail(sections.content)),
    contextString: sections.context.map(string),
    contentHeader: sections.header.map(string), end: end)
}

/// Whether the content holds openui-lang: the ```` ```openui-lang ```` fence,
/// or an unfenced top-level `root =` statement.
public func hasLangSyntax(_ content: String?) -> Bool {
  guard let content, !content.isEmpty else { return false }
  if content.contains("```openui-lang") { return true }
  // /(^|\n)\s*root\s*=/
  let units = Array(content.utf16)
  let root = Array("root".utf16)
  for start in units.indices where start == 0 || units[start - 1] == newline {
    var index = skipWhitespace(units, from: start)
    guard units[index...].starts(with: root) else { continue }
    index = skipWhitespace(units, from: index + root.count)
    if index < units.count, units[index] == UInt16(ascii: "=") { return true }
  }
  return false
}

// MARK: Messages react-ui's chat builds

/// The user message react-ui's chat sends for a `continue_conversation`
/// action: the action's text as content, and as context what the user clicked
/// plus the form's values.
public func continueConversationMessage(_ event: ActionEvent) -> String {
  let content = event.humanFriendlyMessage.isEmpty ? "" : wrapContent(event.humanFriendlyMessage)
  var context: [OpenUIValue] = [.string("User clicked: \(event.humanFriendlyMessage)")]
  if let formState = event.formState { context.append(.object(formState)) }
  return content + wrapContext(JSON.stringify(.array(context)))
}

/// An assistant message with the state its UI holds (form values, `$state`),
/// for saving with the conversation. Pass the parsed content and header; with
/// no state, the message is just the content.
public func messageWithState(content: String, contentHeader: String?, state: OpenUIObject)
  -> String
{
  let message = wrapContentWithHeader(content, contentHeader)
  guard !state.isEmpty else { return message }
  return message + wrapContext(JSON.stringify(.array([.object(state)])))
}

/// The state saved in a message's context (see ``messageWithState``), for the
/// renderer's `initialState`.
public func initialState(fromContext contextString: String?) -> OpenUIObject? {
  guard let contextString, let parsed = try? JSON.parse(contextString) else { return nil }
  switch parsed {
  case .array(let items): return items.first?.objectValue
  case .object(let object): return object
  default: return nil
  }
}

// MARK: Artifacts

/// The kinds of artifact Cloud produces.
public enum ArtifactKind: String, Sendable, Equatable {
  case slides
  case report
}

/// An artifact's header: which artifact, and what kind.
public struct ArtifactSentinelHeader: Sendable, Equatable {
  public var artifactId: String
  public var type: ArtifactKind
  public var name: String?
  public var version: String?
}

/// Parses the artifact carrier `]]>openui:artifact <header-json>\n<program>`,
/// which arrives as a tool result. The program is empty on a reload that
/// stripped it. Returns `nil` for anything that isn't a valid carrier.
public func parseArtifactSentinel(_ raw: String) -> (
  header: ArtifactSentinelHeader, program: String
)? {
  let units = Array(raw.utf16)
  guard units.starts(with: artifactPrefix) else { return nil }
  let newlineIndex = units.firstIndex(of: newline)
  let header = string(units[artifactPrefix.count..<(newlineIndex ?? units.count)])
  let program = newlineIndex.map { string(units[($0 + 1)...]) } ?? ""
  guard let fields = (try? JSON.parse(header))?.objectValue,
    let id = fields["artifact_id"]?.stringValue, !id.isEmpty,
    let type = fields["type"]?.stringValue.flatMap(artifactKind)
  else { return nil }
  let name = fields["name"]?.stringValue.flatMap { $0.isEmpty ? nil : $0 }
  let version = fields["version"]?.stringValue.flatMap { $0.isEmpty ? nil : $0 }
  return (ArtifactSentinelHeader(artifactId: id, type: type, name: name, version: version), program)
}

private func artifactKind(_ type: String) -> ArtifactKind? {
  switch type {
  case "slides", "presentation": return .slides
  case "report": return .report
  default: return nil
  }
}

// MARK: - Sections

private typealias Units = ArraySlice<UInt16>

private func string(_ units: Units) -> String { String(decoding: units, as: UTF16.self) }

/// The ordered walk over the inline-sentinel sections.
private func splitSections(_ raw: Units) -> (content: Units, context: Units?, header: Units?) {
  let lastContent = lastIndex(of: contentMarker, in: raw)
  let lastContext = lastIndex(of: contextMarker, in: raw)

  // No inline markers: fall back to the old XML envelope, so messages saved
  // by older app versions still load.
  guard lastContent != nil || lastContext != nil else {
    let legacy = parseLegacyXML(raw)
    return (legacy.content, legacy.context, nil)
  }
  guard let content = lastContent else {
    return (stripSectionSeparator(raw[..<lastContext!]), raw[bodyStart(raw, lastContext!)...], nil)
  }
  let header = raw[content..<(firstIndex(of: newline, in: raw, from: content) ?? raw.endIndex)]
  guard let context = lastContext, context > content else {
    return (raw[bodyStart(raw, content)...], nil, header)
  }
  let body = raw[min(bodyStart(raw, content), context)..<context]
  return (stripSectionSeparator(body), raw[bodyStart(raw, context)...], header)
}

/// Removes every `]]>openui:end` marker line and reports whether there was
/// one. The newline before the marker goes with it, attributes on the marker
/// line are ignored, and text after the line stays with its section.
private func extractEndMarker(_ raw: [UInt16]) -> (Units, Bool) {
  var text = Units(raw)
  var end = false
  while let index = firstIndex(of: endMarker, in: text) {
    end = true
    let before = stripSectionSeparator(text[..<index])
    let after = firstIndex(of: newline, in: text, from: index).map { text[($0 + 1)...] } ?? []
    text = after.isEmpty ? Units(before) : Units(before + [newline] + after)
  }
  return (text, end)
}

/// Trims a proper prefix of a marker at the very end of the content. Whole
/// markers are handled by the section walk; this only hides the frame where a
/// chunk boundary splits one.
private func stripStreamingTail(_ content: Units) -> Units {
  var trim = 0
  for token in streamPartialTokens {
    var length = min(token.count - 1, content.count)
    while length > trim {
      if content.suffix(length).elementsEqual(token.prefix(length)) {
        trim = length
        break
      }
      length -= 1
    }
  }
  return trim > 0 ? stripSectionSeparator(content.dropLast(trim)) : content
}

private func bodyStart(_ raw: Units, _ marker: Int) -> Int {
  firstIndex(of: newline, in: raw, from: marker).map { $0 + 1 } ?? raw.endIndex
}

private func stripSectionSeparator(_ value: Units) -> Units {
  if value.count >= 2, value.suffix(2).elementsEqual([carriageReturn, newline]) {
    return value.dropLast(2)
  }
  return value.last == newline ? value.dropLast() : value
}

/// The deprecated `<content>`/`<context>` XML envelope, kept only to read
/// messages saved before the inline markers.
private func parseLegacyXML(_ raw: Units) -> (content: Units, context: Units?) {
  var content = raw
  var context: Units?

  // /<context>([\s\S]*)<\/context>\s*$/
  let open = Array("<context>".utf16)
  let close = Array("</context>".utf16)
  if let closeIndex = lastIndex(of: close, in: raw),
    isWhitespace(raw[(closeIndex + close.count)...]),
    let openIndex = firstIndex(of: open, in: raw), openIndex + open.count <= closeIndex
  {
    context = raw[(openIndex + open.count)..<closeIndex]
    content = Units(Array(jsTrimEnd(string(raw[..<openIndex])).utf16))
  }

  // /^<content[^>]*>([\s\S]*)<\/content>\s*$/
  let contentOpen = Array("<content".utf16)
  let contentClose = Array("</content>".utf16)
  if content.starts(with: contentOpen),
    let tagEnd = firstIndex(of: [UInt16(ascii: ">")], in: content, from: content.startIndex),
    let closeIndex = lastIndex(of: contentClose, in: content), closeIndex >= tagEnd + 1,
    isWhitespace(content[(closeIndex + contentClose.count)...])
  {
    content = content[(tagEnd + 1)..<closeIndex]
  }
  return (content, context)
}

// MARK: - UTF-16 search

private func firstIndex(of needle: [UInt16], in haystack: Units, from start: Int? = nil) -> Int? {
  var index = start ?? haystack.startIndex
  while index + needle.count <= haystack.endIndex {
    if haystack[index..<(index + needle.count)].elementsEqual(needle) { return index }
    index += 1
  }
  return nil
}

private func firstIndex(of unit: UInt16, in haystack: Units, from start: Int) -> Int? {
  haystack[start...].firstIndex(of: unit)
}

private func lastIndex(of needle: [UInt16], in haystack: Units) -> Int? {
  var index = haystack.endIndex - needle.count
  while index >= haystack.startIndex {
    if haystack[index..<(index + needle.count)].elementsEqual(needle) { return index }
    index -= 1
  }
  return nil
}

private func isWhitespace(_ units: Units) -> Bool {
  units.allSatisfy { Unicode.Scalar($0).map(jsWhitespace.contains) ?? false }
}

private func skipWhitespace(_ units: [UInt16], from start: Int) -> Int {
  var index = start
  while index < units.count, Unicode.Scalar(units[index]).map(jsWhitespace.contains) ?? false {
    index += 1
  }
  return index
}
