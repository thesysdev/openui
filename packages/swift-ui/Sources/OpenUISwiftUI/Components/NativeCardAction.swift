import OpenUILang

/// Typed presentation adapter for upstream cardActionUtils' per-item context.
/// Action steps still execute through the shared ActionPlan executor.
enum NativeCardAction {
  static func itemContext(_ item: Value, kind: String, index: Int) -> [(String, Value)] {
    var values: [(String, Value?)] = [
      ("itemIndex", .number(Double(index))), ("itemId", NativeValue.prop(item, "id")),
    ]
    let prop = { (key: String) in NativeValue.prop(item, key) }
    let nested = { (key: String, name: String) in NativeValue.prop(prop(key), name) }
    switch kind {
    case "Snippet":
      values += [
        ("itemTitle", nested("lhs", "title")), ("itemSubtitle", nested("lhs", "subtitle")),
        ("itemValue", nested("rhs", "value")),
      ]
    case "Overview":
      values += [
        ("itemTitle", nested("top", "title") ?? nested("top", "value")),
        ("itemSubtitle", nested("top", "subtitle") ?? nested("top", "subtext")),
        ("itemMetricValue", nested("bottom", "value")),
      ]
    case "Context":
      values += [
        (
          "itemTitle",
          NativeValue.string(item, "title").map(Value.string) ?? nested("title", "text")
        ), ("itemBody", prop("body")), ("itemBgColor", prop("bgColor")),
        ("itemBgImageSrc", prop("bgImageSrc")), ("itemBgImageAlt", prop("bgImageAlt")),
      ]
    case "Visual":
      values += [
        ("itemTag", nested("tag", "text")), ("itemBody", nested("body", "value")),
        ("itemBodySubtext", nested("body", "subtext")), ("itemBgImageSrc", prop("bgImageSrc")),
        ("itemBgImageAlt", prop("bgImageAlt")),
      ]
    default:
      let footer = prop("footer")
      values += [
        ("itemHeaderTitle", nested("header", "title") ?? nested("header", "value")),
        ("itemHeaderSubtitle", nested("header", "subtitle") ?? nested("header", "subtext")),
        ("itemHeaderAlt", nested("header", "alt")),
        ("itemBodyCount", .number(Double(NativeValue.array(prop("body")).count))),
        ("itemFooterPrice", NativeValue.prop(NativeValue.prop(footer, "price"), "value")),
        ("itemFooterButtonLabel", NativeValue.prop(NativeValue.prop(footer, "button"), "label")),
      ]
    }
    return values.compactMap { key, value in
      guard let value, value != .undefined else { return nil }
      return (key, value)
    }
  }
  static func label(_ item: Value, kind: String, index: Int) -> String {
    let context = itemContext(item, kind: kind, index: index)
    let keys =
      kind == "Visual"
      ? ["itemBody", "itemTag", "itemId"]
      : kind == "Composite"
        ? ["itemHeaderTitle", "itemHeaderAlt", "itemId"] : ["itemTitle", "itemId"]
    for key in keys {
      if case .string(let title) = context.first(where: { $0.0 == key })?.1,
        !title.isEmpty || ["Snippet", "Overview"].contains(kind)
      {
        return title.displayString
      }
    }
    return "\(kind) card \(index + 1)"
  }
  static func action(_ action: Value, item: Value, kind: String, index: Int) -> Value {
    let fields = itemContext(item, kind: kind, index: index)
    if case .actionPlan(let plan) = action {
      let context = JSONValue.object(
        fields.map { JSONField(key: $0.0, value: (try? $0.1.jsonValue()) ?? .null) }
      ).jsonString()
      let suffix = "Selected item: " + context
      return .actionPlan(
        ActionPlan(
          steps: plan.steps.map { step in
            guard case .continueConversation(let message, let original) = step else { return step }
            // Evaluated component actions carry literal/runtime values.
            // The upstream card adapter JSON-serializes non-string context,
            // rather than JavaScript's "[object Object]" string coercion.
            let appended: ASTNode
            if let original, let value = literalValue(original), value != .null, value != .undefined
            {
              let prefix: OpenUIString
              if case .string(let text) = value {
                prefix = text
              } else {
                prefix = OpenUIString((try? value.jsonString()) ?? "null")
              }
              appended = .str(prefix + OpenUIString("\n" + suffix))
            } else if let original, literalValue(original) == nil {
              appended = .binOp("+", original, .str("\n" + suffix))
            } else {
              appended = .str(suffix)
            }
            return .continueConversation(messageAST: message, contextAST: appended)
          }))
    }
    var params: [ObjectField] = []
    if case .object(let existing) = NativeValue.prop(action, "params") { params = Array(existing) }
    for key in ["url", "context"] {
      if let value = NativeValue.prop(action, key) {
        params.removeAll { $0.key == OpenUIString(key) }
        params.append(ObjectField(key: key, value: value))
      }
    }
    for (key, value) in fields {
      params.removeAll { $0.key == OpenUIString(key) }
      params.append(ObjectField(key: key, value: value))
    }
    return .object([
      ObjectField(
        key: "type", value: NativeValue.prop(action, "type") ?? .string("continue_conversation")),
      ObjectField(key: "params", value: .object(params)),
    ])
  }
}
