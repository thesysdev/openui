import OpenUILang
import SwiftUI
import XCTest
@testable import OpenUISwiftUI

final class StreamingPresentationTests: XCTestCase {
    @MainActor func testPartialTextIsRenderedByTheSdkBeforeCompletion() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.push("root=Stack([TextContent(\"Paris, at")
        let firstRoot = try XCTUnwrap(state.root)
        let firstText = try XCTUnwrap(PropValue.children(firstRoot).first)
        XCTAssertEqual(PropValue.string(firstText, "text"), "Paris, at")
        XCTAssertNotEqual(PropValue.string(firstText, "size"), "large-heavy",
            "A later positional style argument cannot be known before it arrives")
        XCTAssertFalse(state.isComplete)
        state.push(" your own pace\",\"large-heavy\")],\"column\",\"l\")")
        state.complete()
        let finalRoot = try XCTUnwrap(state.root)
        let finalText = try XCTUnwrap(PropValue.children(finalRoot).first)
        XCTAssertEqual(PropValue.string(finalText, "text"), "Paris, at your own pace")
        XCTAssertEqual(PropValue.string(finalText, "size"), "large-heavy")
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    }

    @MainActor func testReferencedStyledTextGrowsWithAnUnfinishedScalarAssignment() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.push("root=Stack([heading],\"column\",\"l\")\nheading=TextContent(title,\"large-heavy\")\ntitle=\"Pa")
        let first = try XCTUnwrap(state.root)
        let heading = try XCTUnwrap(PropValue.children(first).first)
        XCTAssertEqual(PropValue.string(heading, "text"), "Pa")
        XCTAssertEqual(PropValue.string(heading, "size"), "large-heavy")
        state.push("ris")
        let updated = try XCTUnwrap(state.root)
        let growing = try XCTUnwrap(PropValue.children(updated).first)
        XCTAssertEqual(PropValue.string(growing, "text"), "Paris")
        XCTAssertEqual(PropValue.string(growing, "size"), "large-heavy",
            "Declaring typography before leaf text keeps streaming text in one style")
        state.push("\"\n")
        state.complete()
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
    }

    @MainActor func testFullBufferStreamingAndItsFinalSnapshotDoNotReplaceNativePresentation() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        let prefix = "root=Tabs([TabItem(\"a\",\"First\",[TextContent(\"A\")])"
        state.setSource(prefix, streaming: true)
        let generation = state.presentationRevision
        let full = prefix + ",TabItem(\"b\",\"Second\",[TextContent(\"B\")])])"
        state.setSource(full, streaming: true)
        XCTAssertEqual(state.presentationRevision, generation)
        state.setSource(full, streaming: false)
        XCTAssertEqual(state.presentationRevision, generation)
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        state.setSource("root=Tabs([TabItem(\"c\",\"Replacement\",[TextContent(\"C\")])])")
        XCTAssertGreaterThan(state.presentationRevision, generation)
    }

    func testTabsFollowTheLastGrowingContentUntilAManualValueChange() {
        let a = NativeTabPanel(id: "a", label: "First", content: .string("First"))
        let b = NativeTabPanel(id: "b", label: "Second", content: .string("Second"))
        var selection = NativeTabsSelection()
        selection.reconcile([])
        XCTAssertNil(selection.selected)
        selection.reconcile([a])
        XCTAssertEqual(selection.selected, "a")
        selection.reconcile([a, b])
        XCTAssertEqual(selection.selected, "b", "New growing content follows the upstream candidate rule")
        selection.reconcile([NativeTabPanel(id: "a", label: a.label, content: .string("First grows considerably")), b])
        XCTAssertEqual(selection.selected, "a", "Growth in an existing item also changes the active value")
        selection.reconcile([
            NativeTabPanel(id: "a", label: a.label, content: .string("First grows considerably more")),
            NativeTabPanel(id: "b", label: b.label, content: .string("Second grows too")),
        ])
        XCTAssertEqual(selection.selected, "b", "The last growing item wins, not the largest item")
        selection.choose("a")
        selection.reconcile([a, NativeTabPanel(id: "b", label: b.label, content: .string("Second keeps growing"))])
        XCTAssertEqual(selection.selected, "a", "A manual value change permanently stops automatic following")
        selection.reconcile([b])
        XCTAssertEqual(selection.selected, "a", "Do not add a native-only removal fallback")
        selection.reconcile([])
        XCTAssertEqual(selection.selected, "a")
    }

    func testCompleteInitialTabsAndEqualSizeUpdatesUseTheUpstreamRule() {
        func panel(_ id: OpenUIString, _ text: OpenUIString) -> NativeTabPanel {
            NativeTabPanel(id: id, label: id.displayString, content: .string(text))
        }
        var selection = NativeTabsSelection()
        selection.reconcile([panel("a", "One"), panel("b", "Two")])
        XCTAssertEqual(selection.selected, "b", "The initial full snapshot follows the last growing item too")
        selection.reconcile([panel("a", "New"), panel("b", "Two")])
        XCTAssertEqual(selection.selected, "b", "Equal JSON length does not count as growth")
        selection.reconcile([panel("a", "🙂🙂"), panel("b", "Two")])
        XCTAssertEqual(selection.selected, "a", "JSON length counts UTF-16, not Swift graphemes")
        selection.choose("a") // Clicking an already active value does not emit Radix onValueChange.
        selection.reconcile([panel("a", "🙂🙂"), panel("b", "Longer")])
        XCTAssertEqual(selection.selected, "b")
    }

    func testTabsMeasureTheSerializedComponentContentRatherThanOnlyItsText() {
        func panel(_ id: OpenUIString, partial: Bool) -> NativeTabPanel {
            NativeTabPanel(id: id, label: id.displayString, content: .array([
                .element(EvaluatedElement(typeName: "TextContent", props: [("text", .string("Same text"))], partial: partial))
            ]))
        }
        var selection = NativeTabsSelection()
        selection.reconcile([panel("a", partial: true), panel("b", partial: true)])
        XCTAssertEqual(selection.selected, "b")
        selection.reconcile([panel("a", partial: false), panel("b", partial: true)])
        XCTAssertEqual(selection.selected, "a", "JSON false is one UTF-16 unit longer than true")
    }

    func testAccordionOpensTheNewestArrivalUntilTheUserChangesItsValue() {
        var selection = NativeAccordionSelection()
        selection.reconcile(["a", "b"])
        XCTAssertEqual(selection.selected, "b", "A complete first snapshot opens the last item, as upstream does")
        selection.reconcile(["a"])
        XCTAssertEqual(selection.selected, "b", "A removal does not add a native-only fallback")
        selection.reconcile(["a", "c"])
        XCTAssertEqual(selection.selected, "c")
        selection.choose(nil)
        selection.reconcile(["a", "c", "d"])
        XCTAssertNil(selection.selected, "A manual close stops automatic opening")
        selection.choose("a")
        selection.reconcile(["a", "c", "d", "e"])
        XCTAssertEqual(selection.selected, "a")
    }

    func testConditionalEmptySlotsDoNotChangeLaterAnonymousIdentities() {
        let tabs = Value.element(EvaluatedElement(typeName: "Tabs"))
        let carousel = Value.element(EvaluatedElement(typeName: "Carousel"))
        let before = OpenUIRenderChild.children(of: .array([.null, tabs, .array([.undefined, carousel])]))
        let after = OpenUIRenderChild.children(of: .array([.string("Arrived"), tabs, .array([.string("Also arrived"), carousel])]))
        XCTAssertEqual(before.map(\.id), [after[1].id, after[3].id])
    }

    @MainActor func testAppendCompleteStateAndPatchKeepPresentationWhileReplacementInvalidatesIt() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        let generation = state.presentationRevision
        state.push("root=Tabs([TabItem(\"a\",\"First\",[TextContent(\"A\")])")
        state.push(",TabItem(\"b\",\"Second\",[TextContent(\"B\")])])")
        state.complete()
        XCTAssertEqual(state.presentationRevision, generation)
        state.setState("$note", value: .string("kept"))
        state.applyPatch("root=Tabs([TabItem(\"a\",\"First\",[TextContent(\"A grows\")]),TabItem(\"b\",\"Second\",[TextContent(\"B\")])])")
        XCTAssertEqual(state.presentationRevision, generation)
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        state.setSource("root=Tabs([TabItem(\"a\",\"First\",[TextContent(\"Replacement\")])])")
        XCTAssertGreaterThan(state.presentationRevision, generation)
        let replacement = state.presentationRevision
        state.reset()
        XCTAssertGreaterThan(state.presentationRevision, replacement)
    }

    @MainActor func testIncrementalTabsFollowNewContentAndPreserveTheComponentInstance() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        let source = "root=Tabs([TabItem(\"a\",\"方案一 · 较长中文标题\",[TextContent(\"第一段正文逐渐增长\")]),TabItem(\"b\",\"方案二 · 另一种选择\",[TextContent(\"第二段\")]),TabItem(\"c\",\"方案三 · 第三种选择\",[TextContent(\"第三段\")])])"
        var selection = NativeTabsSelection()
        var visited = Set<OpenUIString>()
        for character in source {
            state.push(String(character))
            guard let root = state.root else { continue }
            let panels = NativeTabPanel.read(OpenUIRenderChild.children(of: PropValue.value(root, "items") ?? .null))
            selection.reconcile(panels)
            if let selected = selection.selected { visited.insert(selected) }
            XCTAssertFalse(state.isComplete)
        }
        state.complete()
        XCTAssertEqual(visited, Set(["a", "b", "c"]))
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        XCTAssertEqual(selection.selected, "c")
    }
}
