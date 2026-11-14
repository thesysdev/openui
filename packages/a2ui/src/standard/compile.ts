import {
  autoClose,
  parseExpression,
  split,
  tokenize,
  type ASTNode,
  type LibraryJSONSchema,
} from "@openuidev/lang-core";
import { BASIC_CATALOG_FUNCTIONS, readCatalog, type CatalogInfo } from "./catalog";

/**
 * Compiles OpenUI Lang, restricted to what an A2UI catalog can express, into
 * standard A2UI messages: component JSON objects that any A2UI renderer reads.
 *
 *   id = Component(arg, ...)   -> a component in `updateComponents`
 *   $name = literal            -> a value in `updateDataModel` at `/name`
 *   $name, $user.email         -> a data binding `{ path: "/user/email" }`
 *   @event({ key: $value })    -> an action `{ event: { name, context } }`
 *   @formatDate($d, "MMM d")   -> a function call `{ call, args }`
 *
 * Statements are parsed by `@openuidev/lang-core`. Anything outside this
 * profile (built-in functions, ternaries, comparisons, Query/Mutation) is
 * reported as an error instead of being sent to the renderer.
 */

export type A2UIStandardVersion = "v0.9" | "v1.0";

export interface A2UIComponent {
  id: string;
  component: string;
  [prop: string]: unknown;
}

export type A2UIStandardMessage =
  | { version: A2UIStandardVersion; createSurface: { surfaceId: string; catalogId: string } }
  | {
      version: A2UIStandardVersion;
      updateComponents: { surfaceId: string; components: A2UIComponent[] };
    }
  | {
      version: A2UIStandardVersion;
      updateDataModel: { surfaceId: string; path: string; value: unknown };
    };

export interface A2UICompileError {
  /** The statement the error belongs to, or "" for the whole program. */
  statementId: string;
  message: string;
}

export interface A2UICompileOptions {
  /** The OpenUI library describing the A2UI catalog, as `library.toJSONSchema()`. */
  schema: LibraryJSONSchema;
  /** Catalog functions and their positional arguments. Defaults to the Basic Catalog's. */
  functions?: Readonly<Record<string, readonly string[]>>;
}

export interface A2UICompiledProgram {
  components: A2UIComponent[];
  /** Top-level data model values, by `$variable` name without the `$`. */
  data: Record<string, unknown>;
  errors: A2UICompileError[];
}

class ProfileError extends Error {}

/** Removes a surrounding Markdown code fence, if the model added one. */
function stripCodeFence(source: string): string {
  return source.replace(/^\s*```[\w-]*\s*\n/, "").replace(/\n?```\s*$/, "");
}

/** Compiles a complete OpenUI Lang program into A2UI components and data. */
export function compileToA2UI(source: string, options: A2UICompileOptions): A2UICompiledProgram {
  return compileWith(
    source,
    readCatalog(options.schema, options.functions ?? BASIC_CATALOG_FUNCTIONS),
  );
}

function compileWith(source: string, catalog: CatalogInfo): A2UICompiledProgram {
  // Keyed by id: when a statement is written twice, the later one wins.
  const components = new Map<string, A2UIComponent>();
  const data: Record<string, unknown> = {};
  const errors: A2UICompileError[] = [];

  // Parse every statement first, so that a named list or object (`opts = [...]`)
  // can be inlined wherever it is used, before or after its definition.
  const statements: { id: string; expr?: ASTNode; error?: unknown }[] = [];
  const values = new Map<string, ASTNode>();
  const componentIds = new Set<string>();
  for (const stmt of split(tokenize(stripCodeFence(source)))) {
    try {
      const expr = parseExpression(stmt.tokens);
      statements.push({ id: stmt.id, expr });
      if (stmt.id.startsWith("$")) continue;
      if (expr.k === "Comp" && !expr.fn) componentIds.add(stmt.id);
      else values.set(stmt.id, expr);
    } catch (error) {
      statements.push({ id: stmt.id, error });
    }
  }

  const program: Program = { catalog, values, componentIds };
  for (const { id, expr, error } of statements) {
    try {
      if (error) throw error;
      if (id.startsWith("$")) {
        data[id.slice(1)] = toLiteral(expr!);
      } else if (componentIds.has(id)) {
        const call = expr as Extract<ASTNode, { k: "Comp" }>;
        for (const c of toComponents(id, call, program)) components.set(c.id, c);
      }
      // Other statements are values, inlined where they are referenced.
    } catch (err) {
      errors.push({ statementId: id, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return { components: [...components.values()], data, errors };
}

export interface A2UIStreamOptions extends A2UICompileOptions {
  surfaceId: string;
  /** The catalog id sent in `createSurface`. */
  catalogId: string;
  /** The A2UI protocol version of the messages. Defaults to "v1.0". */
  version?: A2UIStandardVersion;
}

/**
 * Compiles a program as it streams in. Each call to `push` takes the full text
 * so far and returns the messages for statements that are new or changed since
 * the previous call. Only complete lines are compiled, so a half-written
 * statement is never sent to the renderer.
 */
export function createA2UIStream(options: A2UIStreamOptions) {
  const { surfaceId, catalogId, version = "v1.0" } = options;
  const catalog = readCatalog(options.schema, options.functions ?? BASIC_CATALOG_FUNCTIONS);
  const sentComponents = new Map<string, string>();
  const sentData = new Map<string, string>();
  let started = false;

  function diff(program: A2UICompiledProgram): A2UIStandardMessage[] {
    const messages: A2UIStandardMessage[] = [];
    if (!started) {
      started = true;
      messages.push({ version, createSurface: { surfaceId, catalogId } });
    }

    // Data first, so components never render against a missing binding.
    for (const [name, value] of Object.entries(program.data)) {
      const json = JSON.stringify(value);
      if (sentData.get(name) === json) continue;
      sentData.set(name, json);
      messages.push({ version, updateDataModel: { surfaceId, path: `/${name}`, value } });
    }

    const changed = program.components.filter((c) => {
      const json = JSON.stringify(c);
      if (sentComponents.get(c.id) === json) return false;
      sentComponents.set(c.id, json);
      return true;
    });
    if (changed.length) {
      messages.push({ version, updateComponents: { surfaceId, components: changed } });
    }
    return messages;
  }

  return {
    push(text: string): A2UIStandardMessage[] {
      const complete = text.slice(0, text.lastIndexOf("\n") + 1);
      // A statement can span lines; wait until every bracket and string is closed.
      if (!complete.trim() || autoClose(stripCodeFence(complete)).wasIncomplete) return [];
      return diff(compileWith(complete, catalog));
    },
    /** Compiles whatever is left once the model has finished. */
    finish(text: string): { messages: A2UIStandardMessage[]; errors: A2UICompileError[] } {
      const program = compileWith(text, catalog);
      return { messages: diff(program), errors: program.errors };
    },
  };
}

// ─── Statements ──────────────────────────────────────────────────────────────

/** The program's catalog, named values and component ids, for resolving references. */
interface Program {
  catalog: CatalogInfo;
  values: Map<string, ASTNode>;
  componentIds: Set<string>;
}

/**
 * Converts one component call into A2UI components. Components written inline
 * (`Button(Text("Go"), ...)`) are hoisted into their own components with
 * generated ids, because A2UI refers to children by id.
 */
function toComponents(
  id: string,
  call: Extract<ASTNode, { k: "Comp" }>,
  program: Program,
): A2UIComponent[] {
  const props = program.catalog.props.get(call.name);
  if (!props) throw new ProfileError(`${call.name} is not in the catalog`);
  if (call.args.length > props.length) {
    throw new ProfileError(`${call.name} takes ${props.length} arguments, got ${call.args.length}`);
  }

  const hoisted: A2UIComponent[] = [];
  const hoist = (node: Extract<ASTNode, { k: "Comp" }>, path: string): string => {
    const childId = `${id}_${path}`;
    hoisted.push(...toComponents(childId, node, program));
    return childId;
  };

  const component: A2UIComponent = { id, component: call.name };
  call.args.forEach((arg, i) => {
    if (arg.k === "Null") return; // a skipped optional argument
    const prop = props[i]!;
    // The renderer rejects a component whose enum prop has an unknown value, so
    // report it here, by name, instead of sending the component.
    const allowed = program.catalog.enums.get(call.name)?.get(prop);
    if (allowed && arg.k === "Str" && !allowed.includes(arg.v)) {
      throw new ProfileError(`${call.name} ${prop} "${arg.v}" is not in the catalog`);
    }
    const childSlot = program.catalog.childProps.get(call.name)?.has(prop) ?? false;
    component[prop] = toValue(arg, { hoist, program, childSlot }, String(i));
  });
  return [component, ...hoisted];
}

// ─── Values ──────────────────────────────────────────────────────────────────

interface Scope {
  /** Turns an inline component into its own component and returns its id. */
  hoist: (node: Extract<ASTNode, { k: "Comp" }>, path: string) => string;
  program: Program;
  /** Whether the value is a prop that holds component ids. */
  childSlot: boolean;
}

function toValue(node: ASTNode, scope: Scope, path: string): unknown {
  switch (node.k) {
    case "Str":
    case "Num":
    case "Bool":
      return node.v;
    case "Null":
      return null;
    case "Ref": {
      // A named list or object is inlined; a component is referred to by its id.
      const value = scope.program.values.get(node.n);
      if (value) return toValue(value, scope, path);
      if (scope.childSlot || scope.program.componentIds.has(node.n)) return node.n;
      throw new ProfileError(`${node.n} is not defined`);
    }
    case "Arr":
      return node.els.map((el, i) => toValue(el, scope, `${path}_${i}`));
    case "Obj":
      return Object.fromEntries(
        node.entries.map(([key, value]) => [key, toValue(value, scope, `${path}_${key}`)]),
      );
    case "StateRef":
    case "Member":
    case "Index":
      return { path: toPointer(node) };
    case "BinOp":
      if (node.op === "+") {
        return { call: "formatString", args: { value: toTemplate(node) } };
      }
      throw new ProfileError(`the "${node.op}" operator has no A2UI equivalent`);
    case "Comp":
      // `@formatDate(...)` calls a catalog function; any other `@name(...)` is an event.
      if (node.fn && scope.program.catalog.functions.has(node.name)) {
        return toFunctionCall(node, scope, path);
      }
      if (node.fn) return toAction(node, scope, path);
      return scope.hoist(node, path);
    default:
      throw new ProfileError(`${describe(node)} has no A2UI equivalent`);
  }
}

/** `@submit({ email: $email })` -> `{ event: { name: "submit", context: { email: { path: "/email" } } } }` */
function toAction(node: Extract<ASTNode, { k: "Comp" }>, scope: Scope, path: string) {
  const [context, ...rest] = node.args;
  if (rest.length || (context && context.k !== "Obj")) {
    throw new ProfileError(`@${node.name} takes one optional object of context values`);
  }
  const event: { name: string; context?: unknown } = { name: node.name };
  if (context) event.context = toValue(context, scope, path);
  return { event };
}

/** `@formatDate($event.date, "MMM d")` -> `{ call: "formatDate", args: { value: { path: "/event/date" }, format: "MMM d" } }` */
function toFunctionCall(node: Extract<ASTNode, { k: "Comp" }>, scope: Scope, path: string) {
  const names = scope.program.catalog.functions.get(node.name)!;
  if (node.args.length > names.length) {
    throw new ProfileError(`${node.name} takes ${names.length} arguments, got ${node.args.length}`);
  }
  const args: Record<string, unknown> = {};
  node.args.forEach((arg, i) => {
    if (arg.k !== "Null") args[names[i]!] = toValue(arg, scope, `${path}_${i}`);
  });
  return { call: node.name, args };
}

/** `$user.address.city` -> `/user/address/city`; `$items[0].name` -> `/items/0/name` */
function toPointer(node: ASTNode): string {
  switch (node.k) {
    case "StateRef":
      return `/${node.n.slice(1)}`;
    case "Member":
      return `${toPointer(node.obj)}/${node.field}`;
    case "Index":
      if (node.index.k !== "Num" && node.index.k !== "Str") {
        throw new ProfileError("an index must be a number or a string");
      }
      return `${toPointer(node.obj)}/${node.index.v}`;
    default:
      throw new ProfileError(`${describe(node)} cannot be used as a data path`);
  }
}

/** `"Hi, " + $user.name + "!"` -> `"Hi, ${/user/name}!"` */
function toTemplate(node: ASTNode): string {
  switch (node.k) {
    case "BinOp":
      if (node.op !== "+") break;
      return toTemplate(node.left) + toTemplate(node.right);
    case "Str":
      return node.v.replaceAll("${", "\\${");
    case "Num":
    case "Bool":
      return String(node.v);
    case "StateRef":
    case "Member":
    case "Index":
      return "${" + toPointer(node) + "}";
  }
  throw new ProfileError(`only strings and $variables can be joined with "+"`);
}

/** The value of a `$variable` declaration, which must be plain JSON. */
function toLiteral(node: ASTNode): unknown {
  switch (node.k) {
    case "Str":
    case "Num":
    case "Bool":
      return node.v;
    case "Null":
      return null;
    case "Arr":
      return node.els.map(toLiteral);
    case "Obj":
      return Object.fromEntries(node.entries.map(([key, value]) => [key, toLiteral(value)]));
    case "UnaryOp":
      if (node.op === "-" && node.operand.k === "Num") return -node.operand.v;
  }
  throw new ProfileError(
    "a $variable must be set to a plain value (string, number, list or object)",
  );
}

function describe(node: ASTNode): string {
  switch (node.k) {
    case "Ternary":
      return "a ternary (? :)";
    case "UnaryOp":
      return `the "${node.op}" operator`;
    case "Assign":
      return "an assignment";
    case "RuntimeRef":
      return "Query/Mutation";
    default:
      return `a ${node.k} expression`;
  }
}
