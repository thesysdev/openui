import OpenUILang
import XCTest
@testable import OpenUISwiftUI

final class IncompleteInteractionTests: XCTestCase {
    @MainActor func testEndedTruncatedPreviewCannotExecuteActions() async throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        var incomplete = false
        state.onParseResult = { incomplete = $0.meta.incomplete }
        state.push("root=TextContent(\"unfinished")
        state.complete()
        XCTAssertTrue(incomplete)
        XCTAssertTrue(state.isComplete, "This signal retains its stream-termination meaning")
        let root = try XCTUnwrap(state.root, "Partial content remains visible for reading")
        let context = OpenUIComponentContext(element: root, registry: library.registry, state: state)
        XCTAssertFalse(context.canInteract, "A truncated final preview must remain read-only")
        var received = 0
        state.onAction = { _ in received += 1 }
        let direct = await state.triggerAction("Continue")
        let planned = await state.perform(OpenUIActions.continueConversation("Continue"))
        XCTAssertTrue(direct.isEmpty)
        XCTAssertTrue(planned.isEmpty)
        XCTAssertEqual(received, 0)
    }

    @MainActor func testUnresolvedPreviewIsReadOnlyAndCompleteReplacementWorks() async throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        var unresolved: [String] = []
        state.onParseResult = { unresolved = $0.meta.unresolved }
        state.setSource("root=Stack([TextContent(\"Visible\"),missing])")
        XCTAssertFalse(unresolved.isEmpty)
        let preview = try XCTUnwrap(state.root)
        XCTAssertFalse(OpenUIComponentContext(element: preview, registry: library.registry, state: state).canInteract)
        let previewEvents = await state.triggerAction("Continue")
        XCTAssertTrue(previewEvents.isEmpty)
        state.setSource("root=TextContent(\"Complete\")")
        let root = try XCTUnwrap(state.root)
        XCTAssertTrue(OpenUIComponentContext(element: root, registry: library.registry, state: state).canInteract)
        let completeEvents = await state.triggerAction("Continue")
        XCTAssertEqual(completeEvents.count, 1)
    }
}
