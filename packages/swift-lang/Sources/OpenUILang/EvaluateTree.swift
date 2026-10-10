/// Evaluates one prop value with schema awareness: AST nodes, reactive
/// bindings, nested elements, arrays and action plans. The inline and tree
/// paths differ only in how they recurse, so they pass that in.
func evaluatePropCore(
  _ value: OpenUIValue, _ context: EvaluationContext, _ schema: SchemaContext, reactive: Bool,
  recurseElement: (ElementNode) -> ElementNode,
  recurse: (OpenUIValue, Bool) -> OpenUIValue
) -> OpenUIValue {
  switch value {
  case .undefined, .null, .bool, .number, .string:
    return value

  case .ast(let node):
    // A $state on a reactive prop becomes a two-way binding.
    if case .stateRef(let name) = node, reactive {
      return .reactiveAssign(ReactiveAssign(target: name, expr: .stateRef("$value")))
    }
    let result = evaluate(node, context, schema)
    switch result {
    case .element(let element):
      return .element(recurseElement(element))
    case .array(let items):
      return .array(
        items.map { item in
          if case .element(let element) = item { return .element(recurseElement(element)) }
          return item
        })
    case .reactiveAssign(let assign) where !reactive:
      let current = context.getState(assign.target)
      return current.isNullish ? .null : current
    default:
      return result
    }

  case .array(let items):
    return .array(items.map { recurse($0, reactive) })

  case .element(let element):
    return .element(recurseElement(element))

  case .actionPlan, .actionStep, .reactiveAssign:
    // Evaluated when the action fires or the field is set, not now.
    return value

  case .object(let object):
    let needsEval = object.values.contains { member in
      switch member {
      case .undefined, .null, .bool, .number, .string: return false
      default: return true
      }
    }
    guard needsEval else { return value }
    var result = OpenUIObject()
    for (key, member) in object { result[key] = recurse(member, reactive) }
    return .object(result)
  }
}

/// Evaluates every AST node in an element's props (recursively), returning an
/// element whose props are concrete values ready to render.
public func evaluateElementProps(
  _ element: ElementNode, _ context: EvaluationContext, _ schema: SchemaContext
) -> ElementNode {
  if element.hasDynamicProps == false { return element }
  var evaluated = OpenUIObject()
  for (key, value) in element.props {
    evaluated[key] = evaluatePropValue(
      value, context, schema, reactive: schema.isReactiveProp(element.typeName, key))
  }
  var result = element
  result.props = evaluated
  return result
}

private func evaluatePropValue(
  _ value: OpenUIValue, _ context: EvaluationContext, _ schema: SchemaContext, reactive: Bool
) -> OpenUIValue {
  evaluatePropCore(
    value, context, schema, reactive: reactive,
    recurseElement: { evaluateElementProps($0, context, schema) },
    recurse: { evaluatePropValue($0, context, schema, reactive: $1) })
}
