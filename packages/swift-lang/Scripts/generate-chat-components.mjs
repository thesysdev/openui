// Regenerates Sources/OpenUILang/ChatComponents.swift and OpenUIComponents.swift
// from openuiChatLibrary and openuiLibrary in @openuidev/react-ui, so the Swift
// libraries can't drift from the web ones.
//
//   pnpm run build:packages
//   node packages/swift-lang/Scripts/generate-chat-components.mjs
//
// The output is formatted with `swift format`. LibraryComponentsTests checks
// the result against the fixtures from generate-fixtures.mjs.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packages = join(here, "..", "..");
const sources = join(here, "..", "Sources", "OpenUILang");

// Code generation is not product usage, so keep lang-core's telemetry off.
process.env.OPENUI_TELEMETRY_DISABLED = "1";

const core = await import(join(packages, "lang-core", "dist", "index.mjs"));
const ui = await import(join(packages, "react-ui", "dist", "genui-lib", "index.mjs"));

// The library being generated; set by generate() below.
let library;
let known;

// ── Swift literals ────────────────────────────────────────────────────────

function swiftString(text) {
  const escaped = [...text]
    .map((c) => {
      if (c === "\\") return "\\\\";
      if (c === '"') return '\\"';
      if (c === "\n") return "\\n";
      if (c === "\r") return "\\r";
      if (c === "\t") return "\\t";
      const code = c.codePointAt(0);
      return code < 0x20 ? `\\u{${code.toString(16)}}` : c;
    })
    .join("");
  return `"${escaped}"`;
}

function swiftValue(value) {
  if (value === null) return ".null";
  if (Array.isArray(value)) return `[${value.map(swiftValue).join(", ")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value).map(([k, v]) => `${swiftString(k)}: ${swiftValue(v)}`);
    return `[${entries.join(", ") || ":"}]`;
  }
  return typeof value === "string" ? swiftString(value) : JSON.stringify(value);
}

// ── JSON Schema → PropType ────────────────────────────────────────────────

const isFormRules = (s) =>
  s?.type === "object" && s.properties && "minLength" in s.properties && "pattern" in s.properties;
const isActionExpression = (s) =>
  Array.isArray(s?.anyOf) &&
  s.anyOf.length === 3 &&
  s.anyOf[0].properties?.type?.const === "open_url";

function propType(s) {
  if (isFormRules(s)) return "formRules";
  if (isActionExpression(s)) return ".actionExpression";
  if (s.$ref) return `.component(${swiftString(s.$ref.split("/").pop())})`;
  if (s.anyOf) {
    const options = s.anyOf.every((o) => o.$ref)
      ? s.anyOf.filter((o) => known.has(o.$ref.split("/").pop()))
      : s.anyOf;
    return `.union([${options.map(propType).join(", ")}])`;
  }
  if (s.const !== undefined) return `.literal(${swiftValue(s.const)})`;
  switch (s.type) {
    case "string":
      return s.enum ? `.enumeration([${s.enum.map(swiftString).join(", ")}])` : ".string";
    case "number":
    case "integer":
      return ".number";
    case "boolean":
      return ".boolean";
    case "array": {
      const minItems = s.minItems === undefined ? "" : `, minItems: ${s.minItems}`;
      return `.array(${propType(s.items)}${minItems})`;
    }
    case "object":
      if (s.propertyNames) return `.record(${propType(s.additionalProperties ?? {})})`;
      return `.object([${props(s).join(", ")}])`;
    default:
      return ".any";
  }
}

function props(schema, component) {
  const required = schema.required ?? [];
  const shape = component ? library.components[component].props.shape : {};
  return Object.entries(schema.properties ?? {}).map(([key, s]) => {
    const args = [swiftString(key), propType(s)];
    if ("default" in s) args.push(`.defaulted(${swiftValue(s.default)})`);
    else if (!required.includes(key)) args.push(".optional");
    if (shape[key] && core.isReactiveSchema(shape[key])) args.push("binding: true");
    if (s.description) args.push(`description: ${swiftString(s.description)}`);
    return `Prop(${args.join(", ")})`;
  });
}

// ── Output ────────────────────────────────────────────────────────────────

const lowerFirst = (name) => name[0].toLowerCase() + name.slice(1);
const swiftLines = (items) => items.map((item) => `    ${swiftString(item)},`).join("\n");

/// Writes `enumName` with a schema per component, the groups and the prompt
/// options. Components defined exactly as in `shared` (same JSON Schema and
/// bindings) reuse its schemas instead of repeating them.
function generate({ lib, promptOptions, enumName, docs, shared }) {
  library = lib;
  const defs = lib.toJSONSchema().$defs;
  const spec = lib.toSpec();
  const names = Object.keys(spec.components);
  known = new Set(names);
  const reused = (name) => {
    if (!shared?.lib.components[name]) return false;
    const other = shared.lib.toJSONSchema().$defs[name];
    const reactive = (l) =>
      Object.entries(l.components[name].props.shape)
        .filter(([, s]) => core.isReactiveSchema(s))
        .map(([key]) => key)
        .join();
    return (
      JSON.stringify(other) === JSON.stringify(defs[name]) && reactive(shared.lib) === reactive(lib)
    );
  };

  const schemas = names
    .filter((name) => !reused(name))
    .map(
      (name) => `  public static let ${lowerFirst(name)} = ComponentSchema(
    ${swiftString(name)}, description: ${swiftString(defs[name].description ?? "")},
    props: [${props(defs[name], name).join(", ")}])
`,
    );
  const groups = spec.componentGroups.map((group) => {
    const notes = group.notes?.length
      ? `, notes: [${group.notes.map(swiftString).join(", ")}]`
      : "";
    return `    ComponentGroup(name: ${swiftString(group.name)}, components: [${group.components.map(swiftString).join(", ")}]${notes}),`;
  });
  const all = names.map(
    (name) => `    ${reused(name) ? `${shared.enumName}.` : ""}${lowerFirst(name)},`,
  );
  // A library reusing another's schemas aliases its rules object only when one
  // of its own schemas has form rules.
  const formRules = shared
    ? schemas.some((schema) => /\bformRules\b/.test(schema))
      ? `  /// The form \`rules\` object, for schemas that aren't shared.
  static let formRules = ${shared.enumName}.formRules

`
      : ""
    : `  /// The structured \`rules\` object shared by form fields.
  public static let formRules: PropType = .object(
    ["required", "email", "url", "numeric"].map { Prop($0, .boolean, .optional) }
      + ["min", "max", "minLength", "maxLength"].map { Prop($0, .number, .optional) }
      + [Prop("pattern", .string, .optional)])

`;
  const output = join(sources, `${enumName}.swift`);
  writeFileSync(
    output,
    `// Generated by Scripts/generate-chat-components.mjs from ${docs.source} in
// @openuidev/react-ui. Don't edit by hand.
// swift-format-ignore-file: LineLength

${docs.comment}
public enum ${enumName} {
${formRules}${schemas.join("\n")}
  /// Prompt groups and notes, as in ${docs.source}.
  public static let groups: [ComponentGroup] = [
${groups.join("\n")}
  ]

  /// Every schema, in library order.
  public static let all: [ComponentSchema] = [
${all.join("\n")}
  ]

  /// Example responses for the prompt (\`${docs.examples}\`).
  public static let examples: [String] = [
${swiftLines(promptOptions.examples)}
  ]

  /// Extra prompt rules for this library (\`${docs.rules}\`).
  public static let additionalRules: [String] = [
${swiftLines(promptOptions.additionalRules)}
  ]

  /// The prompt options react-ui pairs with this library (\`${docs.options}\`).
  public static let promptOptions = PromptOptions(
    additionalRules: additionalRules, examples: examples)
}
`,
  );
  execFileSync("swift", ["format", "-i", output]);
  console.log(
    `wrote ${names.length} ${docs.source} schemas to ${output}` +
      (shared ? ` (${names.filter(reused).length} shared with ${shared.enumName})` : ""),
  );
}

const chat = {
  lib: ui.openuiChatLibrary,
  promptOptions: ui.openuiChatPromptOptions,
  enumName: "ChatComponents",
  docs: {
    source: "openuiChatLibrary",
    examples: "openuiChatExamples",
    rules: "openuiChatAdditionalRules",
    options: "openuiChatPromptOptions",
    comment: `/// Schemas for the OpenUI chat library. Names, prop order, types and
/// descriptions match \`openuiChatLibrary\` in @openuidev/react-ui, so a backend
/// that prompts with either library produces responses both can render.
///
/// The schemas live in \`OpenUILang\`, without SwiftUI, so a server can build
/// the chat prompt or Cloud config for them too.`,
  },
};
generate(chat);
generate({
  lib: ui.openuiLibrary,
  promptOptions: ui.openuiPromptOptions,
  enumName: "OpenUIComponents",
  shared: chat,
  docs: {
    source: "openuiLibrary",
    examples: "openuiExamples",
    rules: "openuiAdditionalRules",
    options: "openuiPromptOptions",
    comment: `/// Schemas for react-ui's general OpenUI library, \`openuiLibrary\`: the chat
/// library's components without the chat-only follow-ups and sections, plus
/// \`Stack\` (the root) and \`Modal\`, with \`Card\` taking Stack's layout props.
/// Components both libraries define the same way are \`ChatComponents\`'
/// schemas.`,
  },
});
