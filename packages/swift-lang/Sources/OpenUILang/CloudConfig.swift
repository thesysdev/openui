/// OpenUI Cloud's managed system prompt. Port of lang-core's
/// `parser/cloud-config.ts` and `parser/validate-library.ts`.

/// The config block header. The trailing newline is part of the wire contract.
private let cloudConfigMarker = "]]>openui:config\n"

/// The version of Cloud's built-in chat library requested when no library is
/// given. Cloud rejects a non-numeric or too-old version.
private let cloudChatLibraryVersion = "0.1.0"

/// A library OpenUI Cloud can't use, or prompt options it can't apply.
public struct CloudConfigError: Error, CustomStringConvertible {
  public var description: String
}

/// OpenUI Cloud's config block: the Swift version of
/// `generateSystemPrompt({ cloud: true, library, promptOptions, instructions })`.
///
/// Send it as the system message and Cloud builds the full prompt on its side.
/// Without a library, Cloud uses its built-in chat library. Only `preamble`,
/// `additionalRules` and `examples` are sent; Cloud ignores the other options.
///
/// - Parameter library: A `LibrarySpec`, as returned by `Library.toSpec()`.
/// - Throws: ``CloudConfigError`` when the library is malformed, or when
///   prompt options are given without a library.
public func generateCloudConfig(
  library: OpenUIValue? = nil, promptOptions: PromptOptions? = nil, instructions: String? = nil
) throws -> String {
  var config = OpenUIObject()
  if let library, library.isTruthy {
    let issues = validateChatLibrary(library)
    if !issues.isEmpty {
      throw CloudConfigError(
        description:
          "[generateSystemPrompt] Invalid library: \(issues.joined(separator: " "))")
    }
    var chatLibrary = library.objectValue ?? OpenUIObject()
    chatLibrary["components"] = nil
    config["chatLibrary"] = .object(chatLibrary)
    if let options = promptOptions.flatMap(cloudPromptOptions) {
      config["systemPromptOptions"] = .object(options)
    }
  } else {
    if promptOptions.flatMap(cloudPromptOptions) != nil {
      throw CloudConfigError(
        description:
          "[generateSystemPrompt] promptOptions requires a library — the built-in library ignores it."
      )
    }
    config["libraryVersion"] = .string(cloudChatLibraryVersion)
  }

  let block = cloudConfigMarker + JSON.stringify(.object(config))
  if let instructions, !instructions.isEmpty { return "\(block)\n\(instructions)" }
  return block
}

extension Library {
  /// This library's OpenUI Cloud config block. See ``generateCloudConfig(library:promptOptions:instructions:)``.
  public func cloudConfig(_ options: PromptOptions? = nil, instructions: String? = nil) throws
    -> String
  {
    try generateCloudConfig(library: toSpec(), promptOptions: options, instructions: instructions)
  }
}

/// The options Cloud's prompt assembler reads, in lang-core's key order, or
/// nil when none are set. An empty `preamble` counts as unset, like in JavaScript.
private func cloudPromptOptions(_ options: PromptOptions) -> OpenUIObject? {
  var picked = OpenUIObject()
  if let examples = options.examples { picked["examples"] = .array(examples.map { .string($0) }) }
  if let preamble = options.preamble, !preamble.isEmpty { picked["preamble"] = .string(preamble) }
  if let rules = options.additionalRules {
    picked["additionalRules"] = .array(rules.map { .string($0) })
  }
  return picked.isEmpty ? nil : picked
}

// MARK: - Library validation

/// Structural checks Cloud applies to a library, reporting every issue in one
/// pass. lang-core's issues also carry a code and a path, but only their
/// messages are ever read, so these are the messages.
func validateChatLibrary(_ library: OpenUIValue) -> [String] {
  guard let spec = library.objectValue else {
    return ["chatLibrary must be an object."]
  }
  var issues: [String] = []

  let root = spec["root"] ?? .undefined
  let rootName = root.stringValue.flatMap { $0.isEmpty ? nil : $0 }
  if root != .undefined, rootName == nil {
    issues.append("chatLibrary.root, when present, must be a non-empty string.")
  }

  guard let schema = spec["schema"]?.objectValue else {
    issues.append("chatLibrary.schema must be an object with a $defs map of component schemas.")
    return issues
  }
  guard let defs = schema["$defs"]?.objectValue, !defs.isEmpty else {
    issues.append("chatLibrary.schema.$defs must be a non-empty object keyed by component name.")
    return issues
  }
  let defNames = Set(defs.keys)

  if let rootName, !defNames.contains(rootName) {
    issues.append(
      "Root component \"\(rootName)\" was not found in schema.$defs. Available components: \(defs.keys.joined(separator: ", "))."
    )
  }

  for (name, def) in defs.entries {
    let defPath = "$defs/\(name)"
    guard let component = def.objectValue else {
      issues.append("\(defPath) must be an object component schema.")
      continue
    }

    let properties = component["properties"] ?? .undefined
    if properties != .undefined, properties.objectValue == nil {
      issues.append("\(defPath)/properties must be an object.")
    }

    let required = component["required"] ?? .undefined
    if required != .undefined {
      let names = required.arrayValue?.map(\.stringValue)
      if let names, names.allSatisfy({ $0 != nil }) {
        let propKeys = Set(properties.objectValue?.keys ?? [])
        for case let name? in names where !propKeys.contains(name) {
          issues.append("\(defPath) lists required property \"\(name)\" that is not in properties.")
        }
      } else {
        issues.append("\(defPath)/required must be an array of property names.")
      }
    }

    collectRefIssues(properties, "\(defPath)/properties", defNames, &issues)
  }

  for group in spec["componentGroups"]?.arrayValue ?? [] {
    guard let groupName = group["name"].stringValue, let components = group["components"].arrayValue
    else {
      issues.append(
        "Each componentGroups entry must be {name: string, components: string[], notes?: string[]}."
      )
      continue
    }
    for component in components
    where !(component.stringValue.map { defNames.contains($0) } ?? false) {
      issues.append(
        "Component group \"\(groupName)\" references unknown component \"\(component.jsString)\".")
    }
  }

  return issues
}

/// Checks every `$ref` below `node` resolves to a component in `$defs`.
private func collectRefIssues(
  _ node: OpenUIValue, _ path: String, _ defNames: Set<String>, _ issues: inout [String]
) {
  if let items = node.arrayValue {
    for (i, item) in items.enumerated() {
      collectRefIssues(item, "\(path)/\(i)", defNames, &issues)
    }
    return
  }
  guard let object = node.objectValue else { return }

  if let ref = object["$ref"]?.stringValue, !refResolves(ref, defNames) {
    issues.append(
      "Unresolvable $ref \"\(ref)\" at \(path) — refs must be \"#/$defs/<name>\" pointing at a component in $defs."
    )
  }
  for (key, value) in object.entries where key != "$ref" {
    collectRefIssues(value, "\(path)/\(key)", defNames, &issues)
  }
}

/// `/^#\/\$defs\/(.+)$/` plus a `$defs` lookup. `.` doesn't match line terminators.
private func refResolves(_ ref: String, _ defNames: Set<String>) -> Bool {
  let prefix = "#/$defs/"
  guard ref.hasPrefix(prefix) else { return false }
  let name = String(ref.dropFirst(prefix.count))
  let lineTerminators: Set<Character> = ["\n", "\r", "\r\n", "\u{2028}", "\u{2029}"]
  return !name.isEmpty && !name.contains(where: lineTerminators.contains) && defNames.contains(name)
}
