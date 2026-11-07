import Testing

@testable import OpenUILang

/// Expected values were produced by Node.js, so these pin the port to real
/// JavaScript behaviour rather than to what Swift does by default.
@Suite struct JSSemanticsTests {
  @Test(arguments: [
    (0.0, "0"), (-0.0, "0"), (1, "1"), (-1, "-1"), (0.1 + 0.2, "0.30000000000000004"),
    (100, "100"), (1e21, "1e+21"), (1e-7, "1e-7"), (1.5e-7, "1.5e-7"), (123e-20, "1.23e-18"),
    (1e20, "100000000000000000000"), (1.2345678901234568e20, "123456789012345680000"),
    (0.000001, "0.000001"), (5e-324, "5e-324"),
    (1.797_693_134_862_315_7e308, "1.7976931348623157e+308"), (.nan, "NaN"),
    (.infinity, "Infinity"), (-.infinity, "-Infinity"), (2.5, "2.5"), (-2.5e-3, "-0.0025"),
    (1.0 / 3, "0.3333333333333333"),
  ])
  func numberToString(_ value: Double, _ expected: String) {
    #expect(jsNumberToString(value) == expected)
  }

  @Test(arguments: [
    (" 12 ", 12.0), ("0x1F", 31), ("0b101", 5), ("0o17", 15), ("", 0), ("  ", 0), (".5", 0.5),
    ("5.", 5), ("Infinity", .infinity), ("-Infinity", -.infinity), ("+3", 3), ("1e+2", 100),
    ("1E-2", 0.01), ("\u{00A0}12\u{FEFF}", 12),
  ])
  func stringToNumber(_ text: String, _ expected: Double) {
    #expect(jsStringToNumber(text) == expected)
  }

  @Test(arguments: ["1e", "1_000", "12px", "-0x1F", "--1", "0.0.1"])
  func stringToNumberNaN(_ text: String) {
    #expect(jsStringToNumber(text).isNaN)
  }

  @Test func looseEquality() {
    let pairs: [(OpenUIValue, OpenUIValue, Bool)] = [
      (1, "1", true), ("1", 1, true), (0, "", true), (0, "0", true), ("", 0, true),
      (.null, .undefined, true), (.null, 0, false), (.undefined, 0, false), (true, 1, true),
      (true, "1", true), (false, "", true), ("true", true, false), ([1], 1, true),
      ([1, 2], "1,2", true), (["a": 1], "[object Object]", true),
      (.number(.nan), .number(.nan), false),
      ("a", "a", true), ([], "", true), ([.null], "", true), (2, true, false),
    ]
    for (a, b, expected) in pairs {
      #expect(a.looselyEquals(b) == expected, "\(a) == \(b)")
    }
  }

  @Test func truthiness() {
    let falsy: [OpenUIValue] = [.undefined, .null, false, 0, -0.0, .number(.nan), ""]
    let truthy: [OpenUIValue] = [true, 1, -1, "0", " ", [], [:]]
    for value in falsy { #expect(!value.isTruthy, "\(value)") }
    for value in truthy { #expect(value.isTruthy, "\(value)") }
  }

  @Test func objectKeyOrder() {
    var object = OpenUIObject()
    for key in ["b", "2", "a", "1", "10", "01"] { object[key] = .string(key) }
    // Integer-like keys first in ascending order, then insertion order ("01" is not canonical).
    #expect(object.keys == ["1", "2", "10", "b", "a", "01"])
    object["2"] = nil
    #expect(object.keys == ["1", "10", "b", "a", "01"])
  }
}
