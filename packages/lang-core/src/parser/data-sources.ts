import { walkAST, type ASTNode } from "./ast";
import { getCallDefs, RESERVED_CALLS } from "./builtins";
import { parsedStatements } from "./parser";
import { serializeASTNode } from "./serialize";
import type { ParseResult } from "./types";

type Call = Extract<ASTNode, { k: "Comp" }>;

/** Where a value comes from. */
export interface Sources {
  /** Query statements it reads, directly or through other statements. */
  queries: string[];
  /** Statements between it and those queries, e.g. `now` in `now = @First(totals.rows)`. */
  via: string[];
  /** `$variables` it, or a statement it reads, uses. */
  state: string[];
}

/** A prop's sources. No queries, state or components: written in the program. */
export interface PropSources extends Sources {
  /** The argument as written, e.g. `now.revenue`. */
  expr: string;
  /** The components written in it, by id: its children, which have their own sources. */
  components: string[];
  /** Its value, when it is written as a string, number, boolean or null, e.g. a title. */
  value?: string | number | boolean | null;
}

/** What a component's own props read; its child components are listed under their own ids. */
export interface ComponentSources extends Sources {
  /** The library component, e.g. `Kpi`. */
  typeName: string;
  /** By prop, named as in the library. */
  props: Record<string, PropSources>;
}

/** Where a program's data comes from. */
export interface ProgramSources {
  /** Every component the program renders, by id: a statement's name, or `name.n` inside it. */
  components: Record<string, ComponentSources>;
  /** The text of each statement in a `via`, e.g. `now: "@First(totals.rows)"`. */
  formulas: Record<string, string>;
}

const cache = new WeakMap<ParseResult, ProgramSources | null>();

/**
 * Where a program's data comes from, for a "where did this come from" view: each component and
 * prop's queries, the statements in between and the `$variables` read.
 * A Mutation or an action is not a source. Component ids are positions in this parse, not stable
 * keys. Null when `result` is not one the parser returned.
 */
export function dataSources(result: ParseResult): ProgramSources | null {
  if (!cache.has(result)) cache.set(result, build(result));
  return cache.get(result)!;
}

function build(result: ParseResult): ProgramSources | null {
  const parsed = parsedStatements.get(result);
  if (!parsed) return null;
  const { statements } = parsed;
  const calls = getCallDefs(parsed.cat);
  const text = (node: ASTNode) => serializeASTNode(node, calls);

  const isComponent = (node: Call) =>
    !node.fn && !calls.has(node.name) && !Object.hasOwn(RESERVED_CALLS, node.name);
  const isAction = (node: ASTNode) =>
    node.k === "Comp" && (node.name === "Action" || calls.get(node.name)?.kind === "action");
  const isLoop = (node: Call) => {
    const def = calls.get(node.name);
    return def?.kind === "function" && !!def.lazy && node.args.length >= 3;
  };

  // A statement's value through aliases (`card = other`).
  const resolve = (name: string) => {
    let target = statements.get(name);
    for (const seen = new Set([name]); target?.k === "Ref" && !seen.has(target.n);) {
      seen.add(target.n);
      target = statements.get(target.n);
    }
    return target;
  };
  // Whether a statement is a component call, or an alias of one.
  const renders = (name: string) => {
    const target = resolve(name);
    return target?.k === "Comp" && isComponent(target);
  };

  // What an argument reads, and the components written in it.
  const collect = (from: ASTNode, bound: Bindings) => {
    const queries = new Set<string>();
    const via = new Set<string>();
    const state = new Set<string>();
    const components = new Set<string>();
    // Whether a statement leads to a query; set to false first so a cycle stops.
    const reaches = new Map<string, boolean>();

    const follow = (name: string): boolean => {
      const known = reaches.get(name);
      if (known !== undefined) return known;
      reaches.set(name, false);
      const target = statements.get(name);
      let found = false;
      if (target?.k === "Comp" && target.name === RESERVED_CALLS.Query) {
        queries.add(name);
        target.args.slice(0, 2).forEach((arg) => walk(arg, new Set(), NO_BINDINGS));
        found = true;
      } else if (target && !(target.k === "Comp" && target.name === RESERVED_CALLS.Mutation)) {
        // Another statement: its data, and the components in it (a named component, or a list).
        found = walk(target, new Set(), NO_BINDINGS);
        if (found) via.add(name);
      }
      reaches.set(name, found);
      return found;
    };

    // `scope` holds names an `@Each` binds, which shadow statements of the same name. A component
    // call is a child: listed, not read through.
    const walk = (start: ASTNode, scope: ReadonlySet<string>, binds: Bindings): boolean => {
      let found = false;
      const skipped = new Set<ASTNode>();
      const skip = (node: ASTNode) => walkAST(node, (n) => void skipped.add(n));
      walkAST(start, (node) => {
        if (skipped.has(node)) return;
        if (isAction(node)) return skip(node);
        if (node.k === "Comp" && isComponent(node)) {
          const id = node.componentId;
          if (id) components.add(id);
          return skip(node);
        }
        if (node.k === "Comp" && isLoop(node)) {
          const name = boundName(node.args[1]);
          const inner = name ? new Set([...scope, name]) : scope;
          // The list is read outside the loop, so its own name does not shadow it.
          node.args.forEach((arg, i) => {
            if (i !== 1 && walk(arg, i === 0 ? scope : inner, binds)) found = true;
          });
          return skip(node);
        }
        if (node.k === "StateRef" && Object.hasOwn(result.stateDeclarations, node.n)) {
          state.add(node.n);
        }
        if (node.k !== "Ref" || scope.has(node.n)) return;
        // A component statement, or an alias of one, renders under the name written here.
        if (!binds.has(node.n) && renders(node.n)) return void components.add(node.n);
        const binding = binds.get(node.n);
        if (binding ? walk(binding.list, new Set(), binding.outer) : follow(node.n)) found = true;
      });
      return found;
    };

    walk(from, new Set(), bound);
    return { queries: [...queries], via: [...via], state: [...state], components: [...components] };
  };

  const components: Record<string, ComponentSources> = {};
  const add = (node: Call, id: string, bound: Bindings) => {
    // Positional arguments map to props in the library's order.
    const names = parsed.cat?.get(node.name)?.params.map((p) => p.name) ?? [];
    const props: Record<string, PropSources> = {};
    names.forEach((name, i) => {
      const arg = node.args[i];
      if (!arg) return;
      props[name] = { ...collect(arg, bound), expr: text(arg) };
      if ("v" in arg || arg.k === "Null") props[name].value = "v" in arg ? arg.v : null;
    });
    const union = (key: keyof Sources) => [
      ...new Set(Object.values(props).flatMap((prop) => prop[key])),
    ];
    components[id] = {
      typeName: node.name,
      queries: union("queries"),
      via: union("via"),
      state: union("state"),
      props,
    };
  };

  // Each component call once, with the names the `@Each` loops around it bind.
  const visit = (start: ASTNode, bound: Bindings) => {
    const skipped = new Set<ASTNode>();
    walkAST(start, (node) => {
      if (skipped.has(node)) return;
      if (node.k !== "Comp") return;
      if (isLoop(node)) {
        const name = boundName(node.args[1]);
        const inner = name ? new Map(bound).set(name, { list: node.args[0], outer: bound }) : bound;
        node.args.forEach((arg, i) => i !== 1 && visit(arg, i === 0 ? bound : inner));
        return walkAST(node, (n) => void skipped.add(n));
      }
      const id = isComponent(node) ? node.componentId : undefined;
      if (id && !components[id]) add(node, id, bound);
    });
  };

  try {
    const orphaned = new Set(result.meta.orphaned);
    const isCall = (node: ASTNode | undefined, name: string) =>
      node?.k === "Comp" && node.name === name;
    for (const [name, expr] of statements) {
      const data = isCall(expr, RESERVED_CALLS.Query) || isCall(expr, RESERVED_CALLS.Mutation);
      if (!orphaned.has(name) && !data) visit(expr, NO_BINDINGS);
    }
    // `card = other` renders `other`'s component under the name `card`.
    for (const [name, expr] of statements) {
      const target = resolve(name);
      if (target !== expr && target?.k === "Comp" && target.componentId) {
        const entry = components[target.componentId];
        if (entry) components[name] = entry;
      }
    }
    const formulas: Record<string, string> = {};
    for (const entry of Object.values(components)) {
      entry.via.forEach((name) => (formulas[name] ??= text(statements.get(name)!)));
    }
    return { components, formulas };
  } catch (error) {
    // A chain of statements too long to walk.
    if (error instanceof RangeError) return null;
    throw error;
  }
}

type Bindings = ReadonlyMap<string, { list: ASTNode; outer: Bindings }>;
const NO_BINDINGS: Bindings = new Map();

/** The name an `@Each` binds: `"r"` or `r`. */
function boundName(arg: ASTNode): string | undefined {
  return arg.k === "Ref" ? arg.n : arg.k === "Str" ? arg.v : undefined;
}
