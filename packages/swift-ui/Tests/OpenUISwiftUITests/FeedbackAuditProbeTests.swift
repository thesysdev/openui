import XCTest
import OpenUILang
@testable import OpenUISwiftUI

final class FeedbackAuditSliderProbeTests: XCTestCase {
    func testFractionalOriginRetainsStepLatticeAndRange() {
        let config = NativeSliderConfiguration(minimum: 0.5, maximum: 3.5, step: 1, discrete: true)
        let actual = [0.5, 1.5, 2.5, 3.5].map(config.snapped)
        print("AUDIT fractional-origin actual=\(actual)")
        XCTAssertEqual(actual, [0.5, 1.5, 2.5, 3.5])
        XCTAssertLessThanOrEqual(config.snapped(3.5), config.maximum)
    }
    func testNegativeFractionalOriginRetainsLattice() {
        let config = NativeSliderConfiguration(minimum: -2.5, maximum: 0.5, step: 1, discrete: true)
        XCTAssertEqual([-2.5, -1.5, -0.5, 0.5].map(config.snapped), [-2.5, -1.5, -0.5, 0.5])
    }
    func testNonDivisibleRangeStaysWithinBounds() {
        let config = NativeSliderConfiguration(minimum: 0, maximum: 3.6, step: 1, discrete: true)
        print("AUDIT nondivisible drag=\(config.snapped(3.6)); discrete-last=\(config.value(at: config.lastIndex))")
        XCTAssertLessThanOrEqual(config.snapped(3.6), config.maximum, "Endpoint policy requires an official comparison; escaping the declared range is independently invalid")
    }
    func testRegularDecimalStepsRemainWorking() {
        let config = NativeSliderConfiguration(minimum: -1, maximum: 2, step: 0.25, discrete: true)
        XCTAssertEqual(config.snapped(0.37), 0.25)
    }
    func testFractionalStepsChoicesAndTrackUseTheSameValues() {
        let config = NativeSliderConfiguration(minimum:0.05,maximum:0.55,step:0.1,discrete:true)
        XCTAssertEqual(config.value(at:1),0.15)
        XCTAssertEqual(config.snapped(0.15),0.15)
        XCTAssertEqual(config.value(at:5),0.55)
    }
    func testTinyStepsAndNonDivisibleEndpointsKeepTheirPrecision() {
        let tiny = NativeSliderConfiguration(minimum:1e-200,maximum:9e-200,step:2e-200,discrete:true)
        XCTAssertEqual(tiny.snapped(5e-200)/1e-200,5,accuracy:1e-12)
        let endpoint = NativeSliderConfiguration(minimum:0.5,maximum:4.14,step:1,discrete:true)
        XCTAssertEqual(endpoint.snapped(4.14),4.14)
        XCTAssertEqual(endpoint.value(at:endpoint.lastIndex),3.5)
    }
}

final class FeedbackAuditTableProbeTests: XCTestCase {
    @MainActor private func fixture(streaming: Bool) throws -> (OpenUIState, OpenUIComponentContext) {
        let lib = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: lib.library.toSchema())
        if streaming { state.push("root=Stack([EditableTable(\"orders\",[],[]),TextContent(\"unfinished") }
        else { state.setSource("root=EditableTable(\"orders\",[],[])") }
        let root = try XCTUnwrap(state.root)
        let element = streaming ? try XCTUnwrap(PropValue.children(root).first) : root
        return (state, OpenUIComponentContext(element: element, registry: lib.registry, state: state))
    }
    @MainActor func testOnActionReceivesOneEventInStreamingAndCompletedStates() async throws {
        for streaming in [true, false] {
            let (state, context) = try fixture(streaming: streaming)
            var received: [ActionEvent] = []
            state.onAction = { received.append($0) }
            let events = await context.commitFieldAndTrigger("Save Changes", form: "orders", name: "orders", value: .array([]), componentType: "EditableTable")
            XCTAssertEqual(received.count, 1)
            XCTAssertEqual(events.count, 1, "onAction does not consume the returned event")
            XCTAssertEqual(received.first?.formName, "orders")
        }
    }
    @MainActor func testPublishedRc4SourceLessDispatchDropsReadyStreamingTable() async throws {
        let (state, context) = try fixture(streaming: true)
        XCTAssertTrue(context.canInteract)
        state.setFieldValue(form: "orders", name: "orders", value: .array([]), componentType: "EditableTable")
        let oldRoute = await state.triggerAction("Save Changes", formName: "orders")
        XCTAssertTrue(oldRoute.isEmpty, "Replays the source-less dispatch used by published rc.4")
        let currentRoute = await context.commitFieldAndTrigger("Save Changes", form: "orders", name: "orders", value: .array([]), componentType: "EditableTable")
        XCTAssertEqual(currentRoute.count, 1)
    }
    @MainActor func testRejectedDispatchDoesNotWriteAndRetrySucceeds() async throws {
        let (state, original) = try fixture(streaming: true)
        var context = original
        context.interactionScopeReady = false
        let rejected = await context.commitFieldAndTrigger("Save Changes", form: "orders", name: "orders", value: .array([]), componentType: "EditableTable")
        XCTAssertTrue(rejected.isEmpty)
        XCTAssertEqual(state.stateValue("orders"), .null)
        let retried = await original.commitFieldAndTrigger("Save Changes", form: "orders", name: "orders", value: .array([]), componentType: "EditableTable")
        XCTAssertEqual(retried.count, 1)
    }
    @MainActor func testReentrantOnActionCanReceiveEventEvenIfReturnIsEmpty() async throws {
        let (state, context) = try fixture(streaming: false)
        var received = 0
        state.onAction = { _ in received += 1; state.reset(); state.setSource("root=TextContent(\"next\")") }
        let events = await context.commitFieldAndTrigger("Save Changes", form: "orders", name: "orders", value: .array([]), componentType: "EditableTable")
        print("AUDIT reentrant callback count=\(received), returned=\(events.count), presentationCurrent=\(context.isCurrentPresentation)")
        XCTAssertEqual(received, 1)
        XCTAssertTrue(events.isEmpty)
        XCTAssertFalse(context.isCurrentPresentation)
    }
}
