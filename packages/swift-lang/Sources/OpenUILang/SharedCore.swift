import Foundation
import JavaScriptCore

/// Accessed only inside the shared realm lock, like CoreParseSnapshot.
/// Ownership follows a schema value; there is no process-wide schema registry.
final class CoreLibraryCache: @unchecked Sendable {
    var value: JSValue?
}

/// JSValue is used only while holding SharedCore's serialized realm lock.
final class CoreParseSnapshot: @unchecked Sendable {
    let value: JSValue
    private var cachedRoot: ElementNode?
    private var cachedExpression: ASTNode?
    private(set) var didReadRoot = false
    private var didReadExpression = false

    init(value: JSValue) { self.value = value }

    // Native inspection is optional. Rendering can evaluate the original core
    // snapshot without copying every materialized prop across the JS bridge.
    var root: ElementNode? { SharedCore.shared.sync {
        if !didReadRoot {
            let raw = value.forProperty("root")!
            cachedRoot = raw.isNull || raw.isUndefined ? nil : SharedCore.shared.element(raw)
            didReadRoot = true
        }
        return cachedRoot
    } }
    var expression: ASTNode? { SharedCore.shared.sync {
        if !didReadExpression {
            let raw = value.forProperty("rootExpression")!
            cachedExpression = raw.isUndefined ? nil : SharedCore.shared.decodeAST(raw)
            didReadExpression = true
        }
        return cachedExpression
    } }
    func matches(_ result: ParseResult) -> Bool { result.usesSnapshot(self) }
}

enum LangCoreResources {
    static let bundle = resolve(in: .main) { .module }

    static func resolve(in host: Bundle, fallback: () -> Bundle) -> Bundle {
        if let resources = host.resourceURL {
            for name in ["openui_OpenUILang.bundle", "swift-lang_OpenUILang.bundle"] {
                if let embedded = Bundle(url: resources.appendingPathComponent(name)) {
                    return embedded
                }
            }
        }
        return fallback()
    }
}

/// Private serialized realm. Instances own parser/store/query objects; the realm
/// owns only immutable code and weak native identity records. No model JS runs.
final class SharedCore {
    static let shared = SharedCore()
    let context: JSContext
    private let lock = NSRecursiveLock()
    private var identities: [ObjectIdentifier: Record] = [:]
    private var decoded: [Int: WeakObject] = [:]
    private var operations = 0
    private var depth = 0
    private var timers: [Int: DispatchSourceTimer] = [:]
    private var timerID = 0
    private final class WeakObject { weak var object: AnyObject?; init(_ object: AnyObject) { self.object = object } }
    private final class Record {
        weak var object: AnyObject?
        let value: JSValue
        init(_ object: AnyObject, _ value: JSValue) { self.object = object; self.value = value }
    }
    private init() {
        context = JSContext()!
        context.exceptionHandler = { _, _ in } // inspected at the operation boundary
        let utf8Encode: @convention(block) (String) -> [UInt8] = { Array($0.utf8) }
        let utf8Decode: @convention(block) (JSValue) -> String = { value in
            let count = Int(value.forProperty("length").toInt32())
            return String(decoding: (0..<count).map { UInt8(truncatingIfNeeded: value.atIndex($0).toUInt32()) }, as: UTF8.self)
        }
        context.setObject(utf8Encode, forKeyedSubscript: "__utf8Encode" as NSString)
        context.setObject(utf8Decode, forKeyedSubscript: "__utf8Decode" as NSString)
        let interval: @convention(block) (JSValue, Double) -> Int = { [weak self] callback, milliseconds in
            guard let self else { return 0 }
            self.timerID += 1; let id = self.timerID
            guard milliseconds.isFinite, self.timers.count < 4096 else { return 0 }
            let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.global(qos: .utility))
            let seconds = max(0.001, min(milliseconds / 1000, 31536000))
            timer.schedule(deadline: .now() + seconds, repeating: seconds)
            timer.setEventHandler { [weak self] in self?.sync { guard self?.timers[id] != nil else { return };callback.call(withArguments: []) } }
            self.timers[id] = timer;timer.resume();return id
        }
        let clear: @convention(block) (Int) -> Void = { [weak self] id in self?.timers.removeValue(forKey: id)?.cancel() }
        context.setObject(interval, forKeyedSubscript: "setInterval" as NSString)
        context.setObject(clear, forKeyedSubscript: "clearInterval" as NSString)
        let pattern: @convention(block) (JSValue, JSValue) -> String = { pattern, value in
            func units(_ js: JSValue) -> OpenUIString {
                let ref = JSValueToStringCopy(js.context.jsGlobalContextRef, js.jsValueRef, nil)!
                defer { JSStringRelease(ref) }
                let count = JSStringGetLength(ref)
                return OpenUIString(codeUnits: count == 0 ? [] : Array(UnsafeBufferPointer(start: JSStringGetCharactersPtr(ref), count: count)))
            }
            switch testRegExp(units(pattern), value: units(value)) {
            case .matches: return "matches"
            case .noMatch: return "noMatch"
            case .invalidPattern: return "invalidPattern"
            case .resourceError: return "resourceError"
            }
        }
        context.setObject(pattern, forKeyedSubscript: "__nativePattern" as NSString)
        let url = LangCoreResources.bundle.url(forResource: "lang-core", withExtension: "js")!
        context.evaluateScript(try! String(contentsOf: url, encoding: .utf8), withSourceURL: url)
        precondition(context.exception == nil, "Cannot load bundled lang-core")
    }
    func sync<T>(_ body: () throws -> T) rethrows -> T {
        lock.lock(); depth += 1
        defer {
            depth -= 1
            if depth == 0 {
                operations += 1
                if operations % 32 == 0 {
                    identities = identities.filter { $0.value.object != nil }
                    decoded = decoded.filter { $0.value.object != nil }
                }
            }
            lock.unlock()
        }
        return try body()
    }
    func call(_ name: String, _ arguments: [Any] = []) -> JSValue {
        let result = context.objectForKeyedSubscript("SwiftCore").invokeMethod(name, withArguments: arguments)!
        // Adapter methods return structured errors; an exception here is a bridge bug.
        if let exception = context.exception {
            context.exception = nil
            assertionFailure("lang-core bridge: \(name): \(exception.toString() ?? "exception")")
            return JSValue(undefinedIn: context)
        }
        return result
    }
    func string(_ value: OpenUIString) -> JSValue {
        let js = value.codeUnits.withUnsafeBufferPointer { JSStringCreateWithCharacters($0.baseAddress, $0.count)! }
        defer { JSStringRelease(js) }
        return JSValue(jsValueRef: JSValueMakeString(context.jsGlobalContextRef, js), in: context)
    }
    func string(_ value: JSValue) -> OpenUIString {
        guard let raw = JSValueToStringCopy(context.jsGlobalContextRef, value.jsValueRef, nil) else { return "" }
        defer { JSStringRelease(raw) }
        let count = JSStringGetLength(raw)
        guard count > 0, let pointer = JSStringGetCharactersPtr(raw) else { return "" }
        return OpenUIString(codeUnits: Array(UnsafeBufferPointer(start: pointer, count: count)))
    }
    func object(_ fields: [(OpenUIString, JSValue)] = []) -> JSValue {
        let obj = call("object")
        for (key, value) in fields { set(obj, key, value) }
        return obj
    }
    func set(_ object: JSValue, _ key: OpenUIString, _ value: JSValue) {
        _ = call("define", [object, string(key), value])
    }
    func get(_ object: JSValue, _ key: OpenUIString) -> JSValue {
        let js = key.codeUnits.withUnsafeBufferPointer { JSStringCreateWithCharacters($0.baseAddress, $0.count)! }
        defer { JSStringRelease(js) }
        return JSValue(jsValueRef: JSObjectGetProperty(context.jsGlobalContextRef, JSValueToObject(context.jsGlobalContextRef, object.jsValueRef, nil), js, nil), in: context)
    }
    func entries(_ object: JSValue) -> [(OpenUIString, JSValue)] {
        guard object.isObject else { return [] }
        let keys = call("keys", [object])
        return (0..<Int(keys.forProperty("length").toInt32())).map { index in
            let key = string(keys.atIndex(index)!)
            return (key, get(object, key))
        }
    }
    func array(_ items: [JSValue]) -> JSValue { JSValue(object: items, in: context) }
    func json(_ value: JSONValue) -> JSValue { call("json", [jsonStringify(value)]) }
    func remember(_ object: AnyObject, _ js: JSValue) {
        let kind: String
        switch object {
        case is OpenUIObject: kind = "object"
        case is OpenUIArray: kind = "array"
        case is EvaluatedElement: kind = "element"
        case is ActionPlan: kind = "plan"
        case is ReactiveAssign: kind = "binding"
        default: return
        }
        _ = call("tag", [js, kind])
        identities[ObjectIdentifier(object)] = Record(object, js)
        decoded[Int(call("identity", [js]).toInt32())] = WeakObject(object)
    }
    func encode(_ value: Value) -> JSValue {
        let native: AnyObject?
        switch value {
        case .array(let v): native = v
        case .object(let v): native = v
        case .element(let v): native = v
        case .actionPlan(let v): native = v
        case .binding(let v), .reactiveBinding(let v): native = v
        default: native = nil
        }
        if let native, let record = identities[ObjectIdentifier(native)], record.object === native { return record.value }
        let result: JSValue
        switch value {
        case .null: return JSValue(nullIn: context)
        case .undefined: return JSValue(undefinedIn: context)
        case .string(let s): return string(s)
        case .number(let n): return JSValue(double: n, in: context)
        case .boolean(let b): return JSValue(bool: b, in: context)
        case .array(let a): result = array(a.map(encode))
        case .object(let o): result = object(o.map { ($0.key, encode($0.value)) })
        case .element(let e): result = encodeElement(e)
        case .binding(let b), .reactiveBinding(let b):
            result = object([("__reactive", string("assign")), ("target", string(OpenUIString(b.target))), ("expr", ast(b.expression))])
        case .actionPlan(let plan): result = call("tagNativeSource", [call("nativePlan", [object([("steps", array(plan.steps.map(encodeStep)))])]), JSValue(bool: plan.isSourceComplete, in: context)!])
        }
        if let native { remember(native, result) }
        return result
    }
    func decode(_ js: JSValue, level: Int = 0, interpret: Bool = true) -> Value {
        guard level < 256 else { return .null }
        if js.isUndefined { return .undefined }; if js.isNull { return .null }
        if js.isString { return .string(string(js)) }; if js.isBoolean { return .boolean(js.toBool()) }; if js.isNumber { return .number(js.toDouble()) }
        let id = Int(call("identity", [js]).toInt32())
        if let obj = decoded[id]?.object {
            if let a = obj as? OpenUIArray { return .array(a) }; if let o = obj as? OpenUIObject { return .object(o) }
            if let e = obj as? EvaluatedElement, e.isSourceComplete == call("sourceComplete", [js]).toBool() { return .element(e) }
            if let a = obj as? ActionPlan, a.isSourceComplete == call("sourceComplete", [js]).toBool() { return .actionPlan(a) }
            if let b = obj as? ReactiveAssign { return .reactiveBinding(b) }
        }
        let result: Value
        let tagged = call("kind", [js]).toString()
        let runtimeShape = interpret && tagged != "object"
        if js.isArray { result = .array(items(js).map { decode($0, level: level + 1, interpret: interpret) }) }
        else if runtimeShape && js.forProperty("type").isString && js.forProperty("type").toString() == "element" {
            result = .element(EvaluatedElement(typeName: js.forProperty("typeName").toString(), props: entries(js.forProperty("props")).map { ($0.0.displayString, decode($0.1, level: level + 1, interpret: interpret)) }, statementId: optionalString(js.forProperty("statementId")), partial: js.forProperty("partial").toBool(), isSourceComplete: call("sourceComplete", [js]).toBool()))
        } else if runtimeShape && js.forProperty("__reactive").isString && js.forProperty("__reactive").toString() == "assign" {
            let target = js.forProperty("target").toString()!
            let expression = decodeAST(js.forProperty("expr"))
            result = expression == .stateRef("$value") ? .binding(target) : .reactiveBinding(target: target, expression: expression)
        } else if runtimeShape && js.forProperty("steps").isArray {
            result = .actionPlan(ActionPlan(steps: items(call("actionSteps", [js])).compactMap(decodeStep), isSourceComplete: call("sourceComplete", [js]).toBool()))
        } else { result = .object(entries(js).map { ObjectField(key: $0.0, value: decode($0.1, level: level + 1, interpret: interpret)) }) }
        switch result {
        case .array(let a): remember(a, js)
        case .object(let o): remember(o, js)
        case .element(let e): remember(e, js)
        case .actionPlan(let a): remember(a, js)
        case .binding(let b), .reactiveBinding(let b): remember(b, js)
        default: break
        }
        return result
    }
    func items(_ js: JSValue) -> [JSValue] {
        guard js.isArray else { return [] }
        return (0..<Int(js.forProperty("length").toInt32())).map { js.atIndex($0)! }
    }
    func optionalString(_ js: JSValue) -> String? { js.isNull || js.isUndefined ? nil : js.toString() }
    func ast(_ node: ASTNode) -> JSValue {
        if case .runtimeValue(let value) = node { return call("capture", [encode(value)]) }
        if case .comp(let name, let args, let mapped, let fn) = node {
            let js = object([("k", string("Comp")), ("name", string(OpenUIString(name))), ("args", array(args.map(ast)))])
            if let mapped { js.setValue(object(mapped.map { (OpenUIString($0.0), ast($0.1)) }), forProperty: "mappedProps") }
            if fn { js.setValue(true, forProperty: "fn") }; return js
        }
        // Replace nested runtime captures recursively, retaining the upstream AST shape.
        let value = protocolASTValue(node)
        switch node {
        case .arr(let a): return object([("k", string("Arr")), ("els", array(a.map(ast)))])
        case .obj(let o): return object([("k", string("Obj")), ("entries", array(o.map { array([string($0.0), ast($0.1)]) }))])
        case .binOp(let op, let l, let r): return object([("k", string("BinOp")), ("op", string(OpenUIString(op))), ("left", ast(l)), ("right", ast(r))])
        case .unaryOp(let op, let n): return object([("k", string("UnaryOp")), ("op", string(OpenUIString(op))), ("operand", ast(n))])
        case .ternary(let c, let t, let e): return object([("k", string("Ternary")), ("cond", ast(c)), ("then", ast(t)), ("else", ast(e))])
        case .member(let n, let f): return object([("k", string("Member")), ("obj", ast(n)), ("field", string(f))])
        case .index(let n, let i): return object([("k", string("Index")), ("obj", ast(n)), ("index", ast(i))])
        case .assign(let t, let v): return object([("k", string("Assign")), ("target", string(OpenUIString(t))), ("value", ast(v))])
        default: break
        }
        return encode(value)
    }
    func decodeAST(_ js: JSValue) -> ASTNode {
        if call("hasCapture", [js]).toBool() { return .runtimeValue(decode(call("capturedValue", [js]))) }
        func a(_ key: String) -> ASTNode { decodeAST(js.forProperty(key)) }
        func s(_ key: String) -> String { js.forProperty(key).toString() ?? "" }
        switch s("k") {
        case "Str": return .str(string(js.forProperty("v")))
        case "Num": return .num(js.forProperty("v").toDouble())
        case "Bool": return .bool(js.forProperty("v").toBool())
        case "Arr": return .arr(items(js.forProperty("els")).map(decodeAST))
        case "Obj": return .obj(items(js.forProperty("entries")).map { (string($0.atIndex(0)), decodeAST($0.atIndex(1))) })
        case "Ref": return .ref(s("n"))
        case "StateRef": return .stateRef(s("n"))
        case "RuntimeRef": return .runtimeRef(s("n"), refType: QueryRefType(rawValue: s("refType")) ?? .query)
        case "Ph": return .ph(s("n"))
        case "BinOp": return .binOp(s("op"), a("left"), a("right"))
        case "UnaryOp": return .unaryOp(s("op"), a("operand"))
        case "Ternary": return .ternary(a("cond"), a("then"), a("else"))
        case "Member": return .member(a("obj"), string(js.forProperty("field")))
        case "Index": return .index(a("obj"), a("index"))
        case "Assign": return .assign(s("target"), a("value"))
        case "Comp": return .comp(name: s("name"), args: items(js.forProperty("args")).map(decodeAST), mappedProps: js.forProperty("mappedProps").isUndefined ? nil : entries(js.forProperty("mappedProps")).map { ($0.0.displayString, decodeAST($0.1)) }, fn: js.forProperty("fn").toBool())
        default: return .null
        }
    }
    func materialized(_ js: JSValue) -> Materialized {
        if js.isArray { return .array(items(js).map(materialized)) }
        if js.isObject {
            if js.forProperty("type").isString && js.forProperty("type").toString() == "element" { return .element(element(js)) }
            if call("isAST", [js]).toBool() { return .expr(decodeAST(js)) }
            return .object(entries(js).map { ($0.0, materialized($0.1)) })
        }
        return js.isNull ? .null : .value(decode(js))
    }
    func element(_ js: JSValue) -> ElementNode {
        ElementNode(typeName: js.forProperty("typeName").toString(), props: entries(js.forProperty("props")).map { PropEntry(key: $0.0.displayString, value: materialized($0.1)) }, statementId: optionalString(js.forProperty("statementId")), partial: js.forProperty("partial").toBool(), hasDynamicProps: js.forProperty("hasDynamicProps").isUndefined || js.forProperty("hasDynamicProps").toBool())
    }
    func encodeElement(_ e: EvaluatedElement) -> JSValue {
        let js = object([("type", string("element")), ("typeName", string(OpenUIString(e.typeName))), ("props", object(e.props.map { (OpenUIString($0.0), encode($0.1)) })), ("partial", JSValue(bool: e.partial, in: context)!)])
        if let id = e.statementId { js.setValue(id, forProperty: "statementId") };return call("tagNativeSource", [js, JSValue(bool: e.isSourceComplete, in: context)!])
    }
    func materialized(_ value: Materialized) -> JSValue {
        switch value {
        case .expr(let node): return ast(node)
        case .stateDefault(let d): return encode(d.value)
        case .value(let v): return encode(v)
        case .null: return JSValue(nullIn: context)
        case .array(let a): return array(a.map(materialized))
        case .object(let o): return object(o.map { ($0.0, materialized($0.1)) })
        case .element(let e):
            let js = object([("type", string("element")), ("typeName", string(OpenUIString(e.typeName))), ("props", object(e.props.map { (OpenUIString($0.key), materialized($0.value)) })), ("partial", JSValue(bool: e.partial, in: context)!), ("hasDynamicProps", JSValue(bool: e.hasDynamicProps, in: context)!)])
            if let id = e.statementId { js.setValue(id, forProperty: "statementId") };return js
        }
    }
    func encodeStep(_ step: ActionStep) -> JSValue {
        func obj(_ type: String, _ fields: [(OpenUIString, JSValue)]) -> JSValue { object([("type", string(OpenUIString(type)))] + fields) }
        switch step {
        case .set(let t, let n): return obj("set", [("target", string(OpenUIString(t))), ("valueAST", ast(n))])
        case .reset(let ids): return obj("reset", [("targets", array(ids.map { string(OpenUIString($0)) }))])
        case .run(let id, let type): return obj("run", [("statementId", string(OpenUIString(id))), ("refType", string(OpenUIString(type.rawValue)))])
        case .continueConversation(let m, let c): return obj("continue_conversation", [("message", encode(literalValue(m) ?? .null)), ("context", encode(c.flatMap(literalValue) ?? .null))])
        case .openUrl(let n): return obj("open_url", [("url", encode(literalValue(n) ?? .null))])
        case .custom(let n, let a): return obj("custom_action", [("name", string(OpenUIString(n))), ("params", object(a.map { (OpenUIString($0.0), encode(literalValue($0.1) ?? .null)) }))])
        }
    }
    func decodeStep(_ js: JSValue) -> ActionStep? {
        guard js.isObject, js.forProperty("type").isString else { return nil }
        switch js.forProperty("type").toString()! {
        case "set": return .set(target: js.forProperty("target").toString(), valueAST: decodeAST(js.forProperty("valueAST")))
        case "reset": return .reset(targets: items(js.forProperty("targets")).map { $0.toString() })
        case "run": return .run(statementId: js.forProperty("statementId").toString(), refType: QueryRefType(rawValue: js.forProperty("refType").toString()) ?? .query)
        case "continue_conversation": return .continueConversation(messageAST: .runtimeValue(decode(js.forProperty("message"))), contextAST: js.forProperty("context").isNull || js.forProperty("context").isUndefined ? nil : .runtimeValue(decode(js.forProperty("context"), interpret: false)))
        case "open_url": return .openUrl(urlAST: .runtimeValue(decode(js.forProperty("url"))))
        case "custom_action": return .custom(name: js.forProperty("name").toString(), args: entries(js.forProperty("params")).map { ($0.0.displayString, .runtimeValue(decode($0.1, interpret: false))) })
        default: return nil
        }
    }
}

extension SharedCore {
    func core(_ name: String, _ args: [Any] = []) -> JSValue {
        context.objectForKeyedSubscript("SwiftCore").forProperty("api").invokeMethod(name, withArguments: args)
    }
    func parameters(_ params: [ParamDef]) -> JSONValue {
        .object([
            .init(key: "type", value: .string("object")),
            .init(key: "properties", value: .object(params.map { p in
                var fields = p.schema?.objectFields?.map { JSONField(key: $0.0, value: $0.1) } ?? []
                if p.hasDefault, !fields.contains(where: { $0.key == "default" }) { fields.append(.init(key: "default", value: plainValueJSON(p.defaultValue))) }
                return .init(key: p.name, value: .object(fields))
            })),
            .init(key: "required", value: .array(params.filter(\.required).map { .string($0.name) }))
        ])
    }
    func schemaJSON(_ schema: LibrarySchema) -> JSONValue {
        if let wire = schema.wireSchema { return wire }
        var fields: [JSONField] = [
            .init(key: "$defs", value: .object(schema.components.keys.sorted().map { .init(key: $0, value: parameters(schema.components[$0]!)) })),
            .init(key: "properties", value: .object(schema.components.keys.sorted().map { .init(key: $0, value: .object([.init(key: "$ref", value: .string("#/$defs/" + $0))])) }))
        ]
        for (key, kind) in [("functions", CallDef.Kind.function), ("actions", .action)] {
            fields.append(.init(key: key, value: .object(schema.callDefs.keys.sorted().compactMap { name in
                let def = schema.callDefs[name]!
                guard !def.isBuiltin, def.kind == kind else { return nil }
                return .init(key: name, value: .object([.init(key: "params", value: parameters(def.params))]))
            })))
        }
        if let root = schema.rootComponent { fields.append(.init(key: "root", value: .string(root))) }
        return .object(fields)
    }
    func library(_ schema: LibrarySchema) -> JSValue {
        if let prepared = schema.coreLibraryCache.value { return prepared }
        let bindings = object(schema.components.map { name, params in
            (OpenUIString(name), array(params.filter(\.isBindable).map { string(OpenUIString($0.name)) }))
        })
        let prepared = call("library", [json(schemaJSON(schema)), bindings])
        schema.coreLibraryCache.value = prepared
        return prepared
    }
    func error(_ js: JSValue) -> OpenUIError {
        OpenUIError(source: OpenUIErrorSource(rawValue: optionalString(js.forProperty("source")) ?? "parser") ?? .parser,
                    code: OpenUIErrorCode(rawValue: optionalString(js.forProperty("code")) ?? "runtime-error") ?? .runtimeError,
                    message: js.forProperty("message").toString() ?? "Shared core error",
                    statementId: optionalString(js.forProperty("statementId")), component: optionalString(js.forProperty("component")),
                    path: js.forProperty("path").isUndefined ? nil : string(js.forProperty("path")),
                    toolName: js.forProperty("toolName").isUndefined ? nil : string(js.forProperty("toolName")),
                    hint: optionalString(js.forProperty("hint")), severity: optionalString(js.forProperty("severity")))
    }
    func parseResult(_ js: JSValue) -> ParseResult {
        let meta = js.forProperty("meta")!
        return ParseResult(snapshot: CoreParseSnapshot(value: js),
            meta: ParseMeta(incomplete: meta.forProperty("incomplete").toBool(), unresolved: items(meta.forProperty("unresolved")).map { $0.toString() }, orphaned: items(meta.forProperty("orphaned")).map { $0.toString() }, statementCount: Int(meta.forProperty("statementCount").toInt32()), errors: items(meta.forProperty("errors")).map(error)),
            stateDeclarations: entries(js.forProperty("stateDeclarations")).map { ($0.0.displayString, .stateDefault(StateDefault(materialized($0.1)))) },
            queryStatements: items(js.forProperty("queryStatements")).map { q in
                func node(_ name: String) -> ASTNode? { q.forProperty(name).isUndefined ? nil : decodeAST(q.forProperty(name)) }
                return QueryStatementInfo(statementId: q.forProperty("statementId").toString(), toolAST: node("toolAST"), argsAST: node("argsAST"), defaultsAST: node("defaultsAST"), refreshAST: node("refreshAST"), deps: q.forProperty("deps").isUndefined ? nil : items(q.forProperty("deps")).map { $0.toString() }, complete: q.forProperty("complete").toBool())
            }, mutationStatements: items(js.forProperty("mutationStatements")).map { m in
                MutationStatementInfo(statementId: m.forProperty("statementId").toString(), toolAST: m.forProperty("toolAST").isUndefined ? nil : decodeAST(m.forProperty("toolAST")), argsAST: m.forProperty("argsAST").isUndefined ? nil : decodeAST(m.forProperty("argsAST")))
            })
    }
}

extension SharedCore {
    private var punctuation: [Token] { [.newline,.lParen,.rParen,.lBrack,.rBrack,.lBrace,.rBrace,.comma,.colon,.equals,.true,.false,.null,.eof] }
    private var operators: [(Int, Token)] { [(19,.dot),(20,.plus),(21,.minus),(22,.star),(23,.slash),(24,.percent),(25,.eqEq),(26,.notEq),(27,.greater),(28,.less),(29,.greaterEq),(30,.lessEq),(31,.and),(32,.or),(33,.not),(34,.question)] }
    func token(_ token: Token) -> JSValue {
        let t: Int; var value: JSValue?
        switch token {
        case .str(let s): t = 14; value = string(s)
        case .num(let n): t = 15; value = JSValue(double: n, in: context)
        case .ident(let n): t = 16; value = string(OpenUIString(n))
        case .type(let n): t = 17; value = string(OpenUIString(n))
        case .stateVar(let n): t = 18; value = string(OpenUIString(n))
        case .builtinCall(let n): t = 35; value = string(OpenUIString(n))
        default: t = punctuation.firstIndex(of: token) ?? operators.first(where: { $0.1 == token })?.0 ?? 13
        }
        let js = object([("t", JSValue(int32: Int32(t), in: context)!)])
        if let value { js.setValue(value, forProperty: "v") }; return js
    }
    func token(_ js: JSValue) -> Token {
        let t = Int(js.forProperty("t").toInt32()), v = js.forProperty("v")!
        if t < punctuation.count { return punctuation[max(0,t)] }
        switch t {
        case 14: return .str(string(v))
        case 15: return .num(v.toDouble())
        case 16: return .ident(v.toString())
        case 17: return .type(v.toString())
        case 18: return .stateVar(v.toString())
        case 35: return .builtinCall(v.toString())
        default: return operators.first(where: { $0.0 == t })?.1 ?? .eof
        }
    }
}

extension SharedCore {
    func rule(_ js: JSValue) -> ParsedRule {
        let arg = js.forProperty("arg")!
        let parameter: ValidationRuleParameter?
        if arg.isUndefined { parameter = nil }
        else if arg.isNumber { parameter = .number(arg.toDouble()) }
        else if arg.isString { parameter = .string(string(arg)) }
        else { parameter = .value(decode(arg)) }
        return ParsedRule(type: js.forProperty("type").toString(), arg: parameter)
    }
    func rule(_ rule: ParsedRule) -> JSValue {
        let js = object([("type", string(OpenUIString(rule.type)))])
        if let arg = rule.arg {
            let value: Value
            switch arg { case .number(let n): value = .number(n); case .string(let s): value = .string(s); case .value(let v): value = v }
            js.setValue(encode(value), forProperty: "arg")
        }
        return js
    }
}
