import XCTest
@testable import OpenUISwiftUI

final class NativeCodeSyntaxTests: XCTestCase {
  func testUpstreamGrammarsHighlightDifferentLanguagesAndPreserveTheirSource() {
    for (language, source) in [
      ("swift", "let city = \"Kyoto\"\nprint(city)\n"),
      ("javascript", "const city = \"Kyoto\";\nconsole.log(city);\n"),
      ("python", "def hello(name):\n    return f\"Hello {name}\"\n"),
      ("json", "{\"city\":\"Kyoto\",\"days\":2,\"open\":true}"),
      ("sql", "SELECT name FROM places WHERE rating > 4;"),
    ] {
      let tokens = NativeCodeSyntax.shared.tokens(code: source, language: language)
      XCTAssertEqual(tokens.map(\.text).joined(), source, language)
      XCTAssertTrue(tokens.contains { !$0.types.isEmpty }, "The bundled upstream grammar must actually tokenize " + language)
    }
  }

  func testWhitespaceUnicodeAliasesAndUnknownLanguagesStayLossless() {
    let source = "// e\u{301} · é · 🙂\r\nconst city = \"杭州\";\n\tconsole.log(city);  \n"
    let tokens = NativeCodeSyntax.shared.tokens(code: source, language: "js")
    XCTAssertTrue(tokens.map(\.text).joined().utf16.elementsEqual(source.utf16))
    XCTAssertTrue(tokens.contains { $0.types.contains("keyword") })
    let plain = NativeCodeSyntax.shared.tokens(code: source, language: "not-a-registered-language")
    XCTAssertEqual(plain, [NativeCodeToken(text: source, types: [])])
    XCTAssertEqual(NativeCodeSyntax.shared.tokens(code: "", language: "swift").map(\.text).joined(), "")
  }
}
