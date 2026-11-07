// Signature rules are owned by lang-core; Swift retains literal codecs.
import Foundation

public func buildSignature(name: String, params: [ParamDef], actionNames: Set<String> = ["OpenUrl", "ToAssistant"]) -> String {
    let core = SharedCore.shared
    return core.sync {
        core.call("nativeSignature", [name, core.array(params.map(core.authoringParameter)), actionNames.sorted()]).toString()
    }
}

/// A string as a JSON string literal, like JSON.stringify.
public func jsonStringLiteral(_ s: String) -> String {
    var out = "\""
    for scalar in s.unicodeScalars {
        switch scalar.value {
        case 0x22: out += "\\\""
        case 0x5C: out += "\\\\"
        case 0x08: out += "\\b"
        case 0x0C: out += "\\f"
        case 0x0A: out += "\\n"
        case 0x0D: out += "\\r"
        case 0x09: out += "\\t"
        default:
            if scalar.value < 0x20 {
                out += String(format: "\\u%04x", scalar.value)
            } else {
                out += String(scalar)
            }
        }
    }
    out += "\""
    return out
}

/// A number rendered like JavaScript's String(n): no trailing ".0".
public func jsNumberString(_ number: Double) -> String {
    let core = SharedCore.shared
    return core.sync { core.call("numberText", [number]).toString() }
}
