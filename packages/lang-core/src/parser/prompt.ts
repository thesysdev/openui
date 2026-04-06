import { BUILTINS, LAZY_BUILTIN_DEFS } from "./builtins";

// ─── PromptSpec types (JSON-serializable, no Zod deps) ──────────────────────

/**
 * Tool schema for prompt generation — describes a tool the LLM can use via Query()/Mutation().
 * Shape inspired by MCP's tool schema (name, description, inputSchema, annotations).
 */
export interface ToolSpec {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
}

export interface ComponentPromptSpec {
  signature: string; // pre-built: "Card(children: Component[], title?: string)"
  description?: string;
}

export interface ComponentGroup {
  name: string;
  components: string[];
  notes?: string[];
}

export interface PromptSpec {
  root?: string;
  components: Record<string, ComponentPromptSpec>;
  componentGroups?: ComponentGroup[];
  tools?: (string | ToolSpec)[];
  editMode?: boolean;
  inlineMode?: boolean;
  /** Enable Query(), Mutation(), @Run, tool workflow. Default: true if tools provided. */
  toolCalls?: boolean;
  /** Enable $variables, @Set, @Reset, interactive filters. Default: true if toolCalls. */
  bindings?: boolean;
  preamble?: string;
  /** Examples shown when no tools are present (static/layout patterns). */
  examples?: string[];
  /** Examples shown when tools ARE present (Query/Mutation patterns). Takes priority over `examples` when tools exist. */
  toolExamples?: string[];
  additionalRules?: string[];
}

// ─── JSON Schema → type string helper ───────────────────────────────────────

function jsonSchemaTypeStr(schema: Record<string, unknown>): string {
  const type = schema.type as string | undefined;

  if (type === "string") {
    const enumVals = schema.enum as string[] | undefined;
    if (enumVals) return enumVals.map((v) => `"${v}"`).join(" | ");
    return "string";
  }
  if (type === "number" || type === "integer") return "number";
  if (type === "boolean") return "boolean";
  if (type === "array") {
    const items = schema.items as Record<string, unknown> | undefined;
    if (items) return `${jsonSchemaTypeStr(items)}[]`;
    return "any[]";
  }
  if (type === "object") {
    const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
    if (props && Object.keys(props).length > 0) {
      const required = (schema.required as string[]) ?? [];
      const fields = Object.entries(props).map(([k, v]) => {
        const opt = required.includes(k) ? "" : "?";
        return `${k}${opt}: ${jsonSchemaTypeStr(v)}`;
      });
      return `{${fields.join(", ")}}`;
    }
    return "object";
  }

  return "any";
}

/** Generate a default-values hint object for an output schema. */
function defaultForSchema(schema: Record<string, unknown>): unknown {
  const type = schema.type as string | undefined;
  if (type === "string") return "";
  if (type === "number" || type === "integer") return 0;
  if (type === "boolean") return false;
  if (type === "array") return [];
  if (type === "object") {
    const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
    if (props && Object.keys(props).length > 0) {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        result[k] = defaultForSchema(v);
      }
      return result;
    }
    return {};
  }
  return null;
}

// ─── Section generators ─────────────────────────────────────────────────────

const PREAMBLE = `You are an AI assistant that responds using openui-lang, a declarative UI language. Your ENTIRE response must be valid openui-lang code — no markdown, no explanations, just openui-lang.`;

function syntaxRules(
  rootName: string,
  flags: { supportsExpressions: boolean; bindings: boolean },
): string {
  const lines = [
    "## Syntax Rules",
    "",
    "1. Each statement is on its own line: `identifier = Expression`",
    `2. \`root\` is the entry point — every program must define \`root = ${rootName}(...)\``,
    '3. Expressions are: strings ("..."), numbers, booleans (true/false), null, arrays ([...]), objects ({...}), or component calls TypeName(arg1, arg2, ...)',
    "4. Use references for readability: define `name = ...` on one line, then use `name` later",
    "5. EVERY variable (except root) MUST be referenced by at least one other variable. Unreferenced variables are silently dropped and will NOT render. Always include defined variables in their parent's children/items array.",
    '6. Arguments are POSITIONAL (order matters, not names). Write `Stack([children], "row", "l")` NOT `Stack([children], direction: "row", gap: "l")` — colon syntax is NOT supported and silently breaks',
    "7. Optional arguments can be omitted from the end",
  ];

  let ruleNum = 8;
  if (flags.bindings) {
    lines.push(
      `${ruleNum++}. Declare mutable state with \`$varName = defaultValue\`. Components marked with \`$binding\` can read/write these. Undeclared $variables are auto-created with null default.`,
    );
  }
  if (flags.supportsExpressions) {
    lines.push(
      `${ruleNum++}. String concatenation: \`"text" + $var + "more"\``,
      `${ruleNum++}. Dot member access: \`query.field\` reads a field; on arrays it extracts that field from every element`,
      `${ruleNum++}. Index access: \`arr[0]\`, \`data[index]\``,
      `${ruleNum++}. Arithmetic operators: +, -, *, /, % (work on numbers; + is string concat when either side is a string)`,
      `${ruleNum++}. Comparison: ==, !=, >, <, >=, <=`,
      `${ruleNum++}. Logical: &&, ||, ! (prefix)`,
      `${ruleNum++}. Ternary: \`condition ? valueIfTrue : valueIfFalse\``,
      `${ruleNum++}. Parentheses for grouping: \`(a + b) * c\``,
    );
  }

  lines.push("- Strings use double quotes with backslash escaping");

  return lines.join("\n");
}

function builtinFunctionsSection(): string {
  // Auto-generated from shared builtin registry — single source of truth
  const builtinLines = Object.values(BUILTINS).map((b) => `@${b.signature} — ${b.description}`);
  const lazyLines = Object.values(LAZY_BUILTIN_DEFS).map(
    (b) => `@${b.signature} — ${b.description}`,
  );
  const lines = [...builtinLines, ...lazyLines].join("\n");

  return `## Built-in Functions

Data functions prefixed with \`@\` to distinguish from components. These are the ONLY functions available — do NOT invent new ones.
Use @-prefixed built-in functions (@Count, @Sum, @Avg, @Min, @Max, @Round) on Query results — do NOT hardcode computed values.

${lines}

Builtins compose — output of one is input to the next:
\`@Count(@Filter(data.rows, "field", "==", "val"))\` for KPIs/chart values, \`@Round(@Avg(data.rows.score), 1)\`, \`@Each(data.rows, "item", Comp(item.field))\` for per-item rendering.
Array pluck: \`data.rows.field\` extracts a field from every row → use with @Sum, @Avg, charts, tables.

IMPORTANT @Each rule: The loop variable (e.g. "item") is ONLY available inside the @Each template expression. Always inline the template — do NOT extract it to a separate statement.
CORRECT: \`Col("Actions", @Each(rows, "t", Button("Edit", Action([@Set($id, t.id)]))))\`
WRONG: \`myBtn = Button("Edit", Action([@Set($id, t.id)]))\` then \`Col("Actions", @Each(rows, "t", myBtn))\` — t is undefined in myBtn.`;
}

function querySection(): string {
  return `## Query — Live Data Fetching

Fetch data from available tools. Returns defaults instantly, swaps in real data when it arrives.

\`\`\`
metrics = Query("tool_name", {arg1: value, arg2: $binding}, {defaultField: 0, defaultData: []}, refreshInterval?)
\`\`\`

- First arg: tool name (string)
- Second arg: arguments object (may reference $bindings — re-fetches automatically on change)
- Third arg: default data (rendered immediately before fetch resolves)
- Fourth arg (optional): refresh interval in seconds (e.g. 30 for auto-refresh every 30s)
- Use dot access on results: metrics.totalEvents, metrics.data.day (array pluck)
- Query results must use regular identifiers: \`metrics = Query(...)\`, NOT \`$metrics = Query(...)\`
- Manual refresh: \`Button("Refresh", Action([@Run(query1), @Run(query2)]), "secondary")\` — re-fetches the listed queries
- Refresh all queries: create Action with @Run for each query`;
}

function mutationSection(): string {
  return `## Mutation — Write Operations

Execute state-changing tool calls (create, update, delete). Unlike Query (auto-fetches on render), Mutation fires only on button click via Action.

\`\`\`
result = Mutation("tool_name", {arg1: $binding, arg2: "value"})
\`\`\`

- First arg: tool name (string)
- Second arg: arguments object (evaluated with current $binding values at click time)
- result.status: "idle" | "loading" | "success" | "error"
- result.data: tool response on success
- result.error: error message on failure
- Mutation results use regular identifiers: \`result = Mutation(...)\`, NOT \`$result\`
- Show loading state: \`result.status == "loading" ? TextContent("Saving...") : null\``;
}

function actionSection(flags: { toolCalls: boolean; bindings: boolean }): string {
  const steps = [
    '- @ToAssistant("message") — Send a message to the assistant (for conversational buttons like "Tell me more", "Explain this")',
    '- @OpenUrl("https://...") — Navigate to a URL',
  ];

  if (flags.bindings) {
    steps.push(
      "- @Set($variable, value) — Set a $variable to a specific value",
      '- @Reset($var1, $var2, ...) — Reset $variables to their declared defaults (e.g. @Reset($title, $priority) restores $title="" and $priority="medium")',
    );
  }

  if (flags.toolCalls) {
    steps.unshift(
      "- @Run(queryOrMutationRef) — Execute a Mutation or re-fetch a Query (ref must be a declared Query/Mutation)",
    );
  }

  const examples: string[] = [];
  if (flags.toolCalls) {
    examples.push(`Example — mutation + refresh + reset (PREFERRED pattern):
\`\`\`
$binding = "default"
result = Mutation("tool_name", {field: $binding})
data = Query("tool_name", {}, {rows: []})
onSubmit = Action([@Run(result), @Run(data), @Reset($binding)])
\`\`\``);
  }

  examples.push(`Example — simple nav:
\`\`\`
viewBtn = Button("View", Action([@OpenUrl("https://example.com")]))
\`\`\``);

  const rules = [
    '- Action can be assigned to a variable or inlined: Button("Go", onSubmit) and Button("Go", Action([...])) both work',
  ];
  if (flags.toolCalls) {
    rules.push(
      "- If a @Run(mutation) step fails, remaining steps are skipped (halt on failure)",
      "- @Run(queryRef) re-fetches the query (fire-and-forget, cannot fail)",
    );
  }

  return `## Action — Button Behavior

Action([@steps...]) wires button clicks to operations. Steps are @-prefixed built-in actions. Steps execute in order.
Buttons without an explicit Action prop automatically send their label to the assistant (equivalent to Action([@ToAssistant(label)])).

Available steps:
${steps.join("\n")}

${examples.join("\n\n")}

${rules.join("\n")}`;
}

function interactiveFiltersSection(): string {
  return `## Interactive Filters

To let the user filter data with a dropdown:
1. Declare a $variable with a default: \`$dateRange = "14"\`
2. Create a Select with name, items, and binding: \`Select("dateRange", [SelectItem("7", "Last 7 days"), ...], null, null, $dateRange)\`
3. Wrap in FormControl for a label: \`FormControl("Date Range", Select(...))\`
4. Pass $dateRange in Query args: \`Query("tool", {dateRange: $dateRange}, {defaults})\`
5. When the user changes the Select, $dateRange updates and the Query automatically re-fetches

FILTER WIRING RULE: If a $binding filter is visible in the UI, EVERY relevant Query MUST reference that $binding in its args. Never show a filter dropdown while hardcoding the query args.

Rules for $variables:
- $variables hold simple values (strings or numbers), NOT arrays or objects
- $variables must be bound to a Select/Input component via the value argument (last positional arg) to be interactive
- Queries must use regular identifiers (NOT $variables): \`metrics = Query(...)\` not \`$metrics = Query(...)\`
- **Auto-declare**: You do NOT need to explicitly declare $variables. If you use \`$foo\` without declaring it, the parser auto-creates \`$foo = null\`. You can still declare explicitly to set a default: \`$days = "14"\`

## Forms

Simple form — no $bindings needed. Field values are managed internally by the Form via the name prop:
\`\`\`
contactForm = Form("contact", submitBtn, [nameField, emailField])
nameField = FormControl("Name", Input("name", "Your name", "text", {required: true}))
emailField = FormControl("Email", Input("email", "your@email.com", "email", {required: true, email: true}))
submitBtn = Button("Submit")
\`\`\`

Use $bindings when you need to read field values elsewhere (in Action context, Query args, or conditionals). They are auto-declared:
\`\`\`
$role = "engineer"
contactForm = Form("contact", submitBtn, [nameField, emailField, roleField])
nameField = FormControl("Name", Input("name", "Enter your name", "text", {required: true}, $name))
emailField = FormControl("Email", Input("email", "Enter your email", "email", {required: true, email: true}, $email))
roleField = FormControl("Role", Select("role", [SelectItem("engineer", "Engineer"), SelectItem("designer", "Designer"), SelectItem("pm", "PM")], null, {required: true}, $role))
submitBtn = Button("Submit")
\`\`\`

For form + mutation patterns (create, refresh, reset), see the Action section example above.

IMPORTANT: Always add validation rules to form fields used with Mutations. Use OBJECT syntax: {required: true, email: true, minLength: 8}. The renderer shows error messages automatically and blocks submit when validation fails.`;
}

function editModeSection(): string {
  return `## Edit Mode

The runtime merges by statement name: same name = replace, new name = append.
Output ONLY statements that changed or are new. Everything else is kept automatically.

### Delete
To remove a component, update the parent to exclude it from its children array. Orphaned statements are automatically garbage-collected.
Example — remove chart: \`root = Stack([header, kpiRow, table])\` — chart is no longer in the children list, so it and any statements only it referenced are auto-deleted.

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
- If you are about to output more than 10 statements, reconsider — most edits need fewer`;
}

function streamingRules(rootName: string): string {
  return `## Hoisting & Streaming (CRITICAL)

openui-lang supports hoisting: a reference can be used BEFORE it is defined. The parser resolves all references after the full input is parsed.

During streaming, the output is re-parsed on every chunk. Undefined references are temporarily unresolved and appear once their definitions stream in. This creates a progressive top-down reveal — structure first, then data fills in.

**Recommended statement order for optimal streaming:**
1. \`root = ${rootName}(...)\` — UI shell appears immediately
2. $variable declarations — state ready for bindings
3. Query statements — defaults resolve immediately so components render with data
4. Component definitions — fill in with data already available
5. Data values — leaf content last

Always write the root = ${rootName}(...) statement first so the UI shell appears immediately, even before child data has streamed in.`;
}

function inlineModeSection(): string {
  return `## Inline Mode

You are in inline mode. You can respond in two ways:

### 1. Code response (when the user wants to CREATE or CHANGE the UI)
Wrap openui-lang code in triple-backtick fences. You can include explanatory text before/after:

Here's your dashboard:

\`\`\`openui-lang
root = RootComp([header, content])
header = SomeHeader("Title")
content = SomeContent("Hello world")
\`\`\`

I created a simple layout with a header.

### 2. Text-only response (when the user asks a QUESTION)
If the user asks "what is this?", "explain the chart", "how does this work", etc. — respond with plain text. Do NOT output any openui-lang code. The existing dashboard stays unchanged.

### Rules
- When the user asks for changes, output ONLY the changed/new statements in a fenced block
- When the user asks a question, respond with text only — NO code. The dashboard stays unchanged.
- The parser extracts code from fences automatically. Text outside fences is shown as chat.`;
}

function toolWorkflowSection(): string {
  return `## Data Workflow

When tools are available, follow this workflow:
1. FIRST: Call the most relevant tool to inspect the real data shape before generating code
2. Use Query() for READ operations (data that should stay live) — NEVER hardcode tool results as literal arrays or objects
3. Use Mutation() for WRITE operations (create, update, delete) — triggered by button clicks via Action([@Run(mutationRef)])
4. Use the real data from step 1 as condensed Query defaults (3-5 rows) so the UI renders immediately
5. Use @-prefixed builtins (@Count, @Filter, @Sort, @Sum) on Query results for KPIs and aggregations — the runtime evaluates these live on every refresh
6. Hardcoded arrays are ONLY for static display data (labels, options) where no tool exists

WRONG — you called a tool and got data back, but you inlined the results:
\`\`\`
openCount = 2
item1 = SomeComp("first item title")
item2 = SomeComp("second item title")
list = Stack([item1, item2])
chart = SomeChart(["A", "B"], [12, 8])
\`\`\`
This is static — it shows stale data and won't update. Creating item1, item2, item3... manually is ALWAYS wrong when a tool exists.

RIGHT — use Query() for live data, Mutation() for writes, @builtins to derive values:
\`\`\`
data = Query("tool_name", {}, {rows: []})
openCount = @Count(@Filter(data.rows, "field", "==", "value"))
list = @Each(data.rows, "item", SomeComp(item.title, item.field))
createResult = Mutation("create_tool", {title: $title})
submitBtn = Button("Create", Action([@Run(createResult), @Run(data), @Reset($title)]))
\`\`\`
Everything derives from the Query — when data refreshes, the entire dashboard updates automatically.`;
}

function importantRules(
  rootName: string,
  flags: { toolCalls: boolean; bindings: boolean },
): string {
  const verifyLines = [
    `1. root = ${rootName}(...) is the FIRST line (for optimal streaming).`,
    "2. Every referenced name is defined. Every defined name (other than root) is reachable from root.",
  ];
  if (flags.toolCalls) {
    verifyLines.push("3. Every Query result is referenced by at least one component.");
  }
  if (flags.bindings) {
    verifyLines.push(
      `${flags.toolCalls ? "4" : "3"}. Every $binding appears in at least one component or expression.`,
    );
  }

  return `## Important Rules
- When asked about data, generate realistic/plausible data
- Choose components that best represent the content (tables for comparisons, charts for trends, forms for input, etc.)

## Final Verification
Before finishing, walk your output and verify:
${verifyLines.join("\n")}`;
}

// ─── Tool rendering ─────────────────────────────────────────────────────────

function renderToolSignature(tool: ToolSpec): string {
  let args = "";
  if (tool.inputSchema) {
    const props = (tool.inputSchema as any).properties as
      | Record<string, Record<string, unknown>>
      | undefined;
    const required = ((tool.inputSchema as any).required as string[]) ?? [];
    if (props && Object.keys(props).length > 0) {
      args = Object.entries(props)
        .map(([k, v]) => {
          const opt = required.includes(k) ? "" : "?";
          return `${k}${opt}: ${jsonSchemaTypeStr(v)}`;
        })
        .join(", ");
    }
  }

  let returnType = "";
  if (tool.outputSchema) {
    returnType = ` → ${jsonSchemaTypeStr(tool.outputSchema as Record<string, unknown>)}`;
  }

  let line = `- ${tool.name}(${args})${returnType}`;
  if (tool.description) {
    line += `\n  ${tool.description}`;
  }
  return line;
}

function renderToolsSection(tools: (string | ToolSpec)[]): string {
  const lines: string[] = [];

  const stringTools: string[] = [];
  const specTools: ToolSpec[] = [];

  for (const tool of tools) {
    if (typeof tool === "string") {
      stringTools.push(tool);
    } else {
      specTools.push(tool);
    }
  }

  lines.push("## Available Tools");
  lines.push("");
  lines.push(
    "Use these with Query() for read operations or Mutation() for write operations. The LLM decides which is appropriate based on the tool's purpose.",
  );
  lines.push("");
  for (const t of stringTools) {
    lines.push(`- ${t}`);
  }
  for (const t of specTools) {
    lines.push(renderToolSignature(t));
  }

  // Default values hint for ToolSpec tools with outputSchema
  const toolsWithOutput = specTools.filter((t) => t.outputSchema);
  if (toolsWithOutput.length > 0) {
    lines.push("");
    lines.push("### Default values for Query results");
    lines.push("");
    lines.push("Use these shapes as minimal Query defaults:");
    for (const t of toolsWithOutput) {
      const defaults = defaultForSchema(t.outputSchema as Record<string, unknown>);
      lines.push(`- ${t.name}: \`${JSON.stringify(defaults)}\``);
    }
  }

  lines.push("");
  lines.push(
    "CRITICAL: Use ONLY the tools listed above in Query() and Mutation() calls. Do NOT invent or guess tool names. If the user asks for functionality that doesn't match any available tool, use realistic mock data instead of fabricating a tool call.",
  );

  return lines.join("\n");
}

// ─── Component signatures ───────────────────────────────────────────────────

function generateComponentSignatures(spec: PromptSpec): string {
  const toolCalls = spec.toolCalls ?? !!spec.tools?.length;
  const bindings = spec.bindings ?? toolCalls;
  const allSteps = [
    toolCalls ? "@Run" : "",
    "@ToAssistant",
    "@OpenUrl",
    bindings ? "@Set" : "",
    bindings ? "@Reset" : "",
  ].filter(Boolean);
  const actionHint = `Props typed \`ActionExpression\` accept an Action([@steps...]) expression. See the Action section for available steps (${allSteps.join(", ")}).`;

  const lines = [
    "## Component Signatures",
    "",
    "Arguments marked with ? are optional. Sub-components can be inline or referenced; prefer references for better streaming.",
    actionHint,
    "Props marked `$binding<type>` accept a `$variable` reference for two-way binding.",
  ];

  if (spec.componentGroups?.length) {
    const grouped = new Set<string>();
    for (const group of spec.componentGroups) {
      lines.push("", `### ${group.name}`);
      for (const name of group.components) {
        if (grouped.has(name)) continue;
        const comp = spec.components[name];
        if (!comp) continue;
        grouped.add(name);
        lines.push(comp.description ? `${comp.signature} — ${comp.description}` : comp.signature);
      }
      if (group.notes?.length) {
        for (const note of group.notes) lines.push(note);
      }
    }
    const ungrouped = Object.keys(spec.components).filter((n) => !grouped.has(n));
    if (ungrouped.length) {
      lines.push("", "### Other");
      for (const name of ungrouped) {
        const comp = spec.components[name];
        lines.push(comp.description ? `${comp.signature} — ${comp.description}` : comp.signature);
      }
    }
  } else {
    lines.push("");
    for (const [, comp] of Object.entries(spec.components)) {
      lines.push(comp.description ? `${comp.signature} — ${comp.description}` : comp.signature);
    }
  }
  return lines.join("\n");
}

// ─── Prompt assembly ────────────────────────────────────────────────────────

export function generatePrompt(spec: PromptSpec): string {
  const rootName = spec.root ?? "Root";
  const hasTools = !!spec.tools?.length;

  // Resolve prompt flags — defaults preserve backward compat
  const toolCalls = spec.toolCalls ?? hasTools;
  const bindings = spec.bindings ?? toolCalls;
  const supportsExpressions = toolCalls || bindings;

  const parts: string[] = [];

  parts.push(spec.preamble ?? PREAMBLE);
  parts.push("");
  parts.push(syntaxRules(rootName, { supportsExpressions, bindings }));
  parts.push("");
  parts.push(generateComponentSignatures(spec));

  // Built-in functions — always included
  parts.push("");
  parts.push(builtinFunctionsSection());

  // Query + Mutation sections
  if (toolCalls) {
    parts.push("");
    parts.push(querySection());
    parts.push("");
    parts.push(mutationSection());
  }

  // Action section — always included (ToAssistant, OpenUrl always; @Run/@Set/@Reset gated)
  parts.push("");
  parts.push(actionSection({ toolCalls, bindings }));

  // Interactive filters (needs both toolCalls and bindings)
  if (toolCalls && bindings) {
    parts.push("");
    parts.push(interactiveFiltersSection());
  }

  // Tool workflow
  if (toolCalls) {
    parts.push("");
    parts.push(toolWorkflowSection());
  }

  // Tools list (only if actual tools provided)
  if (spec.tools?.length) {
    parts.push("");
    parts.push(renderToolsSection(spec.tools));
  }

  parts.push("");
  parts.push(streamingRules(rootName));

  // Show tool examples when toolCalls are on, otherwise show general examples
  const examples = toolCalls && spec.toolExamples?.length ? spec.toolExamples : spec.examples;
  if (examples?.length) {
    parts.push("");
    parts.push("## Examples");
    parts.push("");
    for (const ex of examples) {
      parts.push(ex);
      parts.push("");
    }
  }

  // Edit mode instructions
  if (spec.editMode) {
    parts.push("");
    parts.push(editModeSection());
  }

  // Inline mode instructions
  if (spec.inlineMode) {
    parts.push("");
    parts.push(inlineModeSection());
  }

  parts.push(importantRules(rootName, { toolCalls, bindings }));

  if (spec.additionalRules?.length) {
    parts.push("");
    for (const rule of spec.additionalRules) {
      parts.push(`- ${rule}`);
    }
  }

  return parts.join("\n");
}
