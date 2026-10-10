import SwiftUI

/// Syntax colors for code, standing in for react-ui's Prism highlighting: the
/// same token kinds and the same two themes (`vscDarkPlus` for `CodeBlock`,
/// `oneLight` or `vscDarkPlus` for code in markdown). A small tokenizer
/// instead of a dependency: comments, strings, numbers, keywords, calls, types,
/// properties, JSON keys and markup tags cover what models write.
enum SyntaxHighlighter {
  enum Token: Equatable {
    case plain, comment, string, number, keyword, control, constant, function, type, property
    case tag, attribute, punctuation
  }

  /// Colors per token kind, from react-syntax-highlighter's Prism themes.
  struct Theme: Sendable {
    var background: Color
    var plain: Color
    var colors: [Token: Color]
    /// Prism themes color a language's plain words differently, e.g.
    /// `vscDarkPlus` shows JavaScript variables in light blue.
    var languagePlain: [String: Color] = [:]

    func color(_ token: Token, language: String?) -> Color {
      if token == .plain { return language.flatMap { languagePlain[$0.lowercased()] } ?? plain }
      return colors[token] ?? plain
    }

    static let darkPlus = Theme(
      background: hex(0x1E1E1E), plain: hex(0xD4D4D4),
      colors: [
        .comment: hex(0x6A9955), .string: hex(0xCE9178), .number: hex(0xB5CEA8),
        .keyword: hex(0x569CD6), .control: hex(0xC586C0), .constant: hex(0x569CD6),
        .function: hex(0xDCDCAA), .type: hex(0x4EC9B0), .property: hex(0x9CDCFE),
        .tag: hex(0x569CD6), .attribute: hex(0x9CDCFE), .punctuation: hex(0xD4D4D4),
      ],
      languagePlain: [
        "javascript": hex(0x9CDCFE), "js": hex(0x9CDCFE), "jsx": hex(0x9CDCFE),
        "typescript": hex(0x9CDCFE), "ts": hex(0x9CDCFE), "tsx": hex(0x9CDCFE),
        "css": hex(0xCE9178),
      ])

    static let oneLight = Theme(
      background: hsl(230, 1, 98), plain: hsl(230, 8, 24),
      colors: [
        .comment: hsl(230, 4, 64), .string: hsl(119, 34, 47), .number: hsl(35, 99, 36),
        .keyword: hsl(301, 63, 40), .control: hsl(301, 63, 40), .constant: hsl(35, 99, 36),
        .function: hsl(221, 87, 60), .type: hsl(35, 99, 36), .property: hsl(5, 74, 59),
        .tag: hsl(5, 74, 59), .attribute: hsl(35, 99, 36), .punctuation: hsl(230, 8, 24),
      ])

    private static func hex(_ value: Int) -> Color {
      Color(
        red: Double((value >> 16) & 0xFF) / 255, green: Double((value >> 8) & 0xFF) / 255,
        blue: Double(value & 0xFF) / 255)
    }

    private static func hsl(_ hue: Double, _ saturation: Double, _ lightness: Double) -> Color {
      let s = saturation / 100
      let l = lightness / 100
      let brightness = l + s * min(l, 1 - l)
      return Color(
        hue: hue / 360, saturation: brightness == 0 ? 0 : 2 * (1 - l / brightness),
        brightness: brightness)
    }
  }

  /// `code` as colored text.
  static func highlight(_ code: String, language: String?, theme: Theme) -> AttributedString {
    var result = AttributedString()
    for (text, token) in tokenize(code, language: language) {
      var run = AttributedString(text)
      run.foregroundColor = theme.color(token, language: language)
      result += run
    }
    return result
  }

  // MARK: Tokenizing

  /// The code split into colored runs. Joining the runs gives back `code`.
  static func tokenize(_ code: String, language: String?) -> [(String, Token)] {
    let grammar = Grammar(language)
    let chars = Array(code)
    var runs: [(String, Token)] = []
    var plain = ""
    var index = 0

    func emit(_ end: Int, _ token: Token) {
      if !plain.isEmpty {
        runs.append((plain, .plain))
        plain = ""
      }
      runs.append((String(chars[index..<end]), token))
      index = end
    }
    func starts(_ prefix: String, at position: Int) -> Bool {
      let prefix = Array(prefix)
      return position + prefix.count <= chars.count
        && Array(chars[position..<position + prefix.count]) == prefix
    }
    func lineEnd(_ from: Int) -> Int { chars[from...].firstIndex(of: "\n") ?? chars.count }

    while index < chars.count {
      let char = chars[index]
      if grammar.markup {
        if char == "<" {
          if starts("<!--", at: index) {
            let end = closing("-->", from: index + 4, in: chars)
            emit(end, .comment)
            continue
          }
          // `<tag` or `</tag`, then attributes until `>`.
          var end = index + 1
          if end < chars.count, chars[end] == "/" { end += 1 }
          while end < chars.count,
            chars[end].isLetter || chars[end].isNumber || "-:".contains(chars[end])
          {
            end += 1
          }
          if end > index + 1 {
            emit(end, .tag)
            continue
          }
        }
        if char == "=" || char == ">" || char == "/" {
          emit(index + 1, .punctuation)
          continue
        }
        if char == "\"" || char == "'" {
          emit(stringEnd(chars, from: index, quote: char), .string)
          continue
        }
        if char.isLetter, isInsideTag(chars, index) {
          var end = index
          while end < chars.count,
            chars[end].isLetter || chars[end].isNumber || "-:".contains(chars[end])
          {
            end += 1
          }
          emit(end, .attribute)
          continue
        }
        plain.append(char)
        index += 1
        continue
      }

      // Comments.
      if grammar.lineComments.contains(where: { starts($0, at: index) }) {
        emit(lineEnd(index), .comment)
        continue
      }
      if grammar.blockComments, starts("/*", at: index) {
        emit(closing("*/", from: index + 2, in: chars), .comment)
        continue
      }
      // Strings, including triple-quoted ones.
      if grammar.quotes.contains(char) {
        let triple = String(repeating: char, count: 3)
        if grammar.tripleQuotes, starts(triple, at: index) {
          emit(closing(triple, from: index + 3, in: chars), .string)
        } else {
          let end = stringEnd(chars, from: index, quote: char)
          // A JSON key is a string followed by a colon.
          var next = end
          while next < chars.count, chars[next] == " " { next += 1 }
          let isKey = grammar.json && next < chars.count && chars[next] == ":"
          emit(end, isKey ? .property : .string)
        }
        continue
      }
      // Numbers.
      if char.isNumber || (char == "." && index + 1 < chars.count && chars[index + 1].isNumber),
        index == 0 || !isIdentifierCharacter(chars[index - 1])
      {
        var end = index + 1
        while end < chars.count,
          chars[end].isHexDigit || "xXoObB_.".contains(chars[end])
            || ((chars[end] == "+" || chars[end] == "-") && "eE".contains(chars[end - 1]))
        {
          end += 1
        }
        emit(end, .number)
        continue
      }
      // Words: keywords, constants, calls, types and properties.
      if isIdentifierStart(char) {
        var end = index + 1
        while end < chars.count, isIdentifierCharacter(chars[end]) { end += 1 }
        let word = String(chars[index..<end])
        var next = end
        while next < chars.count, chars[next] == " " { next += 1 }
        let token: Token
        if grammar.control.contains(word) {
          token = .control
        } else if grammar.keywords.contains(word) {
          token = .keyword
        } else if grammar.constants.contains(word) {
          token = .constant
        } else if next < chars.count, chars[next] == "(" {
          token = .function
        } else if index > 0, chars[index - 1] == "." {
          token = .property
        } else if word.first?.isUppercase == true, grammar.typesAreCapitalized {
          token = .type
        } else {
          token = .plain
        }
        emit(end, token)
        continue
      }
      // Operators and punctuation have their own color; whitespace has none.
      if char.isWhitespace {
        plain.append(char)
        index += 1
      } else {
        emit(index + 1, .punctuation)
      }
    }
    if !plain.isEmpty { runs.append((plain, .plain)) }
    return runs
  }

  private static func isIdentifierStart(_ char: Character) -> Bool {
    char.isLetter || char == "_" || char == "$"
  }

  private static func isIdentifierCharacter(_ char: Character) -> Bool {
    char.isLetter || char.isNumber || char == "_" || char == "$"
  }

  /// The end of a quoted string, after its closing quote (or the line's end
  /// for an unfinished one, as happens mid-stream).
  private static func stringEnd(_ chars: [Character], from start: Int, quote: Character) -> Int {
    var index = start + 1
    while index < chars.count {
      if chars[index] == "\\" {
        index += 2
        continue
      }
      if chars[index] == quote { return index + 1 }
      if chars[index] == "\n", quote != "`" { return index }
      index += 1
    }
    return chars.count
  }

  /// The end of a block (comment or triple-quoted string) closed by `marker`.
  private static func closing(_ marker: String, from start: Int, in chars: [Character]) -> Int {
    let marker = Array(marker)
    var index = start
    while index + marker.count <= chars.count {
      if Array(chars[index..<index + marker.count]) == marker { return index + marker.count }
      index += 1
    }
    return chars.count
  }

  /// Whether `index` is between a tag's `<` and its `>`.
  private static func isInsideTag(_ chars: [Character], _ index: Int) -> Bool {
    var position = index - 1
    while position >= 0 {
      if chars[position] == ">" { return false }
      if chars[position] == "<" { return true }
      position -= 1
    }
    return false
  }

  /// What a language's code looks like, as far as coloring goes.
  struct Grammar {
    var keywords: Set<String> = []
    var control: Set<String> = []
    var constants: Set<String> = [
      "true", "false", "null", "nil", "None", "True", "False", "undefined",
    ]
    var lineComments = ["//"]
    var blockComments = true
    var quotes: Set<Character> = ["\"", "'", "`"]
    var tripleQuotes = false
    var typesAreCapitalized = true
    var json = false
    var markup = false

    init(_ language: String?) {
      let control: Set<String> = [
        "if", "else", "for", "while", "do", "switch", "case", "default", "break", "continue",
        "return", "try", "catch", "finally", "throw", "throws", "guard", "import", "export",
        "from", "await", "yield", "in", "of", "elif", "except", "raise", "with", "pass", "match",
        "loop", "defer", "go", "select", "goto", "then", "fi", "done", "esac", "unless", "until",
        "begin", "rescue", "ensure", "end",
      ]
      self.control = control
      switch (language ?? "").lowercased() {
      case "json", "jsonc":
        keywords = []
        self.control = []
        lineComments = []
        blockComments = false
        quotes = ["\""]
        json = true
        typesAreCapitalized = false
      case "html", "xml", "svg", "vue":
        markup = true
      case "python", "py":
        keywords = [
          "def", "class", "lambda", "global", "nonlocal", "assert", "del", "async", "as", "is",
          "not", "and", "or", "print",
        ]
        lineComments = ["#"]
        blockComments = false
        quotes = ["\"", "'"]
        tripleQuotes = true
      case "ruby", "rb":
        keywords = [
          "def", "class", "module", "self", "do", "and", "or", "not", "attr_accessor", "require",
        ]
        lineComments = ["#"]
        blockComments = false
        quotes = ["\"", "'"]
      case "bash", "sh", "shell", "zsh", "console":
        keywords = ["export", "local", "function", "echo", "cd", "set", "unset", "source"]
        lineComments = ["#"]
        blockComments = false
        quotes = ["\"", "'"]
        typesAreCapitalized = false
      case "yaml", "yml", "toml", "ini":
        keywords = []
        self.control = []
        lineComments = ["#"]
        blockComments = false
        quotes = ["\"", "'"]
        typesAreCapitalized = false
      case "sql":
        let words = [
          "select", "from", "where", "join", "left", "right", "inner", "outer", "on", "group", "by",
          "order", "having", "limit", "insert", "into", "values", "update", "set", "delete",
          "create", "table", "index", "as", "and", "or", "not", "null", "distinct", "union",
          "primary", "key", "references", "alter", "drop", "count", "sum", "avg", "min", "max",
        ]
        keywords = Set(words + words.map { $0.uppercased() })
        self.control = []
        lineComments = ["--"]
        quotes = ["'", "\""]
        typesAreCapitalized = false
      default:
        // C-family and most others: JS/TS, Swift, Kotlin, Java, Go, Rust, C, C++, C#, PHP.
        keywords = [
          "var", "let", "const", "function", "func", "fn", "def", "class", "struct", "enum",
          "interface", "protocol", "extension", "type", "typealias", "impl", "trait", "mod",
          "pub", "private", "public", "protected", "internal", "fileprivate", "static", "final",
          "override", "abstract", "async", "new", "this", "self", "super", "extends",
          "implements", "package", "namespace", "using", "val", "fun", "object", "data", "sealed",
          "open", "lateinit", "mut", "ref", "where", "as", "is", "instanceof", "typeof", "void",
          "int", "float", "double", "char", "bool", "boolean", "string", "long", "short", "byte",
          "unsigned", "signed", "const_cast", "auto", "inout", "some", "any", "readonly", "declare",
          "keyof", "get", "set", "init", "deinit", "subscript", "mutating", "weak", "unowned",
          "lazy",
          "chan", "map", "range", "echo",
        ]
      }
    }
  }
}
