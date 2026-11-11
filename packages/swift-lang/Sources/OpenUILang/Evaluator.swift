/// Supplies `$state` values and statement references to the evaluator.
public struct EvaluationContext {
  /// Reads a `$variable` from the store.
  public var getState: (String) -> OpenUIValue
  /// Resolves a reference to another declaration's value (Query/Mutation results).
  public var resolveRef: (String) -> OpenUIValue
  /// Extra scope for `$value` while applying a reactive assignment.
  public var extraScope: OpenUIObject?

  public init(
    getState: @escaping (String) -> OpenUIValue,
    resolveRef: @escaping (String) -> OpenUIValue = { _ in .undefined },
    extraScope: OpenUIObject? = nil
  ) {
    self.getState = getState
    self.resolveRef = resolveRef
    self.extraScope = extraScope
  }
}

/// Library knowledge the evaluator needs: which component props bind to
/// `$state` two-way (lang-core's `reactive()` schemas).
public struct SchemaContext {
  public var isReactiveProp: (_ component: String, _ prop: String) -> Bool

  public init(isReactiveProp: @escaping (String, String) -> Bool) {
    self.isReactiveProp = isReactiveProp
  }
}

/// Evaluates an AST node to a runtime value.
public func evaluate(
  _ node: ASTNode, _ context: EvaluationContext, _ schema: SchemaContext? = nil
) -> OpenUIValue {
  switch node {
  case .str(let value): return .string(value)
  case .num(let value): return .number(value)
  case .bool(let value): return .bool(value)
  case .null, .ph: return .null

  case .stateRef(let name):
    if let scoped = context.extraScope?[name], !scoped.isNullish { return scoped }
    return context.getState(name)

  case .ref(let name), .runtimeRef(let name, _):
    return context.resolveRef(name)

  case .arr(let elements):
    return .array(elements.map { evaluate($0, context) })

  case .obj(let entries):
    var object = OpenUIObject()
    for entry in entries { object[entry.key] = evaluate(entry.value, context) }
    return .object(object)

  case .comp(let name, let args, let mappedProps):
    if lazyBuiltins.contains(name) { return evaluateLazyBuiltin(name, args, context, schema) }
    if let builtin = builtins[name] { return builtin.fn(args.map { evaluate($0, context) }) }
    if actionNames.contains(name) { return evaluateActionCall(name, args, context) }
    if let mappedProps { return evaluateMappedComponent(name, mappedProps, context, schema) }
    // Every catalog component is lowered to an element at parse time, so an
    // unmapped call here is unexpected.
    return .null

  case .binOp(let op, let left, let right):
    return evaluateBinary(op, left, right, context)

  case .unaryOp(let op, let operand):
    switch op {
    case "!": return .bool(!evaluate(operand, context).isTruthy)
    case "-": return .number(-toNumber(evaluate(operand, context)))
    default: return .null
    }

  case .ternary(let cond, let then, let otherwise):
    return evaluate(cond, context).isTruthy ? evaluate(then, context) : evaluate(otherwise, context)

  case .member(let objNode, let field):
    let obj = evaluate(objNode, context)
    if obj.isNullish { return .null }
    // Array pluck: `rows.name` maps over the items.
    if case .array(let items) = obj {
      if field == "length" { return .number(Double(items.count)) }
      return .array(
        items.map { item in
          if item.isNullish { return .null }
          let value = jsProperty(item, field)
          return value.isNullish ? .null : value
        })
    }
    return jsProperty(obj, field)

  case .index(let objNode, let indexNode):
    let obj = evaluate(objNode, context)
    let index = evaluate(indexNode, context)
    if obj.isNullish || index.isNullish { return .null }
    if case .array = obj { return jsProperty(obj, jsNumberToString(toNumber(index))) }
    return jsProperty(obj, index.jsString)

  case .assign(let target, let value):
    return .reactiveAssign(ReactiveAssign(target: target, expr: value))
  }
}

private func evaluateBinary(
  _ op: String, _ leftNode: ASTNode, _ rightNode: ASTNode, _ context: EvaluationContext
) -> OpenUIValue {
  // Short-circuit operators return an operand, like JavaScript.
  if op == "&&" {
    let left = evaluate(leftNode, context)
    return left.isTruthy ? evaluate(rightNode, context) : left
  }
  if op == "||" {
    let left = evaluate(leftNode, context)
    return left.isTruthy ? left : evaluate(rightNode, context)
  }
  let left = evaluate(leftNode, context)
  let right = evaluate(rightNode, context)
  switch op {
  case "+":
    if left.jsTypeof == "string" || right.jsTypeof == "string" {
      // null/undefined concatenate as "" rather than "null".
      let l = left.isNullish ? "" : left.jsString
      let r = right.isNullish ? "" : right.jsString
      return .string(l + r)
    }
    return .number(toNumber(left) + toNumber(right))
  case "-": return .number(toNumber(left) - toNumber(right))
  case "*": return .number(toNumber(left) * toNumber(right))
  case "/":
    // Division by zero is 0, a deliberate DSL choice over Infinity/NaN.
    return .number(toNumber(right) == 0 ? 0 : toNumber(left) / toNumber(right))
  case "%":
    return .number(
      toNumber(right) == 0 ? 0 : toNumber(left).truncatingRemainder(dividingBy: toNumber(right)))
  case "==": return .bool(left.looselyEquals(right))
  case "!=": return .bool(!left.looselyEquals(right))
  case ">": return .bool(toNumber(left) > toNumber(right))
  case "<": return .bool(toNumber(left) < toNumber(right))
  case ">=": return .bool(toNumber(left) >= toNumber(right))
  case "<=": return .bool(toNumber(left) <= toNumber(right))
  default: return .null
  }
}

/// A catalog component inside a runtime expression (a ternary branch, an
/// `@Each` template): builds its element from the mapped props.
private func evaluateMappedComponent(
  _ name: String, _ mappedProps: [ASTEntry], _ context: EvaluationContext,
  _ schema: SchemaContext?
) -> OpenUIValue {
  var props = OpenUIObject()
  for entry in mappedProps {
    if case .stateRef(let stateName) = entry.value {
      if let schema, schema.isReactiveProp(name, entry.key) {
        // Reactive prop bound to $state: emit a two-way binding.
        props[entry.key] = .reactiveAssign(
          ReactiveAssign(target: stateName, expr: .stateRef("$value")))
      } else {
        // Without schema context the StateRef stays AST for evaluateElementProps.
        props[entry.key] = schema != nil ? context.getState(stateName) : .ast(entry.value)
      }
    } else {
      props[entry.key] = evaluate(entry.value, context, schema)
    }
  }
  if let schema {
    for (key, value) in props {
      switch value {
      case .element(let element):
        props[key] = .element(evaluateElementInline(element, context, schema))
      case .array(let items):
        props[key] = .array(
          items.map { item in
            if case .element(let element) = item {
              return .element(evaluateElementInline(element, context, schema))
            }
            return item
          })
      default:
        break
      }
    }
  }
  return .element(ElementNode(typeName: name, props: props, partial: false, hasDynamicProps: true))
}

/// Resolves a reactive assignment to the current state value outside a reactive prop.
public func stripReactiveAssign(_ value: OpenUIValue, _ context: EvaluationContext) -> OpenUIValue {
  guard case .reactiveAssign(let assign) = value else { return value }
  let current = context.getState(assign.target)
  return current.isNullish ? .null : current
}

/// Evaluates an element's props with schema awareness (inline path).
func evaluateElementInline(
  _ element: ElementNode, _ context: EvaluationContext, _ schema: SchemaContext
) -> ElementNode {
  if element.hasDynamicProps == false { return element }
  var evaluated = OpenUIObject()
  for (key, value) in element.props {
    evaluated[key] = evaluatePropInline(
      value, context, schema, reactive: schema.isReactiveProp(element.typeName, key))
  }
  var result = element
  result.props = evaluated
  return result
}

private func evaluatePropInline(
  _ value: OpenUIValue, _ context: EvaluationContext, _ schema: SchemaContext, reactive: Bool
) -> OpenUIValue {
  evaluatePropCore(
    value, context, schema, reactive: reactive,
    recurseElement: { evaluateElementInline($0, context, schema) },
    recurse: { evaluatePropInline($0, context, schema, reactive: $1) })
}

/// Converts a runtime value back to a literal AST node so it can be captured in
/// a deferred expression (an action evaluated at click time).
func toLiteralAST(_ value: OpenUIValue) -> ASTNode {
  switch value {
  case .undefined, .null: return .null
  case .string(let string): return .str(string)
  case .number(let number): return .num(number)
  case .bool(let bool): return .bool(bool)
  case .array(let items): return .arr(items.map(toLiteralAST))
  case .object(let object):
    return .obj(object.entries.map { ASTEntry($0.key, toLiteralAST($0.value)) })
  default:
    // Elements, AST and action markers are plain objects in JavaScript.
    return toLiteralAST(value.jsonRepresentation)
  }
}

/// `Action`, `Run`, `ToAssistant`, `OpenUrl`, `Set` and `Reset` calls.
private func evaluateActionCall(_ name: String, _ args: [ASTNode], _ context: EvaluationContext)
  -> OpenUIValue
{
  func stringArg(_ index: Int) -> String {
    let value = evaluate(args[index], context)
    return value.isNullish ? "" : value.jsString
  }
  switch name {
  case "Action":
    let stepsValue = args.isEmpty ? .array([]) : evaluate(args[0], context)
    let steps: [ActionStep] = (stepsValue.arrayValue ?? []).compactMap {
      if case .actionStep(let step) = $0 { return step }
      return nil
    }
    return .actionPlan(ActionPlan(steps: steps))
  case "Run":
    // An unresolved ref yields null, which Action drops.
    guard case .runtimeRef(let statementId, let refType)? = args.first else { return .null }
    return .actionStep(.run(statementId: statementId, refType: refType))
  case "ToAssistant":
    return .actionStep(
      .continueConversation(
        message: args.isEmpty ? "" : stringArg(0), context: args.count > 1 ? stringArg(1) : nil))
  case "OpenUrl":
    return .actionStep(.openUrl(url: args.isEmpty ? "" : stringArg(0)))
  case "Set":
    // The value expression is kept as AST and evaluated when the action fires.
    guard args.count >= 2, case .stateRef(let target) = args[0] else { return .null }
    return .actionStep(.set(target: target, valueAST: args[1]))
  case "Reset":
    let targets = args.compactMap { arg -> String? in
      if case .stateRef(let name) = arg { return name }
      return nil
    }
    return targets.isEmpty ? .null : .actionStep(.reset(targets: targets))
  default:
    return .null
  }
}

/// Replaces `Ref(varName)` with the loop item's literal value, so deferred
/// expressions (action steps) keep the item after the loop has finished.
func substituteRef(_ node: ASTNode, _ varName: String, _ value: OpenUIValue) -> ASTNode {
  switch node {
  case .ref(let name):
    return name == varName ? toLiteralAST(value) : node
  case .member(let obj, let field):
    let substituted = substituteRef(obj, varName, value)
    // `t.id` on a now-literal object resolves immediately.
    if case .obj(let entries) = substituted, let entry = entries.first(where: { $0.key == field }) {
      return entry.value
    }
    return .member(obj: substituted, field: field)
  case .index(let obj, let index):
    return .index(
      obj: substituteRef(obj, varName, value), index: substituteRef(index, varName, value))
  case .binOp(let op, let left, let right):
    return .binOp(
      op: op, left: substituteRef(left, varName, value), right: substituteRef(right, varName, value)
    )
  case .unaryOp(let op, let operand):
    return .unaryOp(op: op, operand: substituteRef(operand, varName, value))
  case .ternary(let cond, let then, let otherwise):
    return .ternary(
      cond: substituteRef(cond, varName, value), then: substituteRef(then, varName, value),
      else: substituteRef(otherwise, varName, value))
  case .arr(let elements):
    return .arr(elements.map { substituteRef($0, varName, value) })
  case .obj(let entries):
    return .obj(entries.map { ASTEntry($0.key, substituteRef($0.value, varName, value)) })
  case .comp(let name, let args, let mappedProps):
    return .comp(
      name: name, args: args.map { substituteRef($0, varName, value) },
      mappedProps: mappedProps?.map { ASTEntry($0.key, substituteRef($0.value, varName, value)) })
  case .assign(let target, let assigned):
    return .assign(target: target, value: substituteRef(assigned, varName, value))
  default:
    return node
  }
}

/// `@Each(array, varName, template)`: evaluates the template once per item.
private func evaluateLazyBuiltin(
  _ name: String, _ args: [ASTNode], _ context: EvaluationContext, _ schema: SchemaContext?
) -> OpenUIValue {
  guard name == "Each" else { return .null }
  guard args.count >= 3, case .array(let items) = evaluate(args[0], context) else {
    return .array([])
  }
  let varName: String
  switch args[1] {
  case .ref(let n): varName = n
  case .str(let v): varName = v
  default: return .array([])
  }
  let template = args[2]
  return .array(
    items.map { item in
      let substituted = substituteRef(template, varName, item)
      var childContext = context
      childContext.resolveRef = { refName in
        refName == varName ? item : context.resolveRef(refName)
      }
      let result = evaluate(substituted, childContext, schema)
      if let schema, case .element(let element) = result {
        return .element(evaluateElementInline(element, childContext, schema))
      }
      return result
    })
}
