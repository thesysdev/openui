// Regenerates the conformance fixtures in Tests/OpenUILangTests/Fixtures from
// the TypeScript implementation, which is the source of truth.
//
//   pnpm run build:packages
//   node packages/swift-lang/Scripts/generate-fixtures.mjs
//
// Each fixture pairs an input with what @openuidev/lang-core produces for it.
// The Swift tests feed the same input to the Swift port and compare.

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packages = join(here, "..", "..");
const fixtures = join(here, "..", "Tests", "OpenUILangTests", "Fixtures");

// Fixture generation is not product usage, so keep lang-core's telemetry off.
process.env.OPENUI_TELEMETRY_DISABLED = "1";

const core = await import(join(packages, "lang-core", "dist", "index.mjs"));
const ui = await import(join(packages, "react-ui", "dist", "genui-lib", "index.mjs"));

// ── Schemas ───────────────────────────────────────────────────────────────

const chatSchema = ui.openuiChatLibrary.toJSONSchema();
// react-ui's general library: the chat components plus Stack (its root) and Modal.
const openuiSchema = ui.openuiLibrary.toJSONSchema();

// Small hand-written schema that exercises validation paths the chat library
// doesn't: defaults, const, integer, nested required keys, enum defaults.
const testSchema = {
  $defs: {
    Card: {
      properties: {
        children: {
          type: "array",
          items: {
            anyOf: [
              { $ref: "#/$defs/Text" },
              { $ref: "#/$defs/Button" },
              { $ref: "#/$defs/Chart" },
            ],
          },
        },
        title: { type: "string" },
      },
      required: ["children"],
    },
    Text: {
      properties: {
        text: { type: "string" },
        size: { type: "string", enum: ["s", "m", "l"], default: "m" },
      },
      required: ["text"],
    },
    Button: {
      properties: {
        label: { type: "string" },
        action: {},
        variant: { type: "string", enum: ["primary", "secondary"] },
      },
      required: ["label"],
    },
    Input: {
      properties: { name: { type: "string" }, value: { type: "string" } },
      required: ["name"],
    },
    Chart: {
      properties: {
        labels: { type: "array", items: { type: "string" } },
        values: { type: "array", items: { type: "number" } },
        meta: {
          type: "object",
          properties: { unit: { type: "string" }, scale: { type: "number", default: 1 } },
          required: ["unit"],
        },
      },
      required: ["labels", "values"],
    },
    Tagged: {
      properties: {
        count: { type: "integer" },
        flag: { type: "boolean" },
        kind: { const: "x" },
        tone: { type: "string", default: "neutral" },
      },
      required: ["tone"],
    },
  },
};

/** Props bound two-way to $state (lang-core's reactive()), per component. */
function reactiveProps(library) {
  const out = {};
  for (const [name, comp] of Object.entries(library.components)) {
    const keys = Object.entries(comp.props.shape ?? {})
      .filter(([, schema]) => core.isReactiveSchema(schema))
      .map(([key]) => key);
    if (keys.length) out[name] = keys;
  }
  return out;
}

// The test schema has no Zod library behind it, so build the minimal shape
// evaluateElementProps reads: components[name].props.shape[prop].
const testReactive = { Input: ["value"] };
const testLibrary = {
  components: Object.fromEntries(
    Object.entries(testSchema.$defs).map(([name, def]) => [
      name,
      {
        props: {
          shape: Object.fromEntries(
            Object.keys(def.properties).map((key) => {
              const schema = {};
              if (testReactive[name]?.includes(key)) core.markReactive(schema);
              return [key, schema];
            }),
          ),
        },
      },
    ]),
  ),
};

// Zod hoists recursive data shapes into $defs (__schema0); only the names
// under `properties` are components.
const hoistedSchema = {
  properties: { Tree: {} },
  $defs: {
    Tree: { properties: { node: { $ref: "#/$defs/__schema0" } }, required: ["node"] },
    __schema0: { type: "object", properties: { label: { type: "string" } } },
  },
};

const schemas = {
  chat: { schema: chatSchema, root: "Card", reactive: reactiveProps(ui.openuiChatLibrary) },
  openui: { schema: openuiSchema, root: "Stack", reactive: reactiveProps(ui.openuiLibrary) },
  test: { schema: testSchema, root: "Card", reactive: testReactive },
  hoisted: { schema: hoistedSchema, root: "Tree", reactive: {} },
};
const libraries = { chat: ui.openuiChatLibrary, openui: ui.openuiLibrary, test: testLibrary };

// ── Corpus ────────────────────────────────────────────────────────────────

const chatExamples = ui.openuiChatPromptOptions.examples.map((text, i) => ({
  name: `chat-example-${i + 1}`,
  schema: "chat",
  input: text,
}));

const openuiExamples = ui.openuiPromptOptions.examples.map((text, i) => ({
  name: `openui-example-${i + 1}`,
  schema: "openui",
  input: text,
}));

const t = (name, input) => ({ name, schema: "test", input });

const edgeCases = [
  t("basic", 'root = Card([t1, b1])\nt1 = Text("Hi")\nb1 = Button("Go")'),
  t("missing-required", 'root = Card([t1, b1])\nt1 = Text()\nb1 = Button("Go")'),
  t("null-required-with-default", "root = Card([t1])\nt1 = Text(null)"),
  t("required-default-fills", 'root = Card([x])\nx = Tagged(1, true, "x", null)'),
  t("unknown-component", 'root = Card([Mystery("a"), Text("b")])'),
  t("excess-args", 'root = Card([Text("a", "m", "extra", 4)])'),
  t("type-mismatch-scalar", "root = Card([Text(42)], 7)"),
  t("enum-mismatch", 'root = Card([Text("a", "xl"), Button("b", null, "tertiary")])'),
  t("enum-partial-deferred", 'root = Card([Text("a", "x'),
  t("integer-boolean-const", 'root = Card([x])\nx = Tagged(1.5, "yes", "y", "loud")'),
  t(
    "nested-object",
    'root = Card([c1, c2, c3])\nc1 = Chart(["a"], [1], {unit: "kg"})\nc2 = Chart(["a"], [1], {scale: 2})\nc3 = Chart(["a"], [1], {unit: 5, scale: "big"})',
  ),
  t("array-items-pruned", 'root = Card([Chart(["a", 2, "c"], [1, "x", 3])])'),
  t("element-in-data-slot", 'root = Card([Chart([Text("a")], [1])])'),
  t("unresolved-and-orphaned", 'root = Card([a, missing])\na = Text("x")\nlonely = Text("y")'),
  t("cycle", "root = Card([a])\na = Card([b])\nb = Card([a])"),
  t("self-reference", "root = Card([root])"),
  t("no-root-first-component", 'x = 1\nmain = Card([Text("a")])\nother = Card([])'),
  t("root-name-statement", 'Card = Card([Text("named")])\nother = Card([])'),
  t("duplicate-ids", 'root = Card([a])\na = Text("first")\na = Text("second")'),
  t("only-prose", "Here is your UI, it will appear below."),
  t("empty", ""),
  t("whitespace", "   \n\t  \n"),
  t(
    "fences-and-prose",
    'Sure! Here it is:\n```openui\nroot = Card([a])\na = Text("fenced")\n```\nAnything else?',
  ),
  t("multiple-fences", '```\nroot = Card([a])\n```\nand\n```\na = Text("second block")\n```'),
  t("unclosed-fence", '```openui\nroot = Card([a])\na = Text("str'),
  t("fence-in-string", 'root = Card([a])\na = Text("use ``` to fence")'),
  t(
    "comments",
    'root = Card([a]) // trailing\n# full line\na = Text("not // a comment # here")\n// done',
  ),
  t("crlf", 'root = Card([a])\r\na = Text("windows")\r\n'),
  t(
    "string-escapes",
    'root = Card([a, b, c, d])\na = Text("tab\\tnew\\nquote\\" back\\\\ uni\\u00e9 pair\\ud83d\\ude00")\nb = Text(\'single \\\' quote \\n esc \\q\')\nc = Text("bad \\x escape")\nd = Text("emoji 😀 and é and 漢字")',
  ),
  t("emoji-outside-strings", 'root = Card([a]) 😀\na = Text("ok") ✅'),
  t("unterminated-string", 'root = Card([a])\na = Text("streaming tex'),
  t("unterminated-escape", 'root = Card([a])\na = Text("ends with \\'),
  t(
    "numbers",
    'root = Card([Chart(["a","b","c","d","e","f"], [-3, 1.5, 1e3, 007, -0, 2.5e-3])])\n$x = 1e\n$y = 1E+2\n$z = 3.',
  ),
  t(
    "operators",
    '$a = 1\n$b = "2"\nroot = Card([Text($a + $b * 2 - -1 > 3 && !$c || $a == "1" ? "yes" : "no")])',
  ),
  t(
    "multiline-ternary",
    '$on = true\nroot = Card([t])\nt = Text($on\n  ? "enabled"\n  : "disabled")',
  ),
  t(
    "member-index",
    '$data = {rows: [{name: "a"}, {name: "b"}], "key x": 1}\nroot = Card([Text($data.rows[1].name), Text($data.rows.name), Text($data["key x"])])',
  ),
  t(
    "builtins",
    '$items = [3, 1, 2]\nroot = Card([Text("" + @Count($items)), Text("" + @Sum($items)), Text(@Round(2.555, 2) + "")])\nbare = Count($items)',
  ),
  t(
    "actions",
    '$n = 0\nroot = Card([b1, b2, b3])\nb1 = Button("Inc", Action([@Set($n, $n + 1), @ToAssistant("Bumped", "ctx")]))\nb2 = Button("Reset", Action([@Reset($n)]))\nb3 = Button("Docs", Action([@OpenUrl("https://openui.com")]))',
  ),
  t(
    "each",
    '$todos = [{title: "a", done: false}, {title: "b", done: true}]\nroot = Card(@Each($todos, todo, Text(todo.title)))',
  ),
  t(
    "query-mutation",
    '$q = "x"\nusers = Query("list_users", {search: $q, page: $page}, {rows: []}, 30)\nsave = Mutation("save_user", {name: $q})\nroot = Card([Text(users.rows.length + " users"), Button("Save", Action([@Run(save), @Run(users)]))])',
  ),
  t("state-query", '$data = Query("get", {})\nroot = Card([Text("x")])'),
  t("inline-query", 'root = Card([Text(Query("get", {}))])'),
  t("assignment", '$v = ""\nroot = Card([Input("name", $v = $value)])'),
  t(
    "object-key-order",
    '$o = {b: 1, 2: "two", a: 3, 1: "one", "10": 10}\nroot = Card([Text("x")])',
  ),
  t("missing-commas", 'root = Card([Text("a") Text("b"), Text("c"),])'),
  t("lowercase-builtin-name", "root = Card([Text(@first([1]))])"),
  t("unknown-tokens", 'root = Card([Text("a")]) ; ~ ^\n$ = 3\n= 4\nfoo'),
  t(
    "combining-characters",
    'root = Card([Text("e\\u0301 cafe\\u0301"), Text("한국어"), Text("ok")])',
  ),
  t("truncated-mid-call", 'root = Card([a, b])\na = Text("one")\nb = Button("tw'),
  t("truncated-mid-object", 'root = Card([Chart(["a"], [1], {unit: "k'),
  t(
    "data-in-component-slot",
    'root = Card([Text("hi"), { text: "a" }, "b", 3, [Text("x")], true])',
  ),
  t("data-in-component-slot-via-ref", 'root = Card(items)\nitems = [{ text: "a" }]'),
  { name: "hoisted-data-def", schema: "hoisted", input: 'root = Tree({ label: "a" })' },
  // OpenUI Cloud's wire format: a content marker, a fenced program, an end marker.
  {
    name: "cloud-envelope",
    schema: "chat",
    input:
      ']]>openui:content?thesys=true\n```openui-lang\nroot = Card([h, t])\nh = CardHeader("Q3", "Revenue")\nt = TextContent("Up 12%")\n```\n]]>openui:end',
  },
];

// ── Fixture generation ────────────────────────────────────────────────────

function parseWith(schemaName, input) {
  const { schema, root } = schemas[schemaName];
  return core.createParser(schema, root).parse(input);
}

/** UTF-16 offsets that don't split a surrogate pair. */
function safeOffsets(text, step) {
  const offsets = [];
  for (let i = step; i < text.length; i += step) {
    let at = i;
    const code = text.charCodeAt(at - 1);
    if (code >= 0xd800 && code <= 0xdbff) at += 1;
    offsets.push(at);
  }
  offsets.push(text.length);
  return [...new Set(offsets)];
}

function streamCheckpoints(schemaName, input) {
  const { schema, root } = schemas[schemaName];
  const parser = core.createStreamingParser(schema, root);
  const step = Math.max(1, Math.ceil(input.length / 12));
  let last = 0;
  return safeOffsets(input, step).map((at) => {
    const result = parser.push(input.slice(last, at));
    last = at;
    return { at, expected: result };
  });
}

const parserCases = [...chatExamples, ...openuiExamples, ...edgeCases].map((c) => ({
  ...c,
  expected: parseWith(c.schema, c.input),
}));

const streamingCases = [...chatExamples, ...openuiExamples, ...edgeCases]
  .filter((c) => c.input.length > 0)
  .map((c) => ({ ...c, checkpoints: streamCheckpoints(c.schema, c.input) }));

// `set()` with appended text, then replaced text (which resets the parser).
const setCases = edgeCases.slice(0, 6).map((c) => {
  const { schema, root } = schemas[c.schema];
  const parser = core.createStreamingParser(schema, root);
  const half = c.input.slice(0, Math.floor(c.input.length / 2));
  const steps = [half, c.input, 'root = Card([Text("replaced")])'].map((text) => ({
    text,
    expected: parser.set(text),
  }));
  return { name: c.name, schema: c.schema, steps };
});

// ── Evaluation ──────────────────────────────────────────────────────────

const unwrap = (v) =>
  v && typeof v === "object" && !Array.isArray(v) && "value" in v ? v.value : v;

/** Parses, seeds a store like the renderer does, and evaluates the tree. */
function evaluateCase(c) {
  const result = parseWith(c.schema, c.input);
  const store = core.createStore();
  store.initialize(result.stateDeclarations, {});
  for (const [key, value] of Object.entries(c.state ?? {})) store.set(key, value);
  const ctx = {
    getState: (name) => unwrap(store.get(name)),
    resolveRef: (name) => (c.queryResults ?? {})[name] ?? null,
  };
  const errors = [];
  const root = result.root
    ? core.evaluateElementProps(result.root, { ctx, library: libraries[c.schema], store, errors })
    : null;
  return { root, errors };
}

const e = (name, input, extra = {}) => ({ name, schema: "test", input, ...extra });

const evalCases = [
  ...chatExamples,
  ...openuiExamples,
  e("operators", edgeCases.find((c) => c.name === "operators").input),
  e("member-index", edgeCases.find((c) => c.name === "member-index").input),
  e("actions", edgeCases.find((c) => c.name === "actions").input),
  e("each", edgeCases.find((c) => c.name === "each").input),
  e(
    "builtins-all",
    '$n = [5, "3", 9, "x", true]\n$rows = [{n: "b", v: 2}, {n: "a", v: 10}, {n: "c", v: "1"}]\nroot = Card([Text("" + @Count($n) + "|" + @Sum($n) + "|" + @Avg($n) + "|" + @Min($n) + "|" + @Max($n) + "|" + @First($n) + "|" + @Last($n) + "|" + @Round(-2.5) + "|" + @Round(1.005, 2) + "|" + @Abs(-3) + "|" + @Floor(1.7) + "|" + @Ceil(1.2)), Text(@Sort($rows, "v", "desc").n + ""), Text(@Sort($rows, "n").n + ""), Text(@Filter($rows, "v", ">", 1).n + ""), Text(@Filter($rows, "n", "contains", "a").n + ""), Text(@Filter($rows, "v", "==", "2").n + "")])',
  ),
  e(
    "arithmetic-edges",
    '$z = 0\nroot = Card([Text("" + (5 / $z) + "|" + (-7 % 3) + "|" + (7 % $z) + "|" + ("a" + null) + "|" + (null + 1) + "|" + (true + 1) + "|" + ("5" * "2") + "|" + ("x" - 1) + "|" + (0.1 + 0.2) + "|" + (1 / 3))])',
  ),
  e(
    "truthiness-and-equality",
    '$e = ""\n$z = 0\n$arr = []\nroot = Card([Text("" + ($e || "empty") + "|" + ($z && "no") + "|" + ($arr ? "arr-truthy" : "arr-falsy") + "|" + (1 == "1") + "|" + (null == 0) + "|" + ($missing == null) + "|" + !$e)])',
  ),
  e(
    "ternary-components",
    '$on = true\nroot = Card([$on ? Text("on", "l") : Button("off"), $on ? null : Text("hidden")])',
  ),
  e("ternary-components-off", '$on = true\nroot = Card([$on ? Text("on", "l") : Button("off")])', {
    state: { $on: false },
  }),
  e("state-override", '$count = 1\nroot = Card([Text("count " + $count)])', {
    state: { $count: 41 },
  }),
  e("reactive-binding", '$v = "hi"\nroot = Card([Input("name", $v), Input("plain", "x")])'),
  e("reactive-assign", '$v = ""\nroot = Card([Input("name", $v = $value)])'),
  e("query-results", edgeCases.find((c) => c.name === "query-mutation").input, {
    queryResults: { users: { rows: [{ id: 1 }, { id: 2 }] }, save: { status: "idle" } },
  }),
  e(
    "each-actions",
    '$items = [{id: 1, t: "a"}, {id: 2, t: "b"}]\n$sel = 0\nroot = Card(@Each($items, it, Button(it.t, Action([@Set($sel, it.id), @ToAssistant("Pick " + it.t)]))))',
  ),
];

const evalFixtures = evalCases.map((c) => ({ ...c, expected: evaluateCase(c) }));

// ── Prompts ───────────────────────────────────────────────────────────────

const chatSpec = ui.openuiChatLibrary.toSpec();
const openuiSpec = ui.openuiLibrary.toSpec();
delete chatSpec.schema; // already in schemas.json

const tools = [
  "search_docs",
  {
    name: "list_tickets",
    description: "Open support tickets",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["open", "closed"] },
        limit: { type: "number" },
      },
      required: ["status"],
    },
    outputSchema: {
      type: "object",
      properties: {
        rows: { type: "array", items: { type: "object", properties: { id: { type: "string" } } } },
        total: { type: "integer" },
      },
    },
  },
  { name: "ping", inputSchema: {}, outputSchema: undefined },
];

const smallSpec = {
  components: {
    Box: { signature: "Box(children: (Text | Box)[])", description: "A box" },
    Text: { signature: 'Text(value: string, tone?: "a" | "b")' },
  },
};

// A slice of the chat library that still exercises ActionExpression,
// $binding, groups and ungrouped components, to keep variant fixtures small.
const sliceNames = [
  "Card",
  "TextContent",
  "Button",
  "Buttons",
  "Form",
  "FormControl",
  "Input",
  "Select",
  "SelectItem",
  "Table",
  "Col",
];
const sliceSpec = {
  root: chatSpec.root,
  components: Object.fromEntries(sliceNames.map((n) => [n, chatSpec.components[n]])),
  componentGroups: [
    {
      name: "Forms",
      components: ["Form", "FormControl", "Input", "Select", "SelectItem"],
      notes: ["- Forms note"],
    },
    { name: "Buttons", components: ["Button", "Buttons", "Missing"] },
  ],
};

const promptCases = [
  { name: "chat-default", spec: chatSpec },
  { name: "chat-options", spec: { ...chatSpec, ...ui.openuiChatPromptOptions } },
  { name: "openui-default", spec: openuiSpec },
  { name: "openui-options", spec: { ...openuiSpec, ...ui.openuiPromptOptions } },
  { name: "slice-bindings", spec: { ...sliceSpec, bindings: true } },
  {
    name: "slice-tools",
    spec: {
      ...sliceSpec,
      tools,
      toolExamples: ['x = Query("list_tickets", {status: "open"}, {rows: []})'],
    },
  },
  { name: "slice-tools-no-bindings", spec: { ...sliceSpec, tools, bindings: false } },
  {
    name: "slice-modes",
    spec: {
      ...sliceSpec,
      editMode: true,
      inlineMode: true,
      preamble: "Custom preamble.",
      additionalRules: ["Be brief"],
      examples: ["a = 1"],
    },
  },
  { name: "slice-no-groups", spec: { ...sliceSpec, componentGroups: undefined } },
  { name: "small-no-root", spec: smallSpec },
  { name: "small-tools-only", spec: { ...smallSpec, toolCalls: true, bindings: false } },
].map((c) => ({ ...c, expected: core.generatePrompt(c.spec) }));

const chatComponentSpecs = chatSpec;

// ── Edit mode ─────────────────────────────────────────────────────────────

const base = [
  'root = Card([title, body, $filter], "Report")',
  'title = TextContent("Q3", "large")',
  "body = Table([colA, colB])",
  'colA = Col("Region", ["EU", "US"])',
  'colB = Col("Revenue", [1, 2])',
  '$filter = "all"',
].join("\n");

const mergeCases = [
  { name: "empty-existing", existing: "", patch: 'root = Card([a])\na = TextContent("x")' },
  { name: "empty-patch", existing: base, patch: "  \n" },
  { name: "replace", existing: base, patch: 'title = TextContent("Q4", "large")' },
  {
    name: "add-referenced",
    existing: base,
    patch: 'root = Card([title, body, note])\nnote = Callout("info", "Hi")',
  },
  { name: "add-unreferenced", existing: base, patch: 'orphan = TextContent("never shown")' },
  { name: "delete", existing: base, patch: "body = null\nroot = Card([title])" },
  { name: "gc-after-replace", existing: base, patch: 'body = TextContent("no table")' },
  { name: "keeps-unused-state", existing: base, patch: "root = Card([title])\n$extra = 1" },
  { name: "root-deleted", existing: base, patch: "root = null" },
  { name: "fenced-patch", existing: base, patch: '```openui\ntitle = TextContent("Fenced")\n```' },
  {
    name: "multiline-and-strings",
    existing: base,
    patch:
      'body = Table([\n  colA,\n  colB\n])\ntitle = TextContent("a ) ] } \\" \' \\n", "large")',
  },
  { name: "single-quotes", existing: base, patch: "title = TextContent('it\\'s (fine')" },
  {
    name: "crlf",
    existing: base.replaceAll("\n", "\r\n"),
    patch: 'title = TextContent("CRLF")\r\n',
  },
  {
    name: "duplicate-existing",
    existing: `${base}\ntitle = TextContent("dup")`,
    patch: 'colA = Col("Area", [])',
  },
  { name: "delete-then-add", existing: base, patch: 'title = null\ntitle = TextContent("back")' },
  {
    name: "query-refs",
    existing:
      'root = Card([t])\nt = Table([c])\nc = Col("n", q.rows)\nq = Query("list", {}, {rows: []})',
    patch: 'c = Col("name", q.rows)',
  },
  {
    name: "custom-root",
    existing: 'main = Card([a])\na = TextContent("x")\nb = TextContent("y")',
    patch: 'a = TextContent("z")',
    rootId: "main",
  },
  { name: "unclosed-patch", existing: base, patch: 'title = TextContent("cut' },
  {
    name: "chat-example",
    existing: chatExamples[0].input,
    patch: 'header = CardHeader("Edited", "by a patch")',
  },
].map((c) => ({ ...c, expected: core.mergeStatements(c.existing, c.patch, c.rootId) }));

// ── Error hints ───────────────────────────────────────────────────────────

// What react-lang's onError reports for parser errors: lang-core's enrichErrors.
const chatNames = Object.keys(ui.openuiChatLibrary.components);
const errorCases = [
  ["unknown-component", 'root = Card([Mystery("a"), TextContent("b")])'],
  ["missing-required", "root = Card([TextContent()])"],
  ["null-required", "root = Card([TextContent(null)])"],
  ["inline-reserved", 'root = Card([TextContent(Query("get", {}))])'],
  ["excess-args", 'root = Card([CardHeader("a", "b", "c", "d")])'],
  ["type-mismatch", "root = Card([TextContent(42)])"],
  ["several", "root = Card([a, b])\na = Foo()\nb = Button()"],
].map(([name, input]) => ({
  name,
  input,
  expected: core.enrichErrors(parseWith("chat", input).meta.errors, chatSchema, chatNames),
}));

// ── Cloud config ──────────────────────────────────────────────────────────

const cloudLibrary = {
  root: "Card",
  components: { Card: { signature: "Card(children: Text[])" } },
  componentGroups: [{ name: "Layout", components: ["Card", "Text"], notes: ["- Note"] }],
  schema: {
    $defs: {
      Card: {
        properties: { children: { type: "array", items: { $ref: "#/$defs/Text" } } },
        required: ["children"],
      },
      Text: { properties: { value: { type: "string" } }, required: ["value"] },
    },
  },
};

const brokenLibrary = {
  root: "Missing",
  components: {},
  componentGroups: [{ name: "G", components: ["Card", "Nope"] }, { name: 1 }],
  schema: {
    $defs: {
      Card: {
        properties: {
          children: { type: "array", items: { $ref: "#/$defs/Gone" } },
          x: { $ref: "bad" },
        },
        required: ["children", "absent", 3],
      },
      Text: { properties: [] },
      Bad: "nope",
    },
  },
};

function cloudCase(name, spec) {
  try {
    return { name, spec, expected: core.generateSystemPrompt({ cloud: true, ...spec }) };
  } catch (error) {
    return { name, spec, error: error.message };
  }
}

const cloudCases = [
  cloudCase("built-in", {}),
  cloudCase("built-in-instructions", { instructions: "Answer in French." }),
  cloudCase("built-in-empty-options", { promptOptions: { preamble: "" } }),
  cloudCase("built-in-with-options", { promptOptions: { examples: [] } }),
  cloudCase("library", { library: cloudLibrary }),
  cloudCase("library-options", {
    library: cloudLibrary,
    promptOptions: {
      preamble: "Be brief.",
      additionalRules: ["One card"],
      examples: ["a = 1"],
      tools: ["x"],
      editMode: true,
    },
    instructions: "Extra.",
  }),
  cloudCase("library-empty-strings", {
    library: cloudLibrary,
    promptOptions: { preamble: "" },
    instructions: "",
  }),
  cloudCase("library-without-root", {
    library: { ...cloudLibrary, root: undefined, componentGroups: undefined },
  }),
  cloudCase("library-with-id", { library: { ...cloudLibrary, id: "lib-1" } }),
  cloudCase("broken-library", { library: brokenLibrary }),
  cloudCase("no-defs", { library: { components: {}, schema: { $defs: {} } } }),
  cloudCase("no-schema", { library: { root: "", components: {} } }),
];

// The chat library's Cloud config is ~80 KB, so only its digest is stored.
const chatCloudConfig = core.generateSystemPrompt({
  cloud: true,
  library: ui.openuiChatLibrary.toSpec(),
  promptOptions: ui.openuiChatPromptOptions,
});
const chatCloud = {
  length: chatCloudConfig.length,
  sha256: createHash("sha256").update(chatCloudConfig).digest("hex"),
};

// ── Cloud messages ────────────────────────────────────────────────────────

// react-ui doesn't export its sentinel parser, so read the source directly
// (Node strips the TypeScript types).
const sentinel = await import(join(packages, "react-ui", "src", "utils", "sentinelParser.ts"));

const messageInputs = [
  ["empty", ""],
  ["plain text", "Just some text"],
  ["content only", "]]>openui:content\nroot = Card([])"],
  [
    "content with header attrs",
    "]]>openui:content?thesys=true&libraryVersion=0.1.0\nroot = Card([])",
  ],
  ["content and context", ']]>openui:content\nroot = Card([])\n]]>openui:context\n[{"f":1}]'],
  ["context only", 'Hello\n]]>openui:context\n["User clicked: Go"]'],
  ["context then content", "]]>openui:context\n[1]\n]]>openui:content\nroot = X()"],
  ["last content wins", "]]>openui:content\nold\n]]>openui:content\nnew"],
  ["crlf separators", "]]>openui:content\r\nroot = X()\r\n]]>openui:context\r\n[1]"],
  ["end marker", "]]>openui:content\nroot = X()\n]]>openui:end"],
  ["end marker with attrs", "]]>openui:content\nroot = X()\n]]>openui:end?status=done"],
  ["text after end marker", "]]>openui:content\nroot = X()\n]]>openui:end\ntrailing"],
  ["end between sections", "]]>openui:content\na\n]]>openui:end\n]]>openui:context\n[1]"],
  ["two end markers", "]]>openui:content\na\n]]>openui:end\n]]>openui:end"],
  ["crlf before end", "]]>openui:content\na\r\n]]>openui:end"],
  ["partial tail one char", "]]>openui:content\nroot = X()\n]"],
  ["partial tail sentinel", "]]>openui:content\nroot = X()\n]]>openui:"],
  ["partial context marker", "]]>openui:content\nroot = X()\n]]>openui:cont"],
  ["partial end marker", "]]>openui:content\nroot = X()\n]]>openui:e"],
  ["bracket that isn't a marker", "]]>openui:content\nx = [1, 2]"],
  ["marker header without newline", "]]>openui:content"],
  ["markers on one line", "]]>openui:content]]>openui:context\n[1]"],
  ["emoji", ']]>openui:content\nroot = TextContent("🙂 hi")\n]]>openui:context\n["🎉"]'],
  ["legacy xml", '<content thesys="true">root = X()</content>\n<context>[{"a":1}]</context>'],
  ["legacy content only", "<content>root = X()</content>  "],
  ["legacy context only", 'text\n<context>["x"]</context>\n'],
  ["legacy unclosed", "<content>root = X()"],
  ["legacy text after context", "<context>[1]</context> more"],
];

const langSyntaxInputs = [
  "```openui-lang\nroot = X()\n```",
  "root = X()",
  "root=X()",
  "  root = X()",
  "intro\n\troot = X()",
  "intro\n\n  root\n= X()",
  "rooted = 1",
  "x root = 1",
  "Just text",
  "",
];

const artifactInputs = [
  ']]>openui:artifact {"artifact_id":"a1","type":"slides","name":"Deck","version":"2"}\nroot = X()',
  ']]>openui:artifact {"artifact_id":"a2","type":"presentation"}\nprogram',
  ']]>openui:artifact {"artifact_id":"a3","type":"report","name":""}',
  ']]>openui:artifact {"artifact_id":"","type":"report"}\nx',
  ']]>openui:artifact {"type":"report"}\nx',
  ']]>openui:artifact {"artifact_id":"a4","type":"video"}\nx',
  ']]>openui:artifact {"artifact_id":"a5","type":"report","version":7}\nx',
  "]]>openui:artifact not json\nx",
  "]]>openui:artifact []\nx",
  ']]>openui:artifact{"artifact_id":"a6","type":"report"}\nx',
  "]]>openui:content\nroot = X()",
];

const messageCases = {
  separate: messageInputs.map(([name, input]) => ({
    name,
    input,
    expected: sentinel.separateContentAndContext(input),
  })),
  langSyntax: langSyntaxInputs.map((input) => ({ input, expected: sentinel.hasLangSyntax(input) })),
  artifacts: artifactInputs.map((input) => ({
    input,
    expected: sentinel.parseArtifactSentinel(input),
  })),
  wrap: {
    content: sentinel.wrapContent("root = X()"),
    contentWithHeader: sentinel.wrapContentWithHeader(
      "root = X()",
      "]]>openui:content?thesys=true",
    ),
    contentWithoutHeader: sentinel.wrapContentWithHeader("root = X()", undefined),
    context: sentinel.wrapContext('[{"a":1}]'),
  },
};

// ── Chart number formats ─────────────────────────────────────────────────
//
// react-ui's axis and tooltip formatters, imported from source like
// sentinelParser. toLocaleString follows the machine's locale, so it's pinned
// to en-US here; the Swift tests format with the same locale.

const charts = join(packages, "react-ui", "src", "components", "Charts");
const { numberTickFormatter } = await import(join(charts, "utils", "styleUtils.ts"));
const { tooltipNumberFormatter } = await import(
  join(charts, "shared", "core", "PortalTooltip", "utils", "index.ts")
);
const toLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function (locales, options) {
  return toLocaleString.call(this, locales ?? "en-US", options);
};
const chartFormatCases = [
  0, 1, -1, 7, 0.5, 0.125, 1.005, 1.25, 12.345, -0.04, 0.005, 999, 999.99, 1000, 1250, 9999, 10000,
  15500, -2500, 99999.5, 100000, 123456, 999999, 1234567, -7654321, 2.5e9, 1e12, 15e12, 1.23456,
].map((value) => ({
  value,
  tick: numberTickFormatter(value),
  tooltip: tooltipNumberFormatter(value),
}));
Number.prototype.toLocaleString = toLocaleString;

// One case per line: still JSON and still diffable case by case, without a
// line for every value. Pretty-printed, the fixtures were most of the
// package's lines.
function fixtureJSON(data) {
  const array = Array.isArray(data);
  const lines = array
    ? data.map((item) => JSON.stringify(item))
    : Object.entries(data).map(
        ([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`,
      );
  return `${array ? "[" : "{"}\n${lines.join(",\n")}\n${array ? "]" : "}"}\n`;
}

const swiftUIFixtures = join(here, "..", "Tests", "OpenUISwiftUITests", "Fixtures");

function write(name, data, folder = fixtures) {
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, name), fixtureJSON(data));
}

write("schemas.json", Object.fromEntries(Object.entries(schemas)));
write("parser.json", parserCases);
write("streaming.json", streamingCases);
write("stream-set.json", setCases);
write("evaluation.json", evalFixtures);
write("prompts.json", promptCases);
write("merge.json", mergeCases);
write("errors.json", errorCases);
write("cloud.json", { cases: cloudCases, chat: chatCloud });
write("messages.json", messageCases);
write("chat-spec.json", chatComponentSpecs);
write("openui-spec.json", openuiSpec);
// The libraries' examples, for the SwiftUI renderer's end-to-end render
// tests, and react-ui's chart number formats.
write(
  "chat-examples.json",
  chatExamples.map(({ name, input }) => ({ name, input })),
  swiftUIFixtures,
);
write(
  "openui-examples.json",
  openuiExamples.map(({ name, input }) => ({ name, input })),
  swiftUIFixtures,
);
write("chart-formats.json", chartFormatCases, swiftUIFixtures);

console.log(
  `wrote ${parserCases.length} parser, ${streamingCases.length} streaming, ${setCases.length} set, ${evalFixtures.length} evaluation, ${promptCases.length} prompt, ${mergeCases.length} merge, ${errorCases.length} error, ${cloudCases.length} cloud, ${messageCases.separate.length} message, ${chartFormatCases.length} chart format fixtures`,
);
