import Foundation
import SwiftUI
import Testing

@testable import OpenUISwiftUI

#if canImport(AppKit)
  import AppKit
#endif

@MainActor
@Suite struct ChatLibraryTests {
  @Test func everyComponentHasAView() {
    for schema in ChatComponents.all {
      #expect(
        OpenUIChatLibrary.views[schema.name] != nil
          || OpenUIChatLibrary.dataOnly.contains(schema.name),
        "\(schema.name) has no view")
    }
    #expect(OpenUIChatLibrary.library.rootName == "Card")
    #expect(OpenUIChatLibrary.library.components.count == ChatComponents.all.count)
  }
}

/// A card's text block counts as content only when it has text: one whose
/// values came out empty doesn't get an empty panel over the photo.
@Suite struct CardTextContentTests {
  func block(_ type: String, _ props: OpenUIObject) -> OpenUIValue {
    .element(ElementNode(typeName: type, props: props, partial: false))
  }

  @Test func emptyTextBlocksHaveNoContent() {
    #expect(!textBlockHasContent(block("BoldText", ["value": "", "subtext": ""])))
    #expect(!textBlockHasContent(block("Text", ["value": .null])))
    #expect(!textBlockHasContent(.null))
  }

  @Test func textOrOtherComponentsAreContent() {
    #expect(textBlockHasContent(block("BoldText", ["value": "", "subtext": "Temple"])))
    #expect(textBlockHasContent(block("Text", ["value": 0])))
    #expect(textBlockHasContent(block("TagBlock", ["tags": []])))
  }
}

@Suite struct CardActionTests {
  let item: OpenUIObject = ["itemIndex": 1, "itemId": "a", "itemTitle": .undefined]

  @Test func noActionContinuesWithItemContext() {
    #expect(
      withItemContext(.null, item)
        == ["type": "continue_conversation", "params": ["itemIndex": 1, "itemId": "a"]])
  }

  @Test func actionPlanAppendsSelectedItemToToAssistant() {
    let plan = OpenUIValue.actionPlan(
      ActionPlan(steps: [
        .continueConversation(message: "Go", context: "ctx"),
        .continueConversation(message: "Bare", context: nil),
        .openUrl(url: "https://openui.com"),
      ]))
    guard case .actionPlan(let merged) = withItemContext(plan, item) else {
      Issue.record("expected an action plan")
      return
    }
    let suffix = #"Selected item: {"itemIndex":1,"itemId":"a"}"#
    #expect(
      merged.steps == [
        .continueConversation(message: "Go", context: "ctx\n\(suffix)"),
        .continueConversation(message: "Bare", context: suffix),
        .openUrl(url: "https://openui.com"),
      ])
    #expect(withItemContext(plan, [:]) == plan)
  }

  @Test func legacyActionMergesParams() {
    let legacy: OpenUIValue = [
      "type": "continue_conversation", "context": "Explore", "params": ["x": 1],
    ]
    #expect(
      withItemContext(legacy, item)
        == [
          "type": "continue_conversation",
          "params": ["x": 1, "context": "Explore", "itemIndex": 1, "itemId": "a"],
        ])
  }
}

@Suite struct IconTests {
  @Test func mapsLucideNamesWithFallbacks() {
    #expect(LucideSymbols.systemName(for: "users", category: nil) == "person.2")
    #expect(
      LucideSymbols.systemName(for: "triangle-alert", category: nil) == "exclamationmark.triangle")
    #expect(LucideSymbols.systemName(for: "no-such-icon", category: "finance") == "dollarsign")
    #expect(
      LucideSymbols.systemName(for: "no-such-icon", category: nil)
        == LucideSymbols.symbols[LucideSymbols.defaultFallback])
  }

  @Test func categoryFallbacksResolve() {
    for (category, name) in LucideSymbols.categoryFallbacks {
      #expect(LucideSymbols.symbols[name] != nil, "\(category) → \(name)")
    }
  }

  #if canImport(AppKit)
    @Test func everyMappedSymbolExists() {
      for (name, symbol) in LucideSymbols.symbols {
        #expect(
          NSImage(systemSymbolName: symbol, accessibilityDescription: nil) != nil,
          "\(name) → \(symbol)")
      }
    }
  #endif
}

@Suite struct NodeIdentityTests {
  @Test func prefersStatementIdsAndStaysUnique() {
    let element = { (id: String?) -> OpenUIValue in
      .element(ElementNode(statementId: id, typeName: "TextContent", props: [:], partial: false))
    }
    let items = NodeItem.list([element("a"), .null, element(nil), element("a"), "text"])
    #expect(items.map(\.id) == ["a", "#2", "a~1", "#4"])
  }
}

@MainActor
@Suite struct OpenUIContextTests {
  @Test func updatesAndRoutesActions() async {
    let context = OpenUIContext(library: OpenUIChatLibrary.library)
    var events: [ActionEvent] = []
    context.onAction = { events.append($0) }
    let start = context.revision

    context.update(
      response: "root = Card([FollowUpBlock([FollowUpItem(\"More\")])])", isStreaming: false)
    #expect(context.revision > start)
    #expect(context.root?.typeName == "Card")

    await context.runtime.triggerAction("More")
    #expect(events.map(\.humanFriendlyMessage) == ["More"])

    let before = context.revision
    context.runtime.store.set("$x", 1)
    #expect(context.revision > before)
  }

  @Test func seedsDefaultsOnlyAfterStreaming() {
    let context = OpenUIContext(library: OpenUIChatLibrary.library)
    context.update(response: "root = Card([])", isStreaming: true)
    context.setDefaultValue(form: "f", componentType: "Chips", name: "c", value: ["a"])
    #expect(context.fieldValue(form: "f", name: "c") == .undefined)

    context.update(response: "root = Card([])", isStreaming: false)
    context.setDefaultValue(form: "f", componentType: "Chips", name: "c", value: ["a"])
    #expect(context.fieldValue(form: "f", name: "c") == ["a"])
  }
}

#if canImport(AppKit)
  /// Renders each chat library example end to end, offscreen, and checks it
  /// produced a real layout (not an empty or collapsed view).
  @MainActor
  @Suite struct EndToEndRenderTests {
    nonisolated static let examples: [(name: String, input: String)] = {
      let url = Bundle.module.url(
        forResource: "chat-examples", withExtension: "json", subdirectory: "Fixtures")!
      let json = try! JSON.parse(String(contentsOf: url, encoding: .utf8))
      return (json.arrayValue ?? []).map { ($0["name"].stringValue!, $0["input"].stringValue!) }
    }()

    @Test(arguments: examples.map(\.name))
    func rendersChatExample(_ name: String) {
      let input = Self.examples.first { $0.name == name }!.input
      let host = NSHostingView(
        rootView: OpenUIRenderer(response: input, library: OpenUIChatLibrary.library)
          .frame(width: 420))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 420, height: 600), styleMask: [.borderless],
        backing: .buffered, defer: false)
      window.contentView = host
      RunLoop.main.run(until: Date().addingTimeInterval(0.3))
      // The smallest example (a short table) is about 195pt; empty or collapsed
      // renders are far below this.
      #expect(host.fittingSize.height > 120, "\(name) rendered \(host.fittingSize)")
    }

    nonisolated static let openUIExamples: [(name: String, input: String)] = {
      let url = Bundle.module.url(
        forResource: "openui-examples", withExtension: "json", subdirectory: "Fixtures")!
      let json = try! JSON.parse(String(contentsOf: url, encoding: .utf8))
      return (json.arrayValue ?? []).map { ($0["name"].stringValue!, $0["input"].stringValue!) }
    }()

    /// The same for react-ui's general library, `openuiLibrary`, whose
    /// examples start from a Stack.
    @Test(arguments: openUIExamples.map(\.name))
    func rendersOpenUIExample(_ name: String) {
      let input = Self.openUIExamples.first { $0.name == name }!.input
      var errors: [OpenUIError] = []
      let host = NSHostingView(
        rootView: OpenUIRenderer(
          response: input, library: OpenUILibrary.library, onError: { errors = $0 }
        )
        .frame(width: 420))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 420, height: 600), styleMask: [.borderless],
        backing: .buffered, defer: false)
      window.contentView = host
      RunLoop.main.run(until: Date().addingTimeInterval(0.3))
      #expect(host.fittingSize.height > 100, "\(name) rendered \(host.fittingSize)")
      // Only the example's prose heading may fail to parse.
      #expect(errors.allSatisfy { $0.jsonRepresentation["source"] == "parser" }, "\(errors)")
    }

    /// Numbers a response can hold but a layout can't use (1e999, 0/0, a
    /// billion slider steps) render without crashing or hanging.
    @Test(arguments: [
      #"TextArea("n", "p", 1e999)"#,
      #"Slider("s", "discrete", 0, 1e999, 1)"#,
      #"Slider("s", "discrete", 0, 1000000, 0.001)"#,
      #"Slider("s", "continuous", 0/0, 10, 1)"#,
      #"Slider("s", "continuous", 0, 100, 1, [10, 1e999])"#,
      // Mid-stream, `max` can be cut short below `min` ("8000" arrives as "800").
      #"Slider("s", "discrete", 2000, 800)"#,
      #"Slider("s", "continuous", 5, 5)"#,
      #"Slider("s", "discrete", 0, 10, 50)"#,
      #"BarChart(["A"], [Series("S", [1])], "grouped", "x", "y", 1e999)"#,
      #"RadarChart(["A", "B", "C"], [Series("S", [1, 1e999, 3])])"#,
      #"ScatterChart([ScatterSeries("S", [Point(1, 2), Point(0/0, 1)])])"#,
    ])
    func rendersNumbersALayoutCantUse(_ component: String) {
      let host = NSHostingView(
        rootView: OpenUIRenderer(
          response: "root = Card([a])\na = \(component)", library: OpenUIChatLibrary.library
        )
        .frame(width: 420))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 420, height: 600), styleMask: [.borderless],
        backing: .buffered, defer: false)
      window.contentView = host
      RunLoop.main.run(until: Date().addingTimeInterval(0.3))
      #expect(host.fittingSize.height > 20, "\(component) rendered \(host.fittingSize)")
    }

    /// Offered exactly its ideal height (a fixed frame, a self-sizing cell),
    /// a response lays out at that height. A VStack split the height by
    /// flexibility instead, cutting wrapping text short next to a row with a
    /// Spacer and leaving the rest of the height empty.
    @Test func fillsExactlyItsIdealHeight() {
      final class Box { var height: CGFloat = 0 }
      let response = """
        root = Card([intro, tip])
        intro = TextContent("That is **Bangalore Palace** in Bengaluru, Karnataka! Built in 1878, its Tudor-style architecture was inspired by Windsor Castle, with fortified towers, battlements and lush gardens.")
        tip = Callout("info", "Good to know", "Sprawling gardens used for cultural exhibitions, concerts, flower shows and public events across the year.")
        """
      let measured = NSHostingView(
        rootView: OpenUIRenderer(response: response, library: OpenUIChatLibrary.library)
          .frame(width: 340))
      RunLoop.main.run(until: Date().addingTimeInterval(0.2))
      let ideal = measured.fittingSize.height
      let box = Box()
      let host = NSHostingView(
        rootView: OpenUIRenderer(response: response, library: OpenUIChatLibrary.library)
          .onGeometryChange(for: CGFloat.self) {
            $0.size.height
          } action: {
            box.height = $0
          }
          .frame(width: 340, height: ideal))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 340, height: ideal), styleMask: [.borderless],
        backing: .buffered, defer: false)
      window.contentView = host
      RunLoop.main.run(until: Date().addingTimeInterval(0.3))
      #expect(ideal > 100)
      #expect(abs(box.height - ideal) < 1, "laid out \(box.height) of \(ideal)")
    }

    /// A closed Modal takes no room in a Stack, gap included, as in react-ui
    /// where it renders nothing.
    @Test func closedModalTakesNoRoom() {
      func height(_ input: String) -> CGFloat {
        let host = NSHostingView(
          rootView: OpenUIRenderer(response: input, library: OpenUILibrary.library)
            .frame(width: 420))
        RunLoop.main.run(until: Date().addingTimeInterval(0.2))
        return host.fittingSize.height
      }
      let alone = height(#"root = Stack([TextContent("Profile"), TextContent("Name")])"#)
      let withModal = height(
        """
        $open = false
        root = Stack([TextContent("Profile"), modal, TextContent("Name")])
        modal = Modal("Edit", $open, [TextContent("Hi")])
        """)
      #expect(alone > 0)
      #expect(withModal == alone)
    }

    /// openuiLibrary's Modal opens from its `open` binding, and closing the
    /// sheet (its X, Escape, a swipe) writes false back.
    @Test func modalFollowsItsOpenBinding() {
      final class Box { var state = OpenUIObject() }
      let box = Box()
      let input = """
        $open = true
        root = Stack([title, modal])
        title = TextContent("Profile")
        modal = Modal("Edit profile", $open, [TextContent("Change your name")])
        """
      let host = NSHostingView(
        rootView: OpenUIRenderer(
          response: input, library: OpenUILibrary.library, onStateUpdate: { box.state = $0 }
        )
        .frame(width: 420, height: 300))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 420, height: 300), styleMask: [.titled],
        backing: .buffered, defer: false)
      window.isReleasedWhenClosed = false
      window.contentView = host
      window.orderFrontRegardless()
      defer { window.close() }
      // Poll rather than wait a fixed time: CI machines are slower.
      func wait(until done: () -> Bool) {
        for _ in 0..<50 where !done() { RunLoop.main.run(until: Date().addingTimeInterval(0.1)) }
      }
      wait { window.attachedSheet != nil }
      guard let sheet = window.attachedSheet else {
        Issue.record("no sheet for $open = true")
        return
      }
      // Escape, which the sheet's close button answers to.
      sheet.makeKey()
      for type in [NSEvent.EventType.keyDown, .keyUp] {
        let escape = NSEvent.keyEvent(
          with: type, location: .zero, modifierFlags: [], timestamp: 0,
          windowNumber: sheet.windowNumber, context: nil, characters: "\u{1b}",
          charactersIgnoringModifiers: "\u{1b}", isARepeat: false, keyCode: 53)!
        sheet.sendEvent(escape)
      }
      wait { window.attachedSheet == nil && box.state["$open"] == false }
      #expect(window.attachedSheet == nil)
      #expect(box.state["$open"] == false)
    }

    /// The editable table's keys with a keyboard: Down and Up move between
    /// rows, and Enter keeps the edit and moves down.
    @Test func editableTableKeys() {
      let input = """
        root = Card([t])
        t = EditableTable("roster", [{type: "text", key: "name", header: "Name"}], [{id: "1", values: ["Alex"]}, {id: "2", values: ["Jamie"]}, {id: "3", values: ["Sam"]}])
        """
      let host = NSHostingView(
        rootView: OpenUIRenderer(response: input, library: OpenUIChatLibrary.library)
          .frame(width: 420, height: 300))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 420, height: 300), styleMask: [.titled],
        backing: .buffered, defer: false)
      window.isReleasedWhenClosed = false
      window.contentView = host
      window.makeKeyAndOrderFront(nil)
      defer { window.close() }
      func settle() { RunLoop.main.run(until: Date().addingTimeInterval(0.2)) }
      func fields(_ view: NSView) -> [NSTextField] {
        let own = (view as? NSTextField).map { [$0] } ?? []
        return own + view.subviews.flatMap(fields)
      }
      func key(_ code: UInt16, _ characters: String) {
        for type in [NSEvent.EventType.keyDown, .keyUp] {
          window.sendEvent(
            NSEvent.keyEvent(
              with: type, location: .zero, modifierFlags: [], timestamp: 0,
              windowNumber: window.windowNumber, context: nil, characters: characters,
              charactersIgnoringModifiers: characters, isARepeat: false, keyCode: code)!)
        }
        settle()
      }
      /// The text of the field being edited.
      func focused() -> String? { (window.firstResponder as? NSText)?.string }
      /// Waits for focus to land on the field showing `text` (CI is slower).
      func focuses(_ text: String) -> Bool {
        for _ in 0..<30 where focused() != text { settle() }
        return focused() == text
      }
      settle()
      let cells = fields(host).filter(\.isEditable).sorted {
        $0.convert(.zero, to: nil).y > $1.convert(.zero, to: nil).y
      }
      guard cells.count == 3 else {
        Issue.record("expected 3 cells, found \(cells.count)")
        return
      }
      window.makeFirstResponder(cells[0])
      settle()
      #expect(focuses("Alex"))
      key(125, "\u{F701}")  // Down
      #expect(focuses("Jamie"))
      key(126, "\u{F700}")  // Up
      #expect(focuses("Alex"))
      (window.firstResponder as? NSTextView)?.insertText(
        "x", replacementRange: NSRange(location: 4, length: 0))
      key(36, "\r")  // Enter
      #expect(focuses("Jamie"))
      #expect(cells[0].stringValue == "Alexx")
      key(125, "\u{F701}")  // Down
      key(125, "\u{F701}")  // Down at the last row stays there
      #expect(focuses("Sam"))
      #expect(cells[0].stringValue == "Alexx")
    }

    /// The bug vishxrad hit in the Angular port: an input recreated on every
    /// update loses focus mid-typing. The AppKit text field behind the SwiftUI
    /// input must be the same object across streamed updates and typing.
    @Test func keepsInputViewsAcrossStreamingAndTyping() {
      final class Model: ObservableObject {
        @Published var response = """
          $name = ""
          root = Card([form, note])
          form = Form("f", btns, [field])
          btns = Buttons([Button("Save")])
          field = FormControl("Name", Input("name", "Your name", "text", null, $name))
          """
        var state = OpenUIObject()
      }
      struct Harness: View {
        @ObservedObject var model: Model
        var body: some View {
          OpenUIRenderer(
            response: model.response, isStreaming: true, library: OpenUIChatLibrary.library,
            onStateUpdate: { model.state = $0 }
          )
          .frame(width: 420)
        }
      }
      func textFields(_ view: NSView) -> [NSTextField] {
        let own = (view as? NSTextField).map { [$0] } ?? []
        return own + view.subviews.flatMap(textFields)
      }

      let model = Model()
      let host = NSHostingView(rootView: Harness(model: model))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 420, height: 400), styleMask: [.borderless],
        backing: .buffered, defer: false)
      window.contentView = host
      RunLoop.main.run(until: Date().addingTimeInterval(0.3))
      let field = textFields(host).first { $0.isEditable }
      #expect(field != nil)

      // A later statement streams in after the field.
      model.response += "\nnote = TextContent(\"Saved drafts appear here.\")"
      RunLoop.main.run(until: Date().addingTimeInterval(0.3))
      #expect(textFields(host).first { $0.isEditable } === field)

      // Typing writes $name, which re-evaluates the tree.
      field?.stringValue = "Ada"
      field?.sendAction(field?.action, to: field?.target)
      NotificationCenter.default.post(name: NSControl.textDidChangeNotification, object: field)
      RunLoop.main.run(until: Date().addingTimeInterval(0.3))
      #expect(model.state["$name"] == "Ada")
      #expect(textFields(host).first { $0.isEditable } === field)
    }

    /// A finished response inside a stack (a restored chat message) must render
    /// even though its text never changes after the view appears.
    @Test func rendersAFinishedResponseNestedInAStack() {
      let input = Self.examples[1].input
      let host = NSHostingView(
        rootView: VStack(alignment: .leading) {
          Text("Earlier message")
          OpenUIRenderer(response: input, library: OpenUIChatLibrary.library)
        }
        .frame(width: 420))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 420, height: 600), styleMask: [.borderless],
        backing: .buffered, defer: false)
      window.contentView = host
      RunLoop.main.run(until: Date().addingTimeInterval(0.3))
      #expect(host.fittingSize.height > 400, "rendered \(host.fittingSize)")
    }

    /// The response shows on the very first layout, before any onChange runs.
    /// A renderer in a lazy stack is rebuilt each time it scrolls back into
    /// view; if it came back empty and then grew, the stack would keep
    /// re-placing rows.
    @Test func rendersOnTheFirstFrame() {
      let host = NSHostingView(
        rootView: OpenUIRenderer(
          response: Self.examples[1].input, library: OpenUIChatLibrary.library
        )
        .frame(width: 420))
      #expect(host.fittingSize.height > 400, "first frame was \(host.fittingSize)")
    }

    @Test func passesParseResultsAndErrorsToTheHost() {
      final class Received {
        var parseResults = 0
        var errors: [[OpenUIError]] = []
      }
      let received = Received()
      let host = NSHostingView(
        rootView: OpenUIRenderer(
          response: "root = Card([Mystery(), TextContent(\"ok\")])",
          library: OpenUIChatLibrary.library,
          onParseResult: { _ in received.parseResults += 1 },
          onError: { received.errors.append($0) }))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 420, height: 300), styleMask: [.borderless],
        backing: .buffered, defer: false)
      window.contentView = host
      RunLoop.main.run(until: Date().addingTimeInterval(0.3))
      #expect(received.parseResults == 1)
      #expect(received.errors.map { $0.map(\.code) } == [["unknown-component"]])
    }
  }
#endif

/// Libraries are typically global constants; this must compile under Swift 6.
let globalTestLibrary = SwiftUILibrary(
  components: [
    SwiftUIComponent(ComponentSchema("Box", description: "", props: [Prop("text", .string)])) {
      Text($0.text("text"))
    }
  ], root: "Box")

@Suite struct GlobalLibraryTests {
  @Test func globalLibraryIsUsable() {
    #expect(globalTestLibrary.paramMap["Box"]?.map(\.name) == ["text"])
  }
}

@Suite struct CitationTests {
  @Test func splitsLikeRemarkCitations() {
    #expect(
      CitedMarkdown.segments("Big [1][2] news [3]. End")
        == [.text("Big "), .citation([1, 2]), .text("news "), .citation([3]), .text(". End")])
    #expect(CitedMarkdown.segments("No citations") == [.text("No citations")])
    #expect(CitedMarkdown.segments("[1] [2]") == [.citation([1, 2])])
  }
}

@MainActor
@Suite struct MarkdownTests {
  @Test func parsesMathAndTables() {
    let blocks = MarkdownBlocks.parse(
      "Intro\n$$\nA = P(1 + r)^n\n$$\n| a | b |\n|---|:-:|\n| 1 | 2 |\nAfter $$x$$")
    #expect(
      blocks == [
        .paragraph("Intro"), .math("A = P(1 + r)^n"),
        .table(header: ["a", "b"], rows: [["1", "2"]]),
        .paragraph("After $$x$$"),
      ])
    #expect(MarkdownBlocks.parse("$$E = mc^2$$") == [.math("E = mc^2")])
    // Without a separator row it's just text.
    #expect(MarkdownBlocks.parse("| not | a table |") == [.paragraph("| not | a table |")])
  }

  @Test func onlyDoubleTildesStrikeThrough() {
    let lone = InlineMarkdown.attributed("about ~$5K and ~4 days")
    #expect(String(lone.characters) == "about ~$5K and ~4 days")
    let double = InlineMarkdown.attributed("~~gone~~")
    #expect(String(double.characters) == "gone")
  }

  @Test func scatterDomainPadsLikeReactUI() {
    #expect(ScatterChartView.domain([150, 190]) == 146...194)
    #expect(ScatterChartView.domain([1, 5]) == 0.6...5.4)
    #expect(ScatterChartView.domain([]) == 0...100)
  }
}

/// Mirrors react-ui's paletteUtils tests.
@Suite struct ChartPaletteTests {
  /// react-ui's `resolvePalette`: the chart's own palette, then the default
  /// one, then the built-in ramp; an empty palette counts as none.
  @Test func chartsUseTheirOwnPaletteFirst() {
    var theme = OpenUITheme()
    #expect(theme.chartRamp(theme.barChartPalette) == nil)
    theme.chartPalette = [.red, .blue]
    #expect(theme.chartRamp(theme.barChartPalette) == [.red, .blue])
    theme.barChartPalette = [.green]
    #expect(theme.chartRamp(theme.barChartPalette) == [.green])
    #expect(theme.chartRamp(theme.lineChartPalette) == [.red, .blue])
    theme.barChartPalette = []
    #expect(theme.chartRamp(theme.barChartPalette) == [.red, .blue])
  }

  @Test func statusVariantsUseTheThemeColors() {
    var theme = OpenUITheme()
    theme.info = .cyan
    theme.success = .mint
    theme.alert = .yellow
    theme.danger = .pink
    let variants: [String?] = ["info", "success", "warning", "error", "danger", "neutral", nil]
    let colors: [Color] = [.cyan, .mint, .yellow, .pink, .pink, .secondary, .secondary]
    #expect(variants.map(theme.status) == colors)
  }

  let ramp = ChartPalette.ocean

  @Test func picksFromTheMiddleOutwards() {
    #expect(ChartPalette.colors(1) == [ramp[5]])
    #expect(ChartPalette.colors(2) == [ramp[4], ramp[6]])
    #expect(ChartPalette.colors(3) == [ramp[4], ramp[5], ramp[6]])
    #expect(ChartPalette.colors(5) == Array(ramp[3...7]))
  }

  @Test func usesTheThemePaletteAndFallsBackWhenEmpty() {
    let pastel: [Color] = [.pink, .mint, .yellow]
    #expect(ChartPalette.colors(3, pastel) == pastel)
    #expect(ChartPalette.colors(2, [.pink, .mint]) == [.pink, .mint])
    #expect(ChartPalette.colors(1, []) == [ramp[5]])
  }

  @Test func neverIndexesOutOfBounds() {
    for size in 1...12 {
      let palette = (0..<size).map { Color(white: Double($0) / 12) }
      for count in 1...40 {
        #expect(ChartPalette.colors(count, palette).count == count)
      }
    }
  }
}

/// The slider's range logic, against react-ui's SliderBlock.
@MainActor
@Suite struct SliderTests {
  @Test func snapsToStepsWithinBounds() {
    #expect(RangeSlider.snap(23, bounds: 0...100, step: 5) == 25)
    #expect(RangeSlider.snap(-7, bounds: 0...100, step: 5) == 0)
    #expect(RangeSlider.snap(140, bounds: 0...100, step: 5) == 100)
    #expect(RangeSlider.snap(12.4, bounds: 10...20, step: 0.5) == 12.5)
  }

  @Test func reportsReactUIErrors() {
    #expect(SliderView.errors([20, 80], minimum: 0, maximum: 100) == ["", ""])
    #expect(
      SliderView.errors([120], minimum: 0, maximum: 100) == ["Value must be between 0 and 100"])
    #expect(
      SliderView.errors([90, 10], minimum: 0, maximum: 100) == ["Min must be less than max", ""])
    #expect(SliderView.errors([.nan], minimum: 0, maximum: 100) == ["Invalid number"])
  }

  /// A discrete slider lists its steps in menus only while there are few,
  /// and a huge range doesn't build them all to find out.
  @Test func listsStepsOnlyWhileFew() {
    #expect(SliderValueControls.options(0, 10, 2.5, limit: 200) == [0, 2.5, 5, 7.5, 10])
    #expect(SliderValueControls.options(0, 199, 1, limit: 200)?.count == 200)
    #expect(SliderValueControls.options(0, 200, 1, limit: 200) == nil)
    #expect(SliderValueControls.options(0, 1_000_000, 0.001, limit: 200) == nil)
  }

  @Test func clampsToBounds() {
    #expect(RangeSlider.clamp(140, to: 0...100) == 100)
    #expect(RangeSlider.clamp(-3, to: 0...100) == 0)
  }

  @Test func mapsTrackOffsetsToValues() {
    #expect(RangeSlider.value(at: 50, track: 200, bounds: 0...100) == 25)
    #expect(RangeSlider.value(at: 200, track: 200, bounds: 10...20) == 20)
  }
}

/// The highlighter's token kinds, standing in for Prism's.
@Suite struct SyntaxHighlighterTests {
  func kinds(_ code: String, _ language: String) -> [String: SyntaxHighlighter.Token] {
    var kinds: [String: SyntaxHighlighter.Token] = [:]
    for (text, token) in SyntaxHighlighter.tokenize(code, language: language)
    where !text.trimmingCharacters(in: .whitespaces).isEmpty {
      kinds[text] = token
    }
    return kinds
  }

  @Test func keepsTheSourceIntact() {
    for (code, language) in [
      ("const total = items.map(x => x * 2) // twice\n", "ts"),
      ("def f(x):\n    \"\"\"doc\"\"\"\n    return x  # done", "python"),
      ("{\"a\": [1, true, null]}", "json"), ("<a href=\"/x\">Hi</a>", "html"),
      ("SELECT name FROM users WHERE id = 3", "sql"), ("let s = \"unfinished", "swift"),
    ] {
      let joined = SyntaxHighlighter.tokenize(code, language: language).map(\.0).joined()
      #expect(joined == code)
    }
  }

  @Test func classifiesTokensLikePrism() {
    let ts = kinds("import { x } from \"y\"\nconst total = sum(3.5) // note", "ts")
    #expect(ts["import"] == .control)
    #expect(ts["const"] == .keyword)
    #expect(ts["\"y\""] == .string)
    #expect(ts["sum"] == .function)
    #expect(ts["3.5"] == .number)
    #expect(ts["// note"] == .comment)
    #expect(ts["total"] == .plain)

    let python = kinds("def greet(name):\n    return None  # nothing", "python")
    #expect(python["def"] == .keyword)
    #expect(python["greet"] == .function)
    #expect(python["return"] == .control)
    #expect(python["None"] == .constant)
    #expect(python["# nothing"] == .comment)

    let json = kinds("{\"name\": \"Ada\", \"age\": 36, \"ok\": true}", "json")
    #expect(json["\"name\""] == .property)
    #expect(json["\"Ada\""] == .string)
    #expect(json["36"] == .number)
    #expect(json["true"] == .constant)

    let html = kinds("<a href=\"/x\">Hi</a>", "html")
    #expect(html["<a"] == .tag)
    #expect(html["href"] == .attribute)
    #expect(html["\"/x\""] == .string)

    #expect(kinds("SELECT id FROM t", "sql")["SELECT"] == .keyword)
  }

  @Test func colorsPlainWordsPerLanguage() {
    let dark = SyntaxHighlighter.Theme.darkPlus
    #expect(dark.color(.plain, language: "ts") != dark.color(.plain, language: "python"))
    #expect(dark.color(.punctuation, language: "ts") == dark.plain)
  }
}

@MainActor
@Suite struct MarkdownCodeAndImageTests {
  @Test func keepsTheFenceLanguageAndTrims() {
    #expect(
      MarkdownBlocks.parse("```swift\nlet x = 1\n\n```")
        == [.code(language: "swift", "let x = 1")])
    #expect(MarkdownBlocks.parse("```\nplain\n```") == [.code(language: nil, "plain")])
  }

  @Test func readsImageLines() {
    #expect(
      MarkdownBlocks.parse("Intro\n![A lake](https://x.test/l.jpg \"Lake\")")
        == [.paragraph("Intro"), .image(alt: "A lake", url: "https://x.test/l.jpg")])
    // Inline in a sentence it stays part of the paragraph.
    #expect(
      MarkdownBlocks.parse("See ![a](https://x.test/a.png) here")
        == [.paragraph("See ![a](https://x.test/a.png) here")])
  }
}

@Suite struct GalleryMosaicTests {
  /// The frames tile the gallery like react-ui's grid templates: inside the
  /// bounds, no overlaps, and the first image the largest.
  @Test(arguments: [false, true], 1...5)
  func tilesLikeReactUI(narrow: Bool, count: Int) {
    let width: CGFloat = narrow ? 360 : 700
    let bounds = CGRect(
      x: 0, y: 0, width: width, height: GalleryMosaic.height(width: width, count: count))
    let frames = GalleryMosaic.frames(count: count, in: bounds)
    #expect(frames.count == count)
    for (index, frame) in frames.enumerated() {
      #expect(bounds.insetBy(dx: -0.5, dy: -0.5).contains(frame))
      for other in frames[(index + 1)...] {
        #expect(frame.intersection(other).width < 0.5 || frame.intersection(other).height < 0.5)
      }
      #expect(frame.width * frame.height <= frames[0].width * frames[0].height + 0.5)
    }
    // Nothing left uncovered but the gaps.
    let area = frames.reduce(0) { $0 + $1.width * $1.height }
    #expect(area > bounds.width * bounds.height * 0.9)
  }

  @Test func usesReactUITemplates() {
    // Five or more, wide: 2fr 1fr 1fr with the first image down both rows.
    let wide = GalleryMosaic.frames(count: 5, in: CGRect(x: 0, y: 0, width: 708, height: 376))
    #expect(wide[0] == CGRect(x: 0, y: 0, width: 346, height: 376))
    #expect(wide[1] == CGRect(x: 354, y: 0, width: 173, height: 184))
    #expect(wide[4] == CGRect(x: 535, y: 192, width: 173, height: 184))
    // Narrow: two on top, three below.
    let narrow = GalleryMosaic.frames(count: 5, in: CGRect(x: 0, y: 0, width: 368, height: 288))
    #expect(narrow[0].width == narrow[1].width)
    #expect(narrow[2].minY == narrow[3].minY && narrow[3].minY == narrow[4].minY)
    #expect(GalleryMosaic.height(width: 1200, count: 5) == GalleryMosaic.maxHeight)
  }
}

/// Chart interactions against react-ui: its number formats (fixtures from its
/// formatters), legend folding and toggling, and where pie slices, stacked
/// bar segments and tooltips land. Main actor, because the legend's helpers
/// are members of a view.
@MainActor
@Suite struct ChartInteractionTests {
  private struct FormatCase: Decodable {
    let value: Double
    let tick: String
    let tooltip: String
  }

  @Test func formatsNumbersLikeReactUI() throws {
    let url = Bundle.module.url(
      forResource: "chart-formats", withExtension: "json", subdirectory: "Fixtures")!
    let cases = try JSONDecoder().decode([FormatCase].self, from: Data(contentsOf: url))
    #expect(cases.count > 20)
    for item in cases {
      #expect(ChartFormat.tick(item.value) == item.tick, "tick \(item.value)")
      #expect(
        ChartFormat.tooltip(item.value, locale: Locale(identifier: "en_US")) == item.tooltip,
        "tooltip \(item.value)")
    }
  }

  @Test func keepsOneSeriesVisible() {
    let keys = ["a", "b", "c"]
    var hidden = ChartLegend.toggling("a", in: [], keys: keys)
    hidden = ChartLegend.toggling("b", in: hidden, keys: keys)
    #expect(hidden == ["a", "b"])
    #expect(ChartLegend.toggling("c", in: hidden, keys: keys) == ["a", "b"])
    #expect(ChartLegend.toggling("a", in: hidden, keys: keys) == ["b"])
    // Keys from older data don't count against the current series.
    #expect(ChartLegend.toggling("a", in: ["gone"], keys: ["a", "b"]) == ["gone", "a"])
  }

  @Test func foldsTheLegendLikeUseDefaultLegend() {
    // Each key's width already includes a gap; keys after the first add another.
    #expect(ChartLegend.fittingCount([50, 50, 50], available: 174, button: 60) == 3)
    #expect(ChartLegend.fittingCount([50, 50, 50], available: 173, button: 60) == 2)
    #expect(ChartLegend.fittingCount([50, 50, 50, 50], available: 200, button: 40) == 2)
    #expect(ChartLegend.fittingCount([300, 50], available: 200, button: 40) == 1)
    #expect(ChartLegend.fittingCount([50, 50], available: 0, button: 40) == 2)
  }

  @Test func sortsSlicesLargestFirst() {
    let slices = [
      Slice(id: 0, label: "a", value: 1), Slice(id: 1, label: "b", value: 5),
      Slice(id: 2, label: "c", value: 5), Slice(id: 3, label: "d", value: 3),
    ]
    let sorted = sortedSlices(slices, nil)
    #expect(sorted.map(\.slice.label) == ["b", "c", "d", "a"])
    #expect(sorted.map(\.color) == ChartPalette.colors(4))
  }

  @Test func findsPieSlicesClockwiseFromTwelve() {
    let size = CGSize(width: 200, height: 200)
    let values: [Double] = [1, 1, 2]
    func slice(_ x: CGFloat, _ y: CGFloat, inner: CGFloat = 0, semi: Bool = false) -> Int? {
      PieGeometry.slice(
        at: CGPoint(x: x, y: y), in: size, values: values, innerRatio: inner, semicircle: semi)
    }
    #expect(slice(150, 60) == 0)  // upper right
    #expect(slice(150, 140) == 1)  // lower right
    #expect(slice(50, 100) == 2)  // left
    #expect(slice(100, 100, inner: 0.6) == nil)  // the donut's hole
    #expect(slice(5, 5) == nil)  // outside the circle
    // A semicircle is turned a quarter to the left: it starts at 9 o'clock.
    #expect(slice(40, 90, semi: true) == 0)
    #expect(slice(160, 90, semi: true) == 2)
    #expect(slice(100, 160, semi: true) == nil)  // the empty lower half
  }

  @Test func splitsTheStackedBarByShare() {
    let widths = SegmentRow.widths(204, [0.5, 0.25, 0.25])
    #expect(widths == [100, 50, 50])
    #expect(SegmentRow.index(at: 10, width: 204, shares: [0.5, 0.25, 0.25]) == 0)
    #expect(SegmentRow.index(at: 120, width: 204, shares: [0.5, 0.25, 0.25]) == 1)
    #expect(SegmentRow.index(at: 200, width: 204, shares: [0.5, 0.25, 0.25]) == 2)
  }

  @Test func placesTooltipsLikeFloatingUI() {
    let bounds = CGRect(x: 0, y: 0, width: 400, height: 200)
    let size = CGSize(width: 150, height: 80)
    // Right of the pointer, flipped left near the trailing edge, kept inside.
    #expect(
      TooltipPlacement.origin(for: size, anchor: CGPoint(x: 50, y: 30), in: bounds)
        == CGPoint(x: 70, y: 30))
    #expect(
      TooltipPlacement.origin(for: size, anchor: CGPoint(x: 300, y: 30), in: bounds)
        == CGPoint(x: 130, y: 30))
    #expect(
      TooltipPlacement.origin(for: size, anchor: CGPoint(x: 300, y: 190), in: bounds)
        == CGPoint(x: 130, y: 120))
    #expect(
      TooltipPlacement.origin(
        for: size, anchor: CGPoint(x: 10, y: 10), placement: .above, in: bounds)
        == CGPoint(x: 8, y: -90))
  }
}

#if canImport(AppKit)
  /// Wrapping rows (tags, chips, legends) never let a child spill past the
  /// container: one wider than a row gets the row's width.
  @MainActor
  @Suite struct FlowLayoutTests {
    @Test func capsWideChildrenAtTheRowWidth() {
      final class Box { var width: CGFloat = 0 }
      let box = Box()
      let host = NSHostingView(
        rootView: FlowLayout {
          Text("Short")
          Text(String(repeating: "wide ", count: 60))
            .lineLimit(1)
            .onGeometryChange(for: CGFloat.self) {
              $0.size.width
            } action: {
              box.width = $0
            }
        }
        .frame(width: 200))
      let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 200, height: 200), styleMask: [.borderless],
        backing: .buffered, defer: false)
      window.contentView = host
      RunLoop.main.run(until: Date().addingTimeInterval(0.2))
      #expect(box.width > 150)
      #expect(box.width <= 200)
    }
  }
#endif

/// The flex layout behind openuiLibrary's Stack and Card, against what CSS
/// flexbox does with react-ui's styles.
@Suite struct FlexLayoutTests {
  typealias Item = FlexLayout.Item

  @Test func growingItemsShareTheFreeSpace() {
    // Two cards (flex: 1, basis 0) and a 100pt button in 400pt with 12pt gaps.
    let items = [
      Item(basis: 0, flexible: true), Item(basis: 100, flexible: false),
      Item(basis: 0, flexible: true),
    ]
    let (widths, offsets) = FlexLayout.distribute(items, width: 400, gap: 12, justify: nil)
    #expect(widths == [138, 100, 138])
    #expect(offsets == [0, 150, 262])
  }

  @Test func justifySpreadsSpaceWhenNothingGrows() {
    let items = [Item(basis: 100, flexible: false), Item(basis: 100, flexible: false)]
    func offsets(_ justify: String?) -> [CGFloat] {
      FlexLayout.distribute(items, width: 300, gap: 0, justify: justify).offsets
    }
    #expect(offsets(nil) == [0, 100])
    #expect(offsets("center") == [50, 150])
    #expect(offsets("end") == [100, 200])
    #expect(offsets("between") == [0, 200])
    #expect(offsets("around") == [25, 175])
    let third: CGFloat = 100 / 3
    #expect(offsets("evenly") == [third, 100 + 2 * third])
  }

  @Test func fixedItemsShrinkInProportion() {
    let items = [Item(basis: 300, flexible: false), Item(basis: 100, flexible: false)]
    #expect(FlexLayout.distribute(items, width: 200, gap: 0, justify: nil).widths == [150, 50])
  }

  @Test func wrapsByBasisButGrowingItemsNeverWrap() {
    let fixed = Array(repeating: Item(basis: 100, flexible: false), count: 5)
    #expect(FlexLayout.lines(fixed, width: 330, gap: 10, wrap: true) == [0..<3, 3..<5])
    #expect(FlexLayout.lines(fixed, width: 330, gap: 10, wrap: false) == [0..<5])
    let cards = Array(repeating: Item(basis: 0, flexible: true), count: 5)
    #expect(FlexLayout.lines(cards, width: 100, gap: 10, wrap: true) == [0..<5])
  }

  @Test func gapsFollowReactUISpacing() {
    let names: [String?] = ["none", "xs", "s", nil, "m", "l", "xl", "2xl"]
    let gaps: [CGFloat] = [0, 6, 8, 12, 12, 18, 24, 36]
    #expect(names.map(FlexLayout.gap) == gaps)
  }

}

/// The editable table's edit bookkeeping.
@Suite struct TableEditsTests {
  @Test func onlyChangedTextIsAnEdit() {
    var edits = TableEdits()
    // A focused field writes its text back unchanged: not an edit.
    edits.set("Alex", row: "1", column: 0, original: "Alex")
    #expect(edits.count == 0)
    edits.set("Alexx", row: "1", column: 0, original: "Alex")
    edits.set("Ops", row: "2", column: 1, original: "Eng")
    #expect(edits.count == 2)
    #expect(edits["1", 0] == "Alexx")
    // Typing the original back undoes the edit.
    edits.set("Alex", row: "1", column: 0, original: "Alex")
    #expect(edits.count == 1)
    #expect(edits["1", 0] == nil)
  }
}

/// Card grids keep react-ui's breakpoints but never squeeze a card below its
/// react-ui minimum width.
@Suite struct CardGridColumnsTests {
  func columns(_ width: CGFloat, responsive: Bool, min: CGFloat = 0) -> Int {
    CardGridLayout.columns(
      width: width, maxPerRow: 3, responsive: responsive, spacing: 12, minCellWidth: min)
  }

  @Test func followsReactUIBreakpoints() {
    #expect(columns(400, responsive: true) == 1)
    #expect(columns(700, responsive: true) == 2)
    #expect(columns(900, responsive: true) == 3)
    #expect(columns(400, responsive: false) == 3)
  }

  /// A context card (196pt minimum) in a non-responsive block on a phone: one
  /// per row instead of three a word wide.
  @Test func dropsColumnsBelowTheCardsMinimum() {
    #expect(columns(350, responsive: false, min: 196) == 1)
    #expect(columns(404, responsive: false, min: 196) == 2)
    #expect(columns(612, responsive: false, min: 196) == 3)
    #expect(columns(900, responsive: true, min: 196) == 3)
    #expect(columns(10, responsive: false, min: 196) == 1)
  }
}

/// react-ui's condensed x-axis labels: crowded categories label every n-th
/// one, each truncated to the room it then has.
@Suite struct CategoryLabelsTests {
  @Test func labelsEveryCategoryWhenTheyFit() {
    let layout = CategoryLabels.layout(widest: 30, slot: 40, count: 6)
    #expect(layout.interval == 1)
    #expect(layout.width == 32)
  }

  /// Eight cities on a phone: every second one, with room for "Mumbai".
  @Test func thinsCrowdedLabels() {
    let layout = CategoryLabels.layout(widest: 70, slot: 40, count: 8)
    #expect(layout.interval == 2)
    #expect(layout.width == 72)
    // react-ui's rule alone when the labels then fit: 48pt needed in 10pt slots.
    #expect(CategoryLabels.layout(widest: 40, slot: 10, count: 20).interval == 5)
  }

  /// Past react-ui's rule: thinning further beats cutting every label off,
  /// down to three labels.
  @Test func thinsRatherThanTruncates() {
    // Seven "Month n" labels, 48pt wide, in 53pt slots: every second one.
    let months = CategoryLabels.layout(widest: 48, slot: 53, count: 7)
    #expect(months.interval == 2)
    #expect(months.width >= 48)
    // Labels too long for any thinning keep at least three.
    #expect(CategoryLabels.layout(widest: 500, slot: 40, count: 9).interval == 3)
  }

  @Test func neverSkipsPastTheLastCategory() {
    #expect(CategoryLabels.layout(widest: 100, slot: 2, count: 3).interval == 3)
    #expect(CategoryLabels.layout(widest: 100, slot: 0, count: 3).interval == 1)
  }

  /// Labels center on their category and stay inside the plot, as react-ui's
  /// CondensedXAxis keeps them.
  @Test func keepsLabelsInsideThePlot() {
    // In the middle: centered, truncated to its box when it's too long.
    #expect(CategoryLabels.place(text: 30, center: 100, width: 72, plot: 300) == (30, 0))
    #expect(CategoryLabels.place(text: 100, center: 150, width: 72, plot: 300) == (72, 0))
    // The first label's box is cut at the start, and the label moves in.
    #expect(CategoryLabels.place(text: 60, center: 20, width: 72, plot: 300) == (56, 8))
    // The last one is cut at the end and moves back.
    #expect(CategoryLabels.place(text: 50, center: 290, width: 72, plot: 300) == (46, -13))
  }
}
