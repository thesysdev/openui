import OpenUILang
import SwiftUI

/// A component's evaluated props, with typed accessors that tolerate the
/// missing and partial values a streaming response produces.
public struct ComponentProps {
  public let typeName: String
  public let statementId: String?
  public let values: OpenUIObject

  public init(_ element: ElementNode) {
    typeName = element.typeName
    statementId = element.statementId
    values = element.props
  }

  public subscript(key: String) -> OpenUIValue { values[key] ?? .undefined }

  /// The prop as a string, if it is one.
  public func string(_ key: String) -> String? { self[key].stringValue }

  /// The prop as display text: strings as-is, numbers and booleans formatted
  /// like JavaScript, anything else empty.
  public func text(_ key: String) -> String { displayText(self[key]) }

  public func number(_ key: String) -> Double? { self[key].numberValue }

  public func bool(_ key: String) -> Bool? { self[key].boolValue }

  public func array(_ key: String) -> [OpenUIValue] { self[key].arrayValue ?? [] }

  /// Child elements in the prop (arrays skip non-element items).
  public func elements(_ key: String) -> [ElementNode] {
    switch self[key] {
    case .element(let element): return [element]
    case .array(let items): return items.compactMap(\.elementValue)
    default: return []
    }
  }

  /// Child element props, for components that read sub-components' data
  /// (e.g. a chart reading its `Series`).
  public func children(_ key: String) -> [ComponentProps] {
    elements(key).map(ComponentProps.init)
  }
}

/// Text for scalar values: strings as-is, numbers and booleans like JavaScript.
public func displayText(_ value: OpenUIValue) -> String {
  switch value {
  case .string(let string): return string
  case .number, .bool: return value.jsString
  default: return ""
  }
}

extension Double {
  /// The number, or nil when it's infinite or NaN. Numbers in a response can
  /// be either (1e999, 0/0), and as sizes or ranges they'd break the layout.
  var finite: Double? { isFinite ? self : nil }
}
