// OpenUILang — Form validation rules.
//
// Typed bindings to utils/validation.ts (spec §5.4): the 9 built-in rules
// (required, email, url, numeric, min, max, minLength, maxLength, pattern).
// Every rule except `required` skips empty values; the first failing rule wins.

import Foundation
import JavaScriptCore

/// A rule parameter: the numeric arg of min/max/minLength/maxLength,
/// or the pattern string of `pattern`.
public enum ValidationRuleParameter: Sendable, Equatable {
    case number(Double)
    case string(OpenUIString)
    case value(Value)
}

/// A parsed validation rule. Mirrors `ParsedRule` from utils/validation.ts.
public struct ParsedRule: Sendable, Equatable {
    public var type: String
    public var arg: ValidationRuleParameter?
    public init(type: String, arg: ValidationRuleParameter? = nil) {
        self.type = type
        self.arg = arg
    }
}

/// Host rule types projected to the shared validator.
public typealias ValidatorFn = (Value, ValidationRuleParameter?) -> String?

public func parseStructuredRules(_ json: JSONValue) -> [ParsedRule] {
    let core = SharedCore.shared
    return core.sync { core.items(core.core("parseStructuredRules", [core.json(json)])).map(core.rule) }
}
public func parseRules(_ rules: JSONValue) -> [ParsedRule] {
    let core = SharedCore.shared
    return core.sync { core.items(core.core("parseRules", [core.json(rules)])).map(core.rule) }
}
public func parseRule(_ rule: String) -> ParsedRule { parseRule(OpenUIString(rule)) }
public func parseRule(_ rule: OpenUIString) -> ParsedRule {
    let core = SharedCore.shared
    return core.sync { core.rule(core.items(core.core("parseRules", [core.array([core.string(rule)])])).first!) }
}
public func validate(_ value: Value, rules: [ParsedRule], customValidators: [String: ValidatorFn] = [:]) -> String? {
    let core = SharedCore.shared
    return core.sync {
        for rule in rules {
            if let custom = customValidators[rule.type] {
                if let message = custom(value, rule.arg), !message.isEmpty { return message }
                continue
            }
            let result = core.core("validate", [core.encode(value), core.array([core.rule(rule)])])
            if !result.isUndefined, !result.isNull, let text = result.toString(), !text.isEmpty { return text }
        }
        return nil
    }
}
