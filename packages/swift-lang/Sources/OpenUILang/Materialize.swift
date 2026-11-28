/// Whether a prop value still holds AST that needs runtime evaluation.
func containsDynamicValue(_ value: OpenUIValue) -> Bool {
  switch value {
  case .ast, .reactiveAssign: return true
  case .array(let items): return items.contains(where: containsDynamicValue)
  case .element(let element): return element.props.values.contains(where: containsDynamicValue)
  case .object(let object): return object.values.contains(where: containsDynamicValue)
  case .actionPlan(let plan):
    return plan.steps.contains { if case .set = $0 { true } else { false } }
  case .actionStep(.set): return true
  default: return false
  }
}

private enum RefResolution {
  case unresolved
  case runtimeRef(ASTNode)
  case target(ASTNode)
}

/// Shared ref handling: cycle and missing-symbol detection, and Query/Mutation
/// declarations becoming `RuntimeRef`s.
private func lookupRef(_ name: String, _ ctx: MaterializeContext) -> RefResolution {
  guard !ctx.visited.contains(name), let target = ctx.syms[name] else {
    ctx.unres.append(name)
    return .unresolved
  }
  ctx.markReached(name)
  if case .comp(let callee, _, _) = target, isReservedCall(callee) {
    let refType: RuntimeRefType = callee == ReservedCall.mutation ? .mutation : .query
    return .runtimeRef(.runtimeRef(name, refType: refType))
  }
  return .target(target)
}

private func withStatement<T>(_ name: String, _ ctx: MaterializeContext, _ body: () -> T) -> T {
  ctx.visited.insert(name)
  let previous = ctx.currentStatementId
  ctx.currentStatementId = name
  defer {
    ctx.currentStatementId = previous
    ctx.visited.remove(name)
  }
  return body()
}

private func resolveRefValue(_ name: String, _ ctx: MaterializeContext) -> OpenUIValue {
  switch lookupRef(name, ctx) {
  case .unresolved: return .null
  case .runtimeRef(let node): return .ast(node)
  case .target(let target):
    return withStatement(name, ctx) {
      var result = materializeValue(target, ctx)
      if case .element(var element) = result {
        element.statementId = name
        result = .element(element)
      }
      return result
    }
  }
}

private func resolveRefExpr(_ name: String, _ ctx: MaterializeContext) -> ASTNode {
  switch lookupRef(name, ctx) {
  case .unresolved: return .ph(name)
  case .runtimeRef(let node): return node
  case .target(let target): return withStatement(name, ctx) { materializeExpr(target, ctx) }
  }
}

/// For a lazy builtin such as `Each(arr, varName, template)`, scopes the loop
/// variable so template refs to it are left alone. `nil` when not applicable.
private func materializeLazyBuiltin(
  _ name: String, _ args: [ASTNode], _ mappedProps: [ASTEntry]?, _ ctx: MaterializeContext,
  _ scopedRefs: Set<String>
) -> ASTNode? {
  guard lazyBuiltins.contains(name), args.count >= 3 else { return nil }
  let varName: String
  switch args[1] {
  case .ref(let n): varName = n
  case .str(let v): varName = v
  default: return nil
  }
  var nextScoped = scopedRefs
  nextScoped.insert(varName)
  let recursed = args.enumerated().map { index, arg in
    index == 1 ? arg : materializeExprInternal(arg, ctx, nextScoped)
  }
  return .comp(name: name, args: recursed, mappedProps: mappedProps)
}

private func materializeExprInternal(
  _ node: ASTNode, _ ctx: MaterializeContext, _ scopedRefs: Set<String>
) -> ASTNode {
  switch node {
  case .ref(let name):
    return scopedRefs.contains(name) ? node : resolveRefExpr(name, ctx)
  case .ph:
    return node
  case .comp(let name, let args, let mappedProps):
    if let lazy = materializeLazyBuiltin(name, args, mappedProps, ctx, scopedRefs) { return lazy }
    let recursed = args.map { materializeExprInternal($0, ctx, scopedRefs) }
    if isBuiltin(name) || isReservedCall(name) {
      return .comp(name: name, args: recursed, mappedProps: mappedProps)
    }
    if let params = ctx.cat?[name] {
      // Catalog component: mapped props let the evaluator build an element.
      let mapped = zip(params, recursed).map { ASTEntry($0.name, $1) }
      return .comp(name: name, args: recursed, mappedProps: mapped)
    }
    pushValidationIssue(ctx, name, "", .unknownComponent(available: ctx.cat?.componentNames))
    return .comp(name: name, args: recursed, mappedProps: mappedProps)
  case .arr(let elements):
    return .arr(elements.map { materializeExprInternal($0, ctx, scopedRefs) })
  case .obj(let entries):
    return .obj(
      entries.map { ASTEntry($0.key, materializeExprInternal($0.value, ctx, scopedRefs)) })
  case .binOp(let op, let left, let right):
    return .binOp(
      op: op, left: materializeExprInternal(left, ctx, scopedRefs),
      right: materializeExprInternal(right, ctx, scopedRefs))
  case .unaryOp(let op, let operand):
    return .unaryOp(op: op, operand: materializeExprInternal(operand, ctx, scopedRefs))
  case .ternary(let cond, let then, let otherwise):
    return .ternary(
      cond: materializeExprInternal(cond, ctx, scopedRefs),
      then: materializeExprInternal(then, ctx, scopedRefs),
      else: materializeExprInternal(otherwise, ctx, scopedRefs))
  case .member(let obj, let field):
    return .member(obj: materializeExprInternal(obj, ctx, scopedRefs), field: field)
  case .index(let obj, let index):
    return .index(
      obj: materializeExprInternal(obj, ctx, scopedRefs),
      index: materializeExprInternal(index, ctx, scopedRefs))
  case .assign(let target, let value):
    return .assign(target: target, value: materializeExprInternal(value, ctx, scopedRefs))
  default:
    // Literals, StateRef and RuntimeRef pass through unchanged.
    return node
  }
}

/// Normalizes an AST node for use inside a runtime expression: resolves refs and
/// adds `mappedProps` to catalog components. The structure stays AST.
func materializeExpr(_ node: ASTNode, _ ctx: MaterializeContext) -> ASTNode {
  materializeExprInternal(node, ctx, [])
}

/// Schema-aware lowering in one pass: resolves refs, maps positional arguments
/// to named props, validates required props, applies defaults, turns literals
/// into plain values and keeps runtime expressions as AST.
///
/// Returns an element for catalog components, AST for builtins and runtime
/// expressions, plain values for literals and collections, and `null` for
/// placeholders and dropped components.
func materializeValue(_ node: ASTNode, _ ctx: MaterializeContext) -> OpenUIValue {
  switch node {
  case .ref(let name):
    return resolveRefValue(name, ctx)
  case .str(let value):
    return .string(value)
  case .num(let value):
    return .number(value)
  case .bool(let value):
    return .bool(value)
  case .null, .ph:
    return .null
  case .arr(let elements):
    var items: [OpenUIValue] = []
    for element in elements {
      // Unresolved placeholders are dropped from arrays, and so are components
      // or refs that resolved to null (incomplete, unresolved or unknown).
      if case .ph = element { continue }
      let value = materializeValue(element, ctx)
      if value == .null {
        switch element {
        case .comp, .ref: continue
        default: break
        }
      }
      items.append(value)
    }
    return .array(items)
  case .obj(let entries):
    var object = OpenUIObject()
    for entry in entries { object[entry.key] = materializeValue(entry.value, ctx) }
    return .object(object)
  case .comp(let name, let args, let mappedProps):
    return materializeComponent(name, args, mappedProps, ctx)
  default:
    return node.isRuntimeExpr ? .ast(materializeExpr(node, ctx)) : .ast(node)
  }
}

private func materializeComponent(
  _ name: String, _ args: [ASTNode], _ mappedProps: [ASTEntry]?, _ ctx: MaterializeContext
) -> OpenUIValue {
  // Builtins (Sum, Count, Action, ...) stay AST for the runtime.
  if isBuiltin(name) {
    if let lazy = materializeLazyBuiltin(name, args, mappedProps, ctx, []) { return .ast(lazy) }
    return .ast(
      .comp(name: name, args: args.map { materializeExpr($0, ctx) }, mappedProps: mappedProps))
  }
  // Query/Mutation are only valid as top-level statements.
  if isReservedCall(name) {
    pushValidationIssue(ctx, name, "", .inlineReserved)
    return .null
  }
  guard let params = ctx.cat?[name] else {
    pushValidationIssue(ctx, name, "", .unknownComponent(available: ctx.cat?.componentNames))
    return .null
  }

  var props = OpenUIObject()
  // Set when a required prop holds invalid data with no default to fall back on.
  var dropComponent = false
  for (param, arg) in zip(params, args) {
    var value = materializeValue(arg, ctx)
    let invalid =
      param.schema != nil
      && validateSchemaValue(&value, param.schema, name, "/\(param.name)", ctx)
    props[param.name] = value
    if invalid,
      resolveInvalidValue(
        &props, param.name, required: param.required, defaultValue: param.defaultValue)
    {
      dropComponent = true
    }
  }

  // Extra positional arguments are dropped.
  if args.count > params.count {
    pushValidationIssue(ctx, name, "", .excessArgs(declared: params.count, got: args.count))
  }

  // Required props: fall back to the schema default before dropping the component.
  let missingRequired = params.filter { param in
    param.required && (!props.contains(param.name) || props[param.name] == .null)
  }
  if !missingRequired.isEmpty {
    let stillInvalid = missingRequired.filter { param in
      if let defaultValue = param.defaultValue {
        props[param.name] = defaultValue
        return false
      }
      return true
    }
    if !stillInvalid.isEmpty {
      let signature = buildParamsSignature(name, params)
      for param in stillInvalid {
        pushValidationIssue(
          ctx, name, "/\(param.name)",
          props.contains(param.name)
            ? .nullRequired(signature: signature) : .missingRequired(signature: signature))
      }
      return .null
    }
  }

  if dropComponent { return .null }

  let hasDynamicProps = props.values.contains(where: containsDynamicValue)
  return .element(
    ElementNode(
      typeName: name, props: props, partial: ctx.partial, hasDynamicProps: hasDynamicProps))
}
