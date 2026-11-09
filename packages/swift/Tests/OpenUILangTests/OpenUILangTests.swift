import XCTest
@testable import OpenUILang

final class OpenUILangTests: XCTestCase {
    func testParserWithPositionalArgs() throws {
        let library = ComponentLibrary()
        library.register(component: ComponentDef(name: "Button", description: "Clickable button", signature: "Button(label: String, action: String)"))
        
        let parser = Parser(library: library)
        let result = parser.parse("root = Button(\"Submit\", \"submit:signup\")")
        
        XCTAssertNotNil(result.root)
        XCTAssertEqual(result.root?.typeName, "Button")
        XCTAssertEqual(result.root?.props["label"] as? String, "Submit")
        XCTAssertEqual(result.root?.props["action"] as? String, "submit:signup")
    }
    
    func testParserWithReferences() throws {
        let library = ComponentLibrary()
        library.register(component: ComponentDef(name: "Stack", description: "Stack", signature: "Stack(children: [Any])"))
        library.register(component: ComponentDef(name: "Text", description: "Text display", signature: "Text(text: String)"))
        
        let parser = Parser(library: library)
        let text = """
        root = Stack([header])
        header = Text("Hello Nested")
        """
        let result = parser.parse(text)
        
        XCTAssertNotNil(result.root)
        XCTAssertEqual(result.root?.typeName, "Stack")
        
        let children = result.root?.props["children"] as? [Any]
        XCTAssertNotNil(children)
        XCTAssertEqual(children?.count, 1)
        
        if let child = children?.first as? ElementNode {
            XCTAssertEqual(child.typeName, "Text")
            XCTAssertEqual(child.props["text"] as? String, "Hello Nested")
        } else {
            XCTFail("Child is not an ElementNode")
        }
    }
    
    func testParserWithDynamicSyntax() throws {
        let library = ComponentLibrary()
        library.register(component: ComponentDef(name: "Text", description: "Text display", signature: "Text(text: String)"))
        
        let parser = Parser(library: library)
        let text = """
        $isLoading = true
        root = Text($isLoading ? "Loading..." : "Ready")
        """
        let result = parser.parse(text)
        
        XCTAssertNotNil(result.root)
        XCTAssertEqual(result.root?.typeName, "Text")
        XCTAssertTrue(result.root?.hasDynamicProps == true)
        
        if let ast = result.root?.props["text"] as? ASTNode {
            if case .ternary = ast {
                // Success
            } else {
                XCTFail("Expected ternary AST node")
            }
        } else {
            XCTFail("Expected ASTNode in props")
        }
    }
    
    func testParserWithCycle() throws {
        let library = ComponentLibrary()
        let parser = Parser(library: library)
        let text = """
        a = b
        b = a
        root = a
        """
        let result = parser.parse(text)
        XCTAssertNil(result.root) // Should safely return nil without crashing
    }
    
    func testQueryAndMutationExtraction() throws {
        let library = ComponentLibrary()
        let parser = Parser(library: library)
        let text = """
        $foo = Query("tool", {}, {rows: []})
        $bar = Mutation("update", {})
        """
        let result = parser.parse(text)
        XCTAssertEqual(result.queryStatements.count, 1)
        XCTAssertEqual(result.queryStatements[0].statementId, "$foo")
        
        XCTAssertEqual(result.mutationStatements.count, 1)
        XCTAssertEqual(result.mutationStatements[0].statementId, "$bar")
    }
    
    func testParserObjectAndNull() throws {
        let library = ComponentLibrary()
        let parser = Parser(library: library)
        let text = """
        root = CustomComponent({ key: "value", nullable: null })
        """
        let result = parser.parse(text)
        XCTAssertNotNil(result.root)
        XCTAssertEqual(result.meta.errors.count, 1) // Unknown component error
        XCTAssertEqual(result.meta.errors[0].code, .unknownComponent)
        
        let props = result.root?.props["children"] as? [String: Any]
        XCTAssertEqual(props?["key"] as? String, "value")
        // Null is materialized as nil or simply missing from dictionary if optional,
        // Wait, materializeValue returns Any? so if null it returns nil, which dict won't insert.
        XCTAssertNil(props?["nullable"])
    }
    
    func testPromptGenerator() throws {
        let library = ComponentLibrary()
        library.register(component: ComponentDef(name: "Text", description: "Text display", signature: "Text(text: String)"))
        let prompt = PromptGenerator.generatePrompt(library: library)
        
        XCTAssertTrue(prompt.contains("Text(text: String): Text display"))
    }
}
