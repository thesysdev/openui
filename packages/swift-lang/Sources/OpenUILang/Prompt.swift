/// A tool the model can call through `Query()` / `Mutation()`. Shaped like an
/// MCP tool (name, description, input and output JSON Schemas).
public struct ToolSpec: Sendable, Equatable {
  public var name: String
  public var description: String?
  public var inputSchema: OpenUIValue
  public var outputSchema: OpenUIValue

  public init(
    name: String, description: String? = nil, inputSchema: OpenUIValue = [:],
    outputSchema: OpenUIValue = .undefined
  ) {
    self.name = name
    self.description = description
    self.inputSchema = inputSchema
    self.outputSchema = outputSchema
  }
}

/// A tool listed in the prompt: a bare name or a full spec.
public enum ToolDescriptor: Sendable, Equatable {
  case name(String)
  case spec(ToolSpec)
}

/// A component's prompt entry: its signature and description.
public struct ComponentPromptSpec: Sendable, Equatable {
  public var signature: String
  public var description: String?

  public init(signature: String, description: String? = nil) {
    self.signature = signature
    self.description = description
  }
}

/// A named group of components in the prompt, with optional notes.
public struct ComponentGroup: Sendable, Equatable {
  public var name: String
  public var components: [String]
  public var notes: [String]?

  public init(name: String, components: [String], notes: [String]? = nil) {
    self.name = name
    self.components = components
    self.notes = notes
  }
}

/// Options that shape the generated system prompt.
public struct PromptOptions: Sendable, Equatable {
  public var preamble: String?
  public var additionalRules: [String]?
  public var examples: [String]?
  public var toolExamples: [String]?
  public var tools: [ToolDescriptor]?
  public var editMode: Bool?
  public var inlineMode: Bool?
  /// Enables Query(), Mutation(), @Run. Defaults to true when tools are given.
  public var toolCalls: Bool?
  /// Enables $variables, @Set, @Reset. Defaults to `toolCalls`.
  public var bindings: Bool?

  public init(
    preamble: String? = nil, additionalRules: [String]? = nil, examples: [String]? = nil,
    toolExamples: [String]? = nil, tools: [ToolDescriptor]? = nil, editMode: Bool? = nil,
    inlineMode: Bool? = nil, toolCalls: Bool? = nil, bindings: Bool? = nil
  ) {
    self.preamble = preamble
    self.additionalRules = additionalRules
    self.examples = examples
    self.toolExamples = toolExamples
    self.tools = tools
    self.editMode = editMode
    self.inlineMode = inlineMode
    self.toolCalls = toolCalls
    self.bindings = bindings
  }
}

/// Everything prompt generation needs: the library's component signatures and the options.
public struct PromptSpec: Sendable, Equatable {
  public var root: String?
  /// Component entries in library order.
  public var components: [(name: String, spec: ComponentPromptSpec)]
  public var componentGroups: [ComponentGroup]?
  public var options: PromptOptions

  public init(
    root: String?, components: [(name: String, spec: ComponentPromptSpec)],
    componentGroups: [ComponentGroup]? = nil, options: PromptOptions = PromptOptions()
  ) {
    self.root = root
    self.components = components
    self.componentGroups = componentGroups
    self.options = options
  }

  public static func == (lhs: PromptSpec, rhs: PromptSpec) -> Bool {
    lhs.root == rhs.root && lhs.components.map(\.name) == rhs.components.map(\.name)
      && lhs.components.map(\.spec) == rhs.components.map(\.spec)
      && lhs.componentGroups == rhs.componentGroups && lhs.options == rhs.options
  }
}

// MARK: - JSON Schema helpers

private func jsonSchemaTypeString(_ schema: OpenUIValue) -> String {
  switch schema["type"].stringValue {
  case "string":
    if let values = schema["enum"].arrayValue {
      return values.map { "\"\($0.jsString)\"" }.joined(separator: " | ")
    }
    return "string"
  case "number", "integer":
    return "number"
  case "boolean":
    return "boolean"
  case "array":
    if case .object = schema["items"] { return "\(jsonSchemaTypeString(schema["items"]))[]" }
    return "any[]"
  case "object":
    if let props = schema["properties"].objectValue, !props.isEmpty {
      let required = (schema["required"].arrayValue ?? []).compactMap(\.stringValue)
      let fields = props.entries.map { key, value in
        "\(key)\(required.contains(key) ? "" : "?"): \(jsonSchemaTypeString(value))"
      }
      return "{\(fields.joined(separator: ", "))}"
    }
    return "object"
  default:
    return "any"
  }
}

/// A placeholder value shaped like an output schema, for Query defaults hints.
private func defaultForSchema(_ schema: OpenUIValue) -> OpenUIValue {
  switch schema["type"].stringValue {
  case "string": return ""
  case "number", "integer": return 0
  case "boolean": return false
  case "array": return []
  case "object":
    guard let props = schema["properties"].objectValue, !props.isEmpty else { return [:] }
    return .object(OpenUIObject(props.entries.map { ($0.key, defaultForSchema($0.value)) }))
  default: return .null
  }
}

// MARK: - Sections

private let defaultPreamble =
  "You are an AI assistant that responds using openui-lang, a declarative UI language. Your ENTIRE response must be valid openui-lang code — no markdown, no explanations, just openui-lang."

private func syntaxRules(_ rootName: String, supportsExpressions: Bool, bindings: Bool) -> String {
  var lines = [
    "## Syntax Rules",
    "",
    "1. Each statement is on its own line: `identifier = Expression`",
    "2. `root` is the entry point — every program must define `root = \(rootName)(...)`",
    "3. Expressions are: strings (\"...\"), numbers, booleans (true/false), null, arrays ([...]), objects ({...}), or component calls TypeName(arg1, arg2, ...)",
    "4. Use references for readability: define `name = ...` on one line, then use `name` later",
    "5. EVERY variable (except root) MUST be referenced by at least one other variable. Unreferenced variables are silently dropped and will NOT render. Always include defined variables in their parent's children/items array.",
    "6. Arguments are POSITIONAL (order matters, not names). Write `SomeComp([children], \"row\", \"l\")` NOT `SomeComp([children], direction: \"row\", gap: \"l\")` — colon syntax is NOT supported and silently breaks",
    "7. Optional arguments can be omitted from the end",
  ]
  var ruleNumber = 8
  func rule(_ text: String) {
    lines.append("\(ruleNumber). \(text)")
    ruleNumber += 1
  }
  if bindings {
    rule(
      "Declare mutable state with `$varName = defaultValue`. Components marked with `$binding` can read/write these. Undeclared $variables are auto-created with null default."
    )
  }
  if supportsExpressions {
    rule("String concatenation: `\"text\" + $var + \"more\"`")
    rule(
      "Dot member access: `query.field` reads a field; on arrays it extracts that field from every element"
    )
    rule("Index access: `arr[0]`, `data[index]`")
    rule(
      "Arithmetic operators: +, -, *, /, % (work on numbers; + is string concat when either side is a string)"
    )
    rule("Comparison: ==, !=, >, <, >=, <=")
    rule("Logical: &&, ||, ! (prefix)")
    rule("Ternary: `condition ? valueIfTrue : valueIfFalse`")
    rule("Parentheses for grouping: `(a + b) * c`")
  }
  lines.append("- Strings use double quotes with backslash escaping")
  return lines.joined(separator: "\n")
}

private func builtinFunctionsSection() -> String {
  let builtinLines = builtinOrder.compactMap { builtins[$0] }.map {
    "@\($0.signature) — \($0.description)"
  }
  let lazyLines = lazyBuiltinDefs.keys.sorted().map {
    "@\(lazyBuiltinDefs[$0]!.signature) — \(lazyBuiltinDefs[$0]!.description)"
  }
  let lines = (builtinLines + lazyLines).joined(separator: "\n")
  return """
    ## Built-in Functions

    Data functions prefixed with `@` to distinguish from components. These are the ONLY functions available — do NOT invent new ones.
    Use @-prefixed built-in functions (@Count, @Sum, @Avg, @Min, @Max, @Round) on Query results — do NOT hardcode computed values.

    \(lines)

    Builtins compose — output of one is input to the next:
    `@Count(@Filter(data.rows, "field", "==", "val"))` for KPIs/chart values, `@Round(@Avg(data.rows.score), 1)`, `@Each(data.rows, "item", Comp(item.field))` for per-item rendering.
    Array pluck: `data.rows.field` extracts a field from every row → use with @Sum, @Avg, charts, tables.

    IMPORTANT @Each rule: The loop variable (e.g. "item") is ONLY available inside the @Each template expression. Always inline the template — do NOT extract it to a separate statement.
    CORRECT: `Col("Actions", @Each(rows, "t", Button("Edit", Action([@Set($id, t.id)]))))`
    WRONG: `myBtn = Button("Edit", Action([@Set($id, t.id)]))` then `Col("Actions", @Each(rows, "t", myBtn))` — t is undefined in myBtn.
    """
}

private let querySection = """
  ## Query — Live Data Fetching

  Fetch data from available tools. Returns defaults instantly, swaps in real data when it arrives.

  ```
  metrics = Query("tool_name", {arg1: value, arg2: $binding}, {defaultField: 0, defaultData: []}, refreshInterval?)
  ```

  - First arg: tool name (string)
  - Second arg: arguments object (may reference $bindings — re-fetches automatically on change)
  - Third arg: default data (rendered immediately before fetch resolves)
  - Fourth arg (optional): refresh interval in seconds (e.g. 30 for auto-refresh every 30s)
  - Use dot access on results: metrics.totalEvents, metrics.data.day (array pluck)
  - Query results must use regular identifiers: `metrics = Query(...)`, NOT `$metrics = Query(...)`
  - Manual refresh: `Button("Refresh", Action([@Run(query1), @Run(query2)]), "secondary")` — re-fetches the listed queries
  - Refresh all queries: create Action with @Run for each query
  """

private let mutationSection = """
  ## Mutation — Write Operations

  Execute state-changing tool calls (create, update, delete). Unlike Query (auto-fetches on render), Mutation fires only on button click via Action.

  ```
  result = Mutation("tool_name", {arg1: $binding, arg2: "value"})
  ```

  - First arg: tool name (string)
  - Second arg: arguments object (evaluated with current $binding values at click time)
  - result.status: "idle" | "loading" | "success" | "error"
  - result.data: tool response on success
  - result.error: error message on failure
  - Mutation results use regular identifiers: `result = Mutation(...)`, NOT `$result`
  - Show loading state: `result.status == "loading" ? TextContent("Saving...") : null`
  """

private func actionSection(toolCalls: Bool, bindings: Bool) -> String {
  var steps = [
    "- @ToAssistant(\"message\") — Send a message to the assistant (for conversational buttons like \"Tell me more\", \"Explain this\")",
    "- @OpenUrl(\"https://...\") — Navigate to a URL",
  ]
  if bindings {
    steps.append("- @Set($variable, value) — Set a $variable to a specific value")
    steps.append(
      "- @Reset($var1, $var2, ...) — Reset $variables to their declared defaults (e.g. @Reset($title, $priority) restores $title=\"\" and $priority=\"medium\")"
    )
  }
  if toolCalls {
    steps.insert(
      "- @Run(queryOrMutationRef) — Execute a Mutation or re-fetch a Query (ref must be a declared Query/Mutation)",
      at: 0)
  }

  var examples: [String] = []
  if toolCalls {
    examples.append(
      """
      Example — mutation + refresh + reset (PREFERRED pattern):
      ```
      $binding = "default"
      result = Mutation("tool_name", {field: $binding})
      data = Query("tool_name", {}, {rows: []})
      onSubmit = Action([@Run(result), @Run(data), @Reset($binding)])
      ```
      """)
  }
  examples.append(
    """
    Example — simple nav:
    ```
    viewBtn = Button("View", Action([@OpenUrl("https://example.com")]))
    ```
    """)

  var rules = [
    "- Action can be assigned to a variable or inlined: Button(\"Go\", onSubmit) and Button(\"Go\", Action([...])) both work"
  ]
  if toolCalls {
    rules.append("- If a @Run(mutation) step fails, remaining steps are skipped (halt on failure)")
    rules.append("- @Run(queryRef) re-fetches the query (fire-and-forget, cannot fail)")
  }

  return """
    ## Action — Button Behavior

    Action([@steps...]) wires button clicks to operations. Steps are @-prefixed built-in actions. Steps execute in order.
    Buttons without an explicit Action prop automatically send their label to the assistant (equivalent to Action([@ToAssistant(label)])).

    Available steps:
    \(steps.joined(separator: "\n"))

    \(examples.joined(separator: "\n\n"))

    \(rules.joined(separator: "\n"))
    """
}

private let interactiveFiltersSection = """
  ## Interactive Filters

  To let the user filter data with a dropdown:
  1. Declare a $variable with a default: `$dateRange = "14"`
  2. Create a Select with name, items, and binding: `Select("dateRange", [SelectItem("7", "Last 7 days"), ...], null, null, $dateRange)`
  3. Wrap in FormControl for a label: `FormControl("Date Range", Select(...))`
  4. Pass $dateRange in Query args: `Query("tool", {dateRange: $dateRange}, {defaults})`
  5. When the user changes the Select, $dateRange updates and the Query automatically re-fetches

  FILTER WIRING RULE: If a $binding filter is visible in the UI, EVERY relevant Query MUST reference that $binding in its args. Never show a filter dropdown while hardcoding the query args.

  Rules for $variables:
  - $variables hold simple values (strings or numbers), NOT arrays or objects
  - $variables must be bound to a Select/Input component via the value argument (last positional arg) to be interactive
  - Queries must use regular identifiers (NOT $variables): `metrics = Query(...)` not `$metrics = Query(...)`
  - **Auto-declare**: You do NOT need to explicitly declare $variables. If you use `$foo` without declaring it, the parser auto-creates `$foo = null`. You can still declare explicitly to set a default: `$days = "14"`

  ## Forms

  Simple form — no $bindings needed. Field values are managed internally by the Form via the name prop:
  ```
  contactForm = Form("contact", submitBtn, [nameField, emailField])
  nameField = FormControl("Name", Input("name", "Your name", "text", {required: true}))
  emailField = FormControl("Email", Input("email", "your@email.com", "email", {required: true, email: true}))
  submitBtn = Button("Submit")
  ```

  Use $bindings when you need to read field values elsewhere (in Action context, Query args, or conditionals). They are auto-declared:
  ```
  $role = "engineer"
  contactForm = Form("contact", submitBtn, [nameField, emailField, roleField])
  nameField = FormControl("Name", Input("name", "Enter your name", "text", {required: true}, $name))
  emailField = FormControl("Email", Input("email", "Enter your email", "email", {required: true, email: true}, $email))
  roleField = FormControl("Role", Select("role", [SelectItem("engineer", "Engineer"), SelectItem("designer", "Designer"), SelectItem("pm", "PM")], null, {required: true}, $role))
  submitBtn = Button("Submit")
  ```

  For form + mutation patterns (create, refresh, reset), see the Action section example above.

  IMPORTANT: Always add validation rules to form fields used with Mutations. Use OBJECT syntax: {required: true, email: true, minLength: 8}. The renderer shows error messages automatically and blocks submit when validation fails.
  """

private let editModeSection = """
  ## Edit Mode

  The runtime merges by statement name: same name = replace, new name = append.
  Output ONLY statements that changed or are new. Everything else is kept automatically.

  ### Delete
  To remove a component, re-declare its parent without that component in the parent's children array. The removed component and any statements only it referenced are automatically garbage-collected.

  ### Patch size guide
  - Changing a title or label: 1 statement
  - Adding a component: 2-3 statements (the new component + parent update)
  - Removing a component: 1 statement (re-declare parent without the removed child)
  - Adding a filter + wiring to query: 3-5 statements
  - Restructuring into tabs: 5-10 statements

  ### Rules
  - Reuse existing statement names exactly — do not rename
  - Do NOT re-emit unchanged statements — the runtime keeps them
  - A typical edit patch is 1-10 statements, not 20+
  - If the existing code already satisfies the request, output only the root statement
  - NEVER output the entire program as a patch. Only output what actually changes
  - If you are about to output more than 10 statements, reconsider — most edits need fewer
  """

private func streamingRules(_ rootName: String, supportsExpressions: Bool) -> String {
  var steps = ["1. `root = \(rootName)(...)` — UI shell appears immediately"]
  if supportsExpressions {
    steps.append("2. $variable declarations — state ready for bindings")
    steps.append(
      "3. Query statements — defaults resolve immediately so components render with data")
    steps.append("4. Component definitions — fill in with data already available")
    steps.append("5. Data values — leaf content last")
  } else {
    steps.append("2. Component definitions — fill in as they stream")
    steps.append("3. Data values — leaf content last")
  }
  return """
    ## Hoisting & Streaming (CRITICAL)

    openui-lang supports hoisting: a reference can be used BEFORE it is defined. The parser resolves all references after the full input is parsed.

    During streaming, the output is re-parsed on every chunk. Undefined references are temporarily unresolved and appear once their definitions stream in. This creates a progressive top-down reveal — structure first, then data fills in.

    **Recommended statement order for optimal streaming:**
    \(steps.joined(separator: "\n"))

    Always write the root = \(rootName)(...) statement first so the UI shell appears immediately, even before child data has streamed in.
    """
}

private let inlineModeSection = """
  ## Inline Mode

  You are in inline mode. You can respond in two ways:

  ### 1. Code response (when the user wants to CREATE or CHANGE the UI)
  Wrap openui-lang code in triple-backtick fences. You can include explanatory text before/after:

  Here's your dashboard:

  ```openui-lang
  root = RootComp([header, content])
  header = SomeHeader("Title")
  content = SomeContent("Hello world")
  ```

  I created a simple layout with a header.

  ### 2. Text-only response (when the user asks a QUESTION)
  If the user asks "what is this?", "explain the chart", "how does this work", etc. — respond with plain text. Do NOT output any openui-lang code. The existing dashboard stays unchanged.

  ### Rules
  - When the user asks for changes, output ONLY the changed/new statements in a fenced block
  - When the user asks a question, respond with text only — NO code. The dashboard stays unchanged.
  - The parser extracts code from fences automatically. Text outside fences is shown as chat.
  """

private let toolWorkflowSection = """
  ## Data Workflow

  When tools are available, follow this workflow:
  1. FIRST: Call the most relevant tool to inspect the real data shape before generating code
  2. Use Query() for READ operations (data that should stay live) — NEVER hardcode tool results as literal arrays or objects
  3. Use Mutation() for WRITE operations (create, update, delete) — triggered by button clicks via Action([@Run(mutationRef)])
  4. Use the real data from step 1 as condensed Query defaults (3-5 rows) so the UI renders immediately
  5. Use @-prefixed builtins (@Count, @Filter, @Sort, @Sum) on Query results for KPIs and aggregations — the runtime evaluates these live on every refresh
  6. Hardcoded arrays are ONLY for static display data (labels, options) where no tool exists

  WRONG — you called a tool and got data back, but you inlined the results:
  ```
  openCount = 2
  item1 = SomeComp("first item title")
  item2 = SomeComp("second item title")
  list = SomeList([item1, item2])
  chart = SomeChart(["A", "B"], [12, 8])
  ```
  This is static — it shows stale data and won't update. Creating item1, item2, item3... manually is ALWAYS wrong when a tool exists.

  RIGHT — use Query() for live data, Mutation() for writes, @builtins to derive values:
  ```
  data = Query("tool_name", {}, {rows: []})
  openCount = @Count(@Filter(data.rows, "field", "==", "value"))
  list = @Each(data.rows, "item", SomeComp(item.title, item.field))
  createResult = Mutation("create_tool", {title: $title})
  submitBtn = Button("Create", Action([@Run(createResult), @Run(data), @Reset($title)]))
  ```
  Everything derives from the Query — when data refreshes, the entire dashboard updates automatically.
  """

private func importantRules(_ rootName: String, toolCalls: Bool, bindings: Bool) -> String {
  var verify = [
    "1. root = \(rootName)(...) is the FIRST line (for optimal streaming).",
    "2. Every referenced name is defined. Every defined name (other than root) is reachable from root.",
  ]
  if toolCalls { verify.append("3. Every Query result is referenced by at least one component.") }
  if bindings {
    verify.append(
      "\(toolCalls ? "4" : "3"). Every $binding appears in at least one component or expression.")
  }
  if toolCalls && bindings {
    verify.append("5. Every visible filter $binding appears in at least one Query args object.")
  }
  return """
    ## Important Rules
    - Choose components that best represent the content (tables for comparisons, charts for trends, forms for input, etc.)

    ## Final Verification
    Before finishing, walk your output and verify:
    \(verify.joined(separator: "\n"))
    """
}

// MARK: - Tools

private func renderToolSignature(_ tool: ToolSpec) -> String {
  var args = ""
  if let props = tool.inputSchema["properties"].objectValue, !props.isEmpty {
    let required = (tool.inputSchema["required"].arrayValue ?? []).compactMap(\.stringValue)
    args = props.entries.map { key, value in
      "\(key)\(required.contains(key) ? "" : "?"): \(jsonSchemaTypeString(value))"
    }.joined(separator: ", ")
  }
  let returnType = tool.outputSchema.isTruthy ? " → \(jsonSchemaTypeString(tool.outputSchema))" : ""
  var line = "- \(tool.name)(\(args))\(returnType)"
  if let description = tool.description, !description.isEmpty { line += "\n  \(description)" }
  return line
}

private func renderToolsSection(_ tools: [ToolDescriptor]) -> String {
  var lines = [
    "## Available Tools",
    "",
    "Use these with Query() for read operations or Mutation() for write operations. The LLM decides which is appropriate based on the tool's purpose.",
    "",
  ]
  var specTools: [ToolSpec] = []
  for tool in tools {
    if case .name(let name) = tool { lines.append("- \(name)") }
    if case .spec(let spec) = tool { specTools.append(spec) }
  }
  for tool in specTools { lines.append(renderToolSignature(tool)) }

  let withOutput = specTools.filter { $0.outputSchema.isTruthy }
  if !withOutput.isEmpty {
    lines.append("")
    lines.append("### Default values for Query results")
    lines.append("")
    lines.append("Use these shapes as minimal Query defaults:")
    for tool in withOutput {
      lines.append("- \(tool.name): `\(JSON.stringify(defaultForSchema(tool.outputSchema)))`")
    }
  }
  lines.append("")
  lines.append(
    "CRITICAL: Use ONLY the tools listed above in Query() and Mutation() calls. Do NOT invent or guess tool names. If the user asks for functionality that doesn't match any available tool, use realistic mock data instead of fabricating a tool call."
  )
  return lines.joined(separator: "\n")
}

// MARK: - Component signatures

private func componentSignatures(
  _ spec: PromptSpec, toolCalls: Bool, bindings: Bool, usesActionExpression: Bool
) -> String {
  var lines = [
    "## Component Signatures",
    "",
    "Arguments marked with ? are optional. Sub-components can be inline or referenced; prefer references for better streaming.",
  ]
  if usesActionExpression {
    let steps = [
      toolCalls ? "@Run" : "", "@ToAssistant", "@OpenUrl", bindings ? "@Set" : "",
      bindings ? "@Reset" : "",
    ].filter { !$0.isEmpty }
    lines.append(
      "Props typed `ActionExpression` accept an Action([@steps...]) expression. See the Action section for available steps (\(steps.joined(separator: ", ")))."
    )
  }
  if bindings || spec.components.contains(where: { $0.spec.signature.contains("$binding") }) {
    lines.append(
      "Props marked `$binding<type>` accept a `$variable` reference for two-way binding.")
  }

  func format(_ component: ComponentPromptSpec) -> String {
    if let description = component.description, !description.isEmpty {
      return "\(component.signature) — \(description)"
    }
    return component.signature
  }
  let byName = Dictionary(spec.components.map { ($0.name, $0.spec) }, uniquingKeysWith: { $1 })

  if let groups = spec.componentGroups, !groups.isEmpty {
    var grouped: Set<String> = []
    for group in groups {
      lines.append("")
      lines.append("### \(group.name)")
      for name in group.components where !grouped.contains(name) {
        guard let component = byName[name] else { continue }
        grouped.insert(name)
        lines.append(format(component))
      }
      for note in group.notes ?? [] { lines.append(note) }
    }
    let ungrouped = spec.components.filter { !grouped.contains($0.name) }
    if !ungrouped.isEmpty {
      lines.append("")
      lines.append("### Other")
      for component in ungrouped { lines.append(format(component.spec)) }
    }
  } else {
    lines.append("")
    for component in spec.components { lines.append(format(component.spec)) }
  }
  return lines.joined(separator: "\n")
}

// MARK: - Assembly

/// Generates the system prompt that teaches a model OpenUI Lang and the
/// library's components. Matches lang-core's `generatePrompt`.
public func generatePrompt(_ spec: PromptSpec) -> String {
  let rootName = spec.root ?? "Root"
  let options = spec.options
  let hasTools = !(options.tools ?? []).isEmpty
  let toolCalls = options.toolCalls ?? hasTools
  let bindings = options.bindings ?? toolCalls
  let supportsExpressions = toolCalls || bindings
  let usesActionExpression = spec.components.contains {
    $0.spec.signature.contains("ActionExpression")
  }

  var parts: [String] = []
  parts.append(options.preamble ?? defaultPreamble)
  parts.append("")
  parts.append(syntaxRules(rootName, supportsExpressions: supportsExpressions, bindings: bindings))
  parts.append("")
  parts.append(
    componentSignatures(
      spec, toolCalls: toolCalls, bindings: bindings, usesActionExpression: usesActionExpression))

  if supportsExpressions {
    parts.append("")
    parts.append(builtinFunctionsSection())
  }
  if toolCalls {
    parts.append("")
    parts.append(querySection)
    parts.append("")
    parts.append(mutationSection)
  }
  if usesActionExpression {
    parts.append("")
    parts.append(actionSection(toolCalls: toolCalls, bindings: bindings))
  }
  if toolCalls && bindings {
    parts.append("")
    parts.append(interactiveFiltersSection)
  }
  if toolCalls {
    parts.append("")
    parts.append(toolWorkflowSection)
  }
  if let tools = options.tools, !tools.isEmpty {
    parts.append("")
    parts.append(renderToolsSection(tools))
  }
  parts.append("")
  parts.append(streamingRules(rootName, supportsExpressions: supportsExpressions))

  let examples = (options.examples ?? []) + (options.toolExamples ?? [])
  if !examples.isEmpty {
    parts.append("")
    parts.append("## Examples")
    parts.append("")
    for example in examples {
      parts.append(example)
      parts.append("")
    }
  }
  if options.editMode == true {
    parts.append("")
    parts.append(editModeSection)
  }
  if options.inlineMode == true {
    parts.append("")
    parts.append(inlineModeSection)
  }
  parts.append(importantRules(rootName, toolCalls: toolCalls, bindings: bindings))
  if let rules = options.additionalRules, !rules.isEmpty {
    parts.append("")
    for rule in rules { parts.append("- \(rule)") }
  }
  return parts.joined(separator: "\n")
}
