import COpenUIRegExp

enum RegExpResult: Equatable { case matches, noMatch, invalidPattern, resourceError }

func testRegExp(_ pattern: OpenUIString, value: OpenUIString) -> RegExpResult {
    let result = pattern.codeUnits.withUnsafeBufferPointer { expression in
        value.codeUnits.withUnsafeBufferPointer { text in
            openui_regexp_test(expression.baseAddress, expression.count, text.baseAddress, text.count)
        }
    }
    switch result {
    case 1: return .matches
    case 0: return .noMatch
    case -1: return .invalidPattern
    default: return .resourceError
    }
}
