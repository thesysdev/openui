import OpenUILang
import SwiftUI
import XCTest

@testable import OpenUISwiftUI

final class NativeComponentsTests: XCTestCase {
    func testStandardContractsMatchUpstreamOrderedArguments() throws {
        let library = try OpenUIStandardComponents.library()
        let schema = library.library.toSchema()
        let expected: [String: [String]] = [
            "Form": ["name", "buttons", "fields"], "FormControl": ["label", "input", "hint"],
            "Buttons": ["buttons", "direction"], "Input": ["name", "placeholder", "type", "rules", "value"],
            "TextArea": ["name", "placeholder", "rows", "rules", "value"],
            "Select": ["name", "items", "placeholder", "rules", "value", "size"],
            "RadioGroup": ["name", "items", "defaultValue", "rules", "value"],
            "CheckBoxGroup": ["name", "items", "rules", "value"],
            "SwitchGroup": ["name", "items", "variant", "value"],
            "Slider": ["name", "variant", "min", "max", "step", "defaultValue", "label", "rules", "value"],
            "DatePicker": ["name", "mode", "rules", "value"], "Table": ["columns"],
            "Col": ["label", "data", "type"],
            "CodeBlock": ["language", "codeString"], "Separator": ["orientation", "decorative"],
            "Accordion": ["items"], "AccordionItem": ["value", "trigger", "content"],
            "MetricIndicatorInline": ["value", "subtext", "trend"],
            "MetricIndicatorWithStrikethrough": ["value", "subtext", "previousValue", "trend"],
        ]
        for (name, params) in expected {
            XCTAssertEqual(schema.components[name]?.map(\.name), params, name)
            XCTAssertNotNil(library.registry[name], name)
        }
        // Imported reference order stays intact; native authoring still enforces
        // prompt.md's required-first rule for new definitions.
        XCTAssertEqual(
            schema.components["SwitchItem"]?.map(\.name), ["label", "description", "name", "defaultChecked"])
        for name in OpenUIFormComponents.fieldNames {
            XCTAssertTrue(
                schema.components[name]?.first(where: { $0.name == "value" })?.isBindable == true, name)
        }
        XCTAssertNil(library.registry["NavigationLink"], "Use upstream Button for host navigation")
        XCTAssertEqual(
            try LibrarySpec(jsonString: library.toSpec().jsonString()).components.count,
            library.library.components.count)
        if let directory = ProcessInfo.processInfo.environment["OPENUI_CONTRACT_EXPORT_DIR"] {
            let destination = URL(fileURLWithPath: directory)
            try FileManager.default.createDirectory(at: destination, withIntermediateDirectories: true)
            for (name, collection) in [("standard", library)] {
                try collection.toSpec().jsonString().write(
                    to: destination.appendingPathComponent(name + ".json"), atomically: true, encoding: .utf8)
                try collection.prompt().write(
                    to: destination.appendingPathComponent(name + "-prompt.txt"), atomically: true,
                    encoding: .utf8)
            }
        }
    }

    @MainActor func testTypedNativeFormAndDataProgramsParseAndRoundTrip() throws {
        let library = try OpenUIStandardComponents.library()
        let programs = [
            "root = Stack([Form(\"contact\", Buttons([Button(\"Send\")]), [FormControl(\"Email\", Input(\"email\", \"you@example.com\", \"email\", {required:true,email:true}))])])",
            "$choice=\"a\"\nroot=Stack([Select(\"choice\",[SelectItem(\"a\",\"Alpha\"),SelectItem(\"b\",\"Beta\")],null,null,$choice)])",
            "root=Stack([RadioGroup(\"travel\",[RadioItem(\"Train\",\"Rail\",\"rail\")],\"rail\"),CheckBoxGroup(\"extras\",[CheckBoxItem(\"Seat\",\"Reserve a seat\",\"seat\",true)])])",
            "root=Stack([SwitchGroup(\"options\",[SwitchItem(\"Updates\",null,\"updates\",true)]),Slider(\"budget\",\"discrete\",0,100,5,[20,80]),DatePicker(\"dates\",\"range\")])",
            "root=Stack([Table([Col(\"Name\",[\"A\",\"B\"]),Col(\"Price\",[1,2],\"number\")]),CodeBlock(\"swift\",\"let value = 1\"),Separator(\"horizontal\",true)])",
            "root=Stack([Accordion([AccordionItem(\"details\",\"Details\",[TextContent(\"Body\")])]),MetricIndicatorInline(\"42\",\"Total\",{direction:\"up\",value:2.5})])",
        ]
        for source in programs {
            let state = OpenUIState(schema: library.library.toSchema())
            state.setSource(source)
            XCTAssertNotNil(state.root, source)
            XCTAssertTrue(state.errors.isEmpty, "\(source): \(state.errors)")
        }
        let invalid = OpenUIState(schema: library.library.toSchema())
        invalid.setSource("root=Stack([FormControl(\"Bad\",TextContent(\"not a field\"))])")
        XCTAssertTrue(invalid.errors.isEmpty, "Match the pinned core's structural slot validation; do not add native-only name rejection")
    }

    @MainActor func testBoundFieldEditsKeepFormPayloadAndRestoreUserValue() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        let source =
            "$email=\"\"\nroot=Stack([Input(\"email\",null,\"email\",{required:true,email:true},$email)])"
        state.setSource(source)
        let input = try XCTUnwrap(PropValue.children(state.root!).first)
        let context = OpenUIComponentContext(
            element: input, registry: library.registry, state: state, formName: "contact")
        let field = NativeFieldState(context: context)
        field.initialize()
        let validation = NativeFormValidation()
        validation.register(field.name, rules: field.rules, value: { field.value })
        XCTAssertFalse(validation.validateAll())
        field.text.wrappedValue = "bad"
        XCTAssertFalse(validation.validateAll())
        field.text.wrappedValue = "hello@example.com"
        XCTAssertTrue(validation.validateAll())
        XCTAssertEqual(state.stateValue("$email"), .string("hello@example.com"))
        XCTAssertEqual(context.fieldValue("email"), .string("hello@example.com"))
        let snapshot = state.snapshotState()
        state.setSource(
            source.replacingOccurrences(of: "{required:true,email:true}", with: "{required:true}"))
        XCTAssertEqual(state.stateValue("$email"), .string("hello@example.com"))
        let restored = OpenUIState(schema: library.library.toSchema(), persistedState: snapshot)
        restored.setSource(source)
        XCTAssertEqual(restored.fieldValue(form: "contact", name: "email"), .string("hello@example.com"))
    }

    @MainActor func testFormSubmissionUsesExistingEventsAndExactFieldKeys() throws {
        let done = expectation(description: "Native form submission")
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root=Stack([Input(\"email\"),Button(\"Send\")])")
        let formName = OpenUIString(codeUnits: [0xD800])
        let fieldName = OpenUIString("e\u{301}")
        let children = PropValue.children(state.root!)
        let input = EvaluatedElement(typeName: "Input", props: [("name", .string(fieldName))])
        let fieldContext = OpenUIComponentContext(
            element: input, registry: library.registry, state: state, exactFormName: formName)
        let field = NativeFieldState(context: fieldContext)
        field.initialize()
        field.write(.string("value"))
        let context = OpenUIComponentContext(
            element: children[1], registry: library.registry, state: state, exactFormName: formName)
        Task { @MainActor in
            defer { done.fulfill() }
            let events = await context.triggerAction("Send")
            XCTAssertEqual(events.count, 1)
            XCTAssertEqual(events[0].formName, formName)
            guard case .object(let form) = events[0].formState?.first?.1,
                case .object(let wrapped) = form[fieldName]
            else { return XCTFail("Missing exact form field") }
            XCTAssertEqual(wrapped["value"], .string("value"))
            XCTAssertEqual(wrapped["componentType"], .string("Input"))
        }
        wait(for: [done], timeout: 3)
    }

    @MainActor func testFieldDefaultsDoNotCommitIncompleteStreamingProps() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root=Input(\"name\",null,null,null,\"part\")", streaming: true)
        let partial = NativeFieldState(
            context: OpenUIComponentContext(element: state.root!, registry: library.registry, state: state))
        partial.initialize()
        partial.write(.string("must not commit"))
        XCTAssertTrue(state.snapshotState().isEmpty)
        state.setSource("root=Input(\"name\",null,null,null,\"complete\")")
        let final = NativeFieldState(
            context: OpenUIComponentContext(element: state.root!, registry: library.registry, state: state))
        final.initialize()
        XCTAssertEqual(final.value, .string("complete"))
    }

    @MainActor func testToggleObjectAndSliderValuesPreserveTheirWireShapes() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource(
            "root=Stack([CheckBoxGroup(\"extras\",[CheckBoxItem(\"Seat\",\"\",\"seat\",true),CheckBoxItem(\"Meal\",\"\",\"meal\",false)]),Slider(\"budget\",\"discrete\",0,100,5,[20,80],null,{min:10,max:90})])"
        )
        let children = PropValue.children(state.root!)
        let check = NativeFieldState(
            context: OpenUIComponentContext(element: children[0], registry: library.registry, state: state))
        check.initialize()
        XCTAssertTrue(check.toggle("seat").wrappedValue)
        check.toggle("meal").wrappedValue = true
        check.toggle("seat").wrappedValue = false
        XCTAssertTrue(check.toggle("meal").wrappedValue)
        XCTAssertFalse(check.toggle("seat").wrappedValue)
        let slider = NativeFieldState(
            context: OpenUIComponentContext(element: children[1], registry: library.registry, state: state))
        slider.initialize()
        XCTAssertEqual(slider.value, .array([.number(20), .number(80)]))
        XCTAssertNil(OpenUILang.validate(slider.validationValue, rules: slider.rules))
    }

    @MainActor func testValidationOnlyGatesSubmissionAndMutationPlans() {
        XCTAssertTrue(NativeFormValidation.requiresValidation(nil))
        XCTAssertTrue(
            NativeFormValidation.requiresValidation(
                ActionPlan(steps: [.continueConversation(messageAST: .str("Send"), contextAST: nil)])))
        XCTAssertTrue(
            NativeFormValidation.requiresValidation(
                ActionPlan(steps: [.run(statementId: "save", refType: .mutation)])))
        XCTAssertTrue(
            NativeFormValidation.requiresValidation(ActionPlan(steps: [.custom(name: "Save", args: [])])))
        XCTAssertFalse(
            NativeFormValidation.requiresValidation(
                ActionPlan(steps: [.openUrl(urlAST: .str("https://example.com"))])))
        XCTAssertFalse(
            NativeFormValidation.requiresValidation(
                ActionPlan(steps: [.set(target: "$x", valueAST: .str("x")), .reset(targets: ["$x"])])))
        XCTAssertFalse(
            NativeFormValidation.requiresValidation(
                ActionPlan(steps: [.run(statementId: "load", refType: .query)])))
    }

    @MainActor func testStaleComponentContextsCannotDispatchOrWriteIntoNewSource() throws {
        let done = expectation(description: "Stale UI callbacks")
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("$name=\"initial\"\nroot=Input(\"name\",null,null,null,$name)")
        let old = OpenUIComponentContext(element: state.root!, registry: library.registry, state: state)
        let field = NativeFieldState(context: old)
        field.initialize()
        let binding = try XCTUnwrap(old.binding("value"))
        let scoped = old.fieldBinding("another")
        state.setSource("root=TextContent(\"new response\")")
        field.write(.string("stale"))
        binding.wrappedValue = .string("stale")
        scoped.wrappedValue = .string("stale")
        old.initializeField("another", value: .string("stale"))
        XCTAssertFalse(old.canInteract)
        XCTAssertEqual(state.fieldValue(form: nil as OpenUIString?, name: "name"), .null)
        XCTAssertEqual(state.fieldValue(form: nil as OpenUIString?, name: "another"), .null)
        XCTAssertNotEqual(state.stateValue("$name"), .string("stale"))
        Task { @MainActor in
            defer { done.fulfill() }
            let events = await old.triggerAction("stale")
            XCTAssertTrue(events.isEmpty)
        }
        wait(for: [done], timeout: 3)
    }

    @MainActor func testRetiringAnOldFieldDoesNotRemoveItsReplacementValidation() {
        let validation = NativeFormValidation()
        let old = UUID()
        let current = UUID()
        let rules = [ParsedRule(type: "required")]
        validation.register("email", owner: old, rules: rules, value: { .string("old") })
        validation.register("email", owner: current, rules: rules, value: { .string("") })
        validation.unregister("email", owner: old)
        XCTAssertFalse(validation.validateAll())
        validation.unregister("email", owner: current)
        XCTAssertTrue(validation.validateAll())
    }

    @MainActor func testUpstreamButtonUsesTheHostNavigationActionPipeline() throws {
        let done = expectation(description: "Host navigation")
        let base = try OpenUIStandardComponents.library()
        let library = try base.extending(
            actions: [
                defineAction(
                    name: "OpenItinerary", description: "Host-owned map with itinerary",
                    params: [OpenUIParameter.string("trip")])
            ])
        let state = OpenUIState(schema: library.library.toSchema())
        state.setSource("root=Stack([Button(\"View itinerary\",@OpenItinerary(\"trip-a\"))])")
        XCTAssertTrue(state.errors.isEmpty, "\(state.errors)")
        let context = OpenUIComponentContext(
            element: PropValue.children(state.root!)[0], registry: library.registry, state: state)
        Task { @MainActor in
            defer { done.fulfill() }
            let events = await context.perform(context.action()!)
            XCTAssertEqual(events.first?.type, "OpenItinerary")
            XCTAssertEqual(events.first?.params.first?.1, .string("trip-a"))
        }
        wait(for: [done], timeout: 3)
    }

    @MainActor func testDiagnosticsRemainObservableWhenASiblingCanRender() throws {
        let library = try OpenUIStandardComponents.library()
        let state = OpenUIState(schema: library.library.toSchema())
        var callbacks = 0
        var errors: [OpenUIError] = []
        state.onParseResult = { _ in callbacks += 1 }
        state.onError = { errors = $0 }
        state.setSource("root=Stack([TextContent(\"visible\"),MissingComponent()])")
        XCTAssertNotNil(state.root)
        XCTAssertFalse(errors.isEmpty)
        XCTAssertEqual(callbacks, 1)
        state.setState("$selection", value: .string("local"))
        XCTAssertEqual(callbacks, 1, "State changes must not pretend a new parse happened")
        state.setSource("root=Stack([TextContent(\"recovered\")])")
        XCTAssertTrue(errors.isEmpty)
        XCTAssertEqual(callbacks, 2)
        state.setSource("root=MissingComponent()")
        XCTAssertFalse(errors.isEmpty)
        state.reset()
        XCTAssertTrue(errors.isEmpty, "Reset must clear the host's error display")
    }

    func testCalendarDatesUseJavaScriptDateJSONAndReadLegacyDays() throws {
        let date = try XCTUnwrap(NativeCalendarDate.parse(.string("2028-02-29T00:00:00.123Z")))
        XCTAssertEqual(NativeCalendarDate.encode(date), .string("2028-02-29T00:00:00.123Z"))
        let offset = try XCTUnwrap(NativeCalendarDate.parse(.string("2028-02-29T08:00:00+08:00")))
        XCTAssertEqual(NativeCalendarDate.encode(offset), .string("2028-02-29T00:00:00.000Z"))
        XCTAssertNotNil(NativeCalendarDate.parse(.string("2028-02-29")))
        XCTAssertNil(NativeCalendarDate.parse(.string("2027-02-29")))
        XCTAssertNil(NativeCalendarDate.parse(.string("tomorrow")))
        XCTAssertNil(NativeCalendarDate.parse(.string(OpenUIString(codeUnits: [0xD800]))))
    }
}
