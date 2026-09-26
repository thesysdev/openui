import Foundation

public class Parser {
    private var input: String
    private var index: String.Index
    public var library: ComponentLibrary?
    
    public init(library: ComponentLibrary? = nil) {
        self.input = ""
        self.index = "".startIndex
        self.library = library
    }
    
    public func parse(_ text: String) -> ParseResult {
        self.input = text
        self.index = text.startIndex
        
        var statements: [Statement] = []
        var context: [String: ASTNode] = [:]
        var queryStatements: [QueryStatementInfo] = []
        var mutationStatements: [MutationStatementInfo] = []
        
        while index < input.endIndex {
            skipWhitespace()
            guard index < input.endIndex else { break }
            
            let startIdx = index
            if input[index] == "$" {
                advance()
                if let id = parseIdentifier() {
                    skipWhitespace()
                    if match("=") {
                        skipWhitespace()
                        if let expr = parseExpression() {
                            statements.append(.state(id: id, initExpr: expr))
                            context[id] = expr
                            continue
                        }
                    }
                }
            } else if let id = parseIdentifier() {
                skipWhitespace()
                if match("=") {
                    skipWhitespace()
                    if let expr = parseExpression() {
                        if case let .comp(name, args, _) = expr, name == "Query" {
                            let deps = collectQueryDeps(expr)
                            let call = CallNode(callee: name, args: args)
                            statements.append(.query(id: id, call: call, expr: expr, deps: deps.isEmpty ? nil : deps))
                            
                            let info = QueryStatementInfo(
                                statementId: id,
                                toolAST: args.count > 0 ? args[0] : nil,
                                argsAST: args.count > 1 ? args[1] : nil,
                                defaultsAST: args.count > 2 ? args[2] : nil,
                                refreshAST: args.count > 3 ? args[3] : nil,
                                deps: deps.isEmpty ? nil : deps,
                                complete: true
                            )
                            queryStatements.append(info)
                        } else if case let .comp(name, args, _) = expr, name == "Mutation" {
                            let call = CallNode(callee: name, args: args)
                            statements.append(.mutation(id: id, call: call, expr: expr))
                            
                            let info = MutationStatementInfo(
                                statementId: id,
                                toolAST: args.count > 0 ? args[0] : nil,
                                argsAST: args.count > 1 ? args[1] : nil
                            )
                            mutationStatements.append(info)
                        } else {
                            statements.append(.value(id: id, expr: expr))
                            context[id] = expr
                        }
                        continue
                    }
                }
            }
            
            // If we failed to parse a statement, skip one character to avoid infinite loops
            if index == startIdx {
                advance()
            }
        }
        
        var rootNode: ElementNode? = nil
        let entryId = statements.first(where: {
            if case let .value(id, _) = $0 { return id == "root" }
            return false
        }) != nil ? "root" : statements.first(where: { 
            if case .value = $0 { return true }
            return false
        }).flatMap { 
            if case let .value(id, _) = $0 { return id }
            return nil
        }
        
        var errors: [ValidationError] = []
        var visited: Set<String> = []
        
        if let entryId = entryId, let rootExpr = context[entryId] {
            rootNode = materialize(rootExpr, context: context, statementId: entryId, visited: &visited, errors: &errors)
        }
        
        let meta = ParseResultMeta(incomplete: false, unresolved: [], orphaned: [], statementCount: statements.count, errors: errors)
        return ParseResult(root: rootNode, meta: meta, stateDeclarations: [:], queryStatements: queryStatements, mutationStatements: mutationStatements)
    }
    
    private func collectQueryDeps(_ node: ASTNode) -> [String] {
        var deps: [String] = []
        func walk(_ current: ASTNode) {
            if case let .stateRef(id) = current {
                deps.append(id)
            }
            switch current {
            case let .comp(_, args, mappedProps):
                args.forEach(walk)
                mappedProps?.values.forEach(walk)
            case let .arr(arr):
                arr.forEach(walk)
            case let .obj(dict):
                dict.forEach { walk($0.1) }
            case let .binOp(_, left, right):
                walk(left)
                walk(right)
            case let .unaryOp(_, operand):
                walk(operand)
            case let .ternary(cond, then, els):
                walk(cond)
                walk(then)
                walk(els)
            case let .member(obj, _):
                walk(obj)
            case let .index(obj, index):
                walk(obj)
                walk(index)
            case let .assign(_, value):
                walk(value)
            default: break
            }
        }
        walk(node)
        return deps
    }
    
    private func parseExpression() -> ASTNode? {
        guard let primary = parsePrimaryExpression() else { return nil }
        
        skipWhitespace()
        if match("?") {
            skipWhitespace()
            guard let thenExpr = parseExpression() else { return primary }
            skipWhitespace()
            if match(":") {
                skipWhitespace()
                guard let elseExpr = parseExpression() else { return primary }
                return .ternary(cond: primary, then: thenExpr, else: elseExpr)
            }
        }
        
        return primary
    }
    
    private func parsePrimaryExpression() -> ASTNode? {
        skipWhitespace()
        if index >= input.endIndex { return nil }
        
        let c = input[index]
        if c == "\"" {
            return .str(parseString())
        } else if c == "{" {
            return .obj(parseObject())
        } else if c == "[" {
            return .arr(parseArray())
        } else if c == "$" {
            advance()
            if let ident = parseIdentifier() {
                return .stateRef(ident)
            }
            return nil
        } else if c == "@" {
            advance()
            if let ident = parseIdentifier() {
                skipWhitespace()
                if match("(") {
                    let args = parseArguments()
                    return .comp(name: "@" + ident, args: args.0, mappedProps: args.1)
                } else {
                    return .ref("@" + ident)
                }
            }
            return nil
        } else if c == "-" || c.isNumber {
            return .num(parseNumber())
        } else if input[index...].hasPrefix("null") {
            advance(by: 4); return .null
        } else if input[index...].hasPrefix("true") {
            advance(by: 4); return .bool(true)
        } else if input[index...].hasPrefix("false") {
            advance(by: 5); return .bool(false)
        } else if let ident = parseIdentifier() {
            skipWhitespace()
            if match("(") {
                let args = parseArguments()
                return .comp(name: ident, args: args.0, mappedProps: args.1)
            } else {
                return parseMemberAccess(base: .ref(ident))
            }
        }
        return nil
    }
    
    private func parseMemberAccess(base: ASTNode) -> ASTNode {
        var current = base
        while index < input.endIndex {
            skipWhitespace()
            if match(".") {
                skipWhitespace()
                if let field = parseIdentifier() {
                    current = .member(obj: current, field: field)
                } else {
                    break
                }
            } else {
                break
            }
        }
        return current
    }
    
    private func parseString() -> String {
        advance() // skip "
        var result = ""
        while index < input.endIndex && input[index] != "\"" {
            if input[index] == "\\" {
                advance()
                if index < input.endIndex {
                    result.append(input[index])
                    advance()
                }
            } else {
                result.append(input[index])
                advance()
            }
        }
        if index < input.endIndex { advance() } // skip "
        return result
    }
    
    private func parseNumber() -> Double {
        var result = ""
        if index < input.endIndex && input[index] == "-" {
            result.append("-")
            advance()
        }
        while index < input.endIndex && (input[index].isNumber || input[index] == ".") {
            result.append(input[index])
            advance()
        }
        return Double(result) ?? 0
    }
    
    private func parseObject() -> [(String, ASTNode)] {
        advance() // skip {
        var properties: [(String, ASTNode)] = []
        while index < input.endIndex {
            skipWhitespace()
            if match("}") { break }
            let startIdx = index
            if let key = parseIdentifier() ?? parseStringKey() {
                skipWhitespace()
                if match(":") {
                    skipWhitespace()
                    if let expr = parseExpression() {
                        properties.append((key, expr))
                    }
                }
            }
            if index == startIdx { advance() } // avoid infinite loop
            skipWhitespace()
            _ = match(",")
        }
        return properties
    }
    
    private func parseStringKey() -> String? {
        if index < input.endIndex && input[index] == "\"" {
            return parseString()
        }
        return nil
    }
    
    private func parseArray() -> [ASTNode] {
        advance() // skip [
        var elements: [ASTNode] = []
        while index < input.endIndex {
            skipWhitespace()
            if match("]") { break }
            let startIdx = index
            if let expr = parseExpression() {
                elements.append(expr)
            }
            if index == startIdx { advance() } // avoid infinite loop
            skipWhitespace()
            _ = match(",")
        }
        return elements
    }
    
    private func parseArguments() -> ([ASTNode], [String: ASTNode]) {
        var args: [ASTNode] = []
        var props: [String: ASTNode] = [:]
        
        while index < input.endIndex {
            skipWhitespace()
            if match(")") { break }
            
            let startIdx = index
            if let ident = parseIdentifier() {
                skipWhitespace()
                if match(":") {
                    skipWhitespace()
                    if let expr = parseExpression() {
                        props[ident] = expr
                    }
                } else {
                    index = startIdx
                    if let expr = parseExpression() {
                        args.append(expr)
                    }
                }
            } else {
                if let expr = parseExpression() {
                    args.append(expr)
                }
            }
            if index == startIdx { advance() } // avoid infinite loop
            
            skipWhitespace()
            _ = match(",")
        }
        
        return (args, props)
    }
    
    private func parseIdentifier() -> String? {
        guard index < input.endIndex, input[index].isLetter || input[index] == "_" else { return nil }
        var result = ""
        while index < input.endIndex && (input[index].isLetter || input[index].isNumber || input[index] == "_") {
            result.append(input[index])
            advance()
        }
        return result
    }
    
    private func skipWhitespace() {
        while index < input.endIndex && input[index].isWhitespace {
            advance()
        }
    }
    
    private func match(_ str: String) -> Bool {
        if input[index...].hasPrefix(str) {
            advance(by: str.count)
            return true
        }
        return false
    }
    
    private func advance(by count: Int = 1) {
        index = input.index(index, offsetBy: count, limitedBy: input.endIndex) ?? input.endIndex
    }
    
    private func materialize(_ node: ASTNode, context: [String: ASTNode], statementId: String? = nil, visited: inout Set<String>, errors: inout [ValidationError]) -> ElementNode? {
        switch node {
        case let .ref(ident):
            if visited.contains(ident) { return nil } // cycle detection
            visited.insert(ident)
            defer { visited.remove(ident) }
            
            if let refNode = context[ident] {
                return materialize(refNode, context: context, statementId: ident, visited: &visited, errors: &errors)
            }
            return nil
        case let .comp(name, args, mappedProps):
            var propsMap: [String: Any] = [:]
            var finalMappedProps = mappedProps ?? [:]
            
            var hasDynamicProps = false
            
            if let library = self.library, let compDef = library.components[name] {
                for (i, arg) in args.enumerated() {
                    if i < compDef.params.count {
                        let paramName = compDef.params[i]
                        if finalMappedProps[paramName] == nil {
                            finalMappedProps[paramName] = arg
                        }
                    }
                }
            } else {
                // If no library is provided, fallback to "children" for the first arg if it's an array
                if args.count > 0 && finalMappedProps["children"] == nil {
                    finalMappedProps["children"] = args[0]
                }
                
                errors.append(ValidationError(code: .unknownComponent, component: name, path: "", message: "Unknown component \(name)", statementId: statementId))
            }
            
            for (k, v) in finalMappedProps {
                if v.isRuntimeExpr {
                    propsMap[k] = v // retain AST
                    hasDynamicProps = true
                } else if let val = materializeValue(v, context: context, visited: &visited, errors: &errors) {
                    propsMap[k] = val
                }
            }
            return ElementNode(statementId: statementId, typeName: name, props: propsMap, partial: false, hasDynamicProps: hasDynamicProps)
        default:
            return nil
        }
    }
    
    private func materializeValue(_ node: ASTNode, context: [String: ASTNode], visited: inout Set<String>, errors: inout [ValidationError]) -> Any? {
        switch node {
        case let .str(s): return s
        case let .num(n): return n
        case let .bool(b): return b
        case .null: return nil
        case let .arr(arr): 
            return arr.compactMap { materializeValue($0, context: context, visited: &visited, errors: &errors) }
        case let .obj(dict):
            var res: [String: Any] = [:]
            for (k, v) in dict {
                res[k] = materializeValue(v, context: context, visited: &visited, errors: &errors)
            }
            return res
        case .comp: 
            if let el = materialize(node, context: context, visited: &visited, errors: &errors) {
                return el
            }
            return nil
        case let .ref(ident):
            if visited.contains(ident) { return nil } // cycle detection
            visited.insert(ident)
            defer { visited.remove(ident) }
            
            if let resolved = context[ident] {
                if case .comp = resolved {
                    return materialize(resolved, context: context, statementId: ident, visited: &visited, errors: &errors)
                }
                return materializeValue(resolved, context: context, visited: &visited, errors: &errors)
            }
            return nil
        case .stateRef, .ternary, .binOp, .unaryOp, .member, .index, .assign:
            return node // Retain ASTNode for dynamic expressions
        default: return nil
        }
    }
}
