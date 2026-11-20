import { walkAST, type ASTNode } from "./ast";
import { getCallDefs, RESERVED_CALLS } from "./builtins";
import { parsedStatements } from "./parser";
import { serializeASTNode } from "./serialize";
import type { ParseResult } from "./types";

/** Where a value comes from. */
interface Sources {
  /** Query statements it reads, directly or through other statements. */
  queries: string[];
  /** Statements between it and those queries, e.g. `latest` in `latest = @Last(weekly.rows)`. */
  via: string[];
  /** `$variables` it, or a statement it reads, uses. */
  state: string[];
}

/** A prop's sources, with its expression. */
interface PropSources extends Sources {
  /** The argument as written, e.g. `now.revenue`. */
  expr: string;
}

/**
 * Find the queries a statement's value is read from, for a "where did this come from" view.
 * For a component, `props` gives the same for each prop; one with no queries and no state is
 * written in the program (or reads a Mutation result). Inline child components count toward
 * the statement. A named one does not (ask for it by its name), nor does a Mutation or an
 * action. A query counts what its tool name and arguments read.
 *
 * `id` is a statement's name, or an inline component's `inlineId` (`name.n`): then only that
 * component counts, and a name an `@Each` binds reads the list it iterates. Null when `result`
 * is not one the parser returned, or has no such statement or component.
 */
export function dataSources(
  result: ParseResult,
  id: string,
): (Sources & { formulas: Record<string, string>; props?: Record<string, PropSources> }) | null {
  const parsed = parsedStatements.get(result);
  if (!parsed) return null;
  const { statements } = parsed;
  const calls = getCallDefs(parsed.cat);
  const dot = id.lastIndexOf(".");
  const statementId = statements.has(id) || dot < 0 ? id : id.slice(0, dot);
  const statement = statements.get(statementId);
  if (!statement) return null;
  let own: ASTNode | undefined = statement;
  // Names `@Each` binds around an inline component: the list each iterates, read with the
  // names bound outside that loop.
  let bound: Bindings = new Map();
  if (statementId !== id) {
    own = undefined;
    walkAST(statement, (node) => {
      if (node.k === "Comp" && node.inlineId === id) own = node;
      const def = node.k === "Comp" ? calls.get(node.name) : undefined;
      if (node.k !== "Comp" || def?.kind !== "function" || !def.lazy || node.args.length < 3)
        return;
      const name = boundName(node.args[1]);
      const encloses = node.args.slice(2).some((arg) => {
        let found = false;
        walkAST(arg, (inner) => {
          if (inner.k === "Comp" && inner.inlineId === id) found = true;
        });
        return found;
      });
      // Outer loops are visited first, so an inner one binding the same name wins.
      if (name && encloses) bound = new Map(bound).set(name, { list: node.args[0], outer: bound });
    });
    if (!own) return null;
  }

  const isComponent = (node: ASTNode) =>
    node.k === "Comp" &&
    !node.fn &&
    !calls.has(node.name) &&
    !Object.hasOwn(RESERVED_CALLS, node.name);
  const isAction = (node: ASTNode) =>
    node.k === "Comp" && (node.name === "Action" || calls.get(node.name)?.kind === "action");

  const collect = (from: ASTNode): Sources => {
    const queries = new Set<string>();
    const via = new Set<string>();
    const state = new Set<string>();
    // Whether a statement leads to a query; set to false first so a cycle stops.
    const reaches = new Map<string, boolean>([[statementId, false]]);

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
        // Another statement: only its data counts, not components in it (ask for those by
        // name), and the loops around the component do not reach into it.
        found = walk(target, new Set(), NO_BINDINGS, false);
        if (found) via.add(name);
      }
      reaches.set(name, found);
      return found;
    };

    // `scope` holds names an `@Each` binds, which shadow statements of the same name.
    // Without `components`, component calls are skipped.
    const walk = (
      start: ASTNode,
      scope: ReadonlySet<string>,
      binds = bound,
      components = true,
    ): boolean => {
      let found = false;
      const skipped = new Set<ASTNode>();
      const skip = (node: ASTNode) => walkAST(node, (n) => void skipped.add(n));
      walkAST(start, (node) => {
        if (skipped.has(node)) return;
        if (isAction(node) || (!components && isComponent(node))) return skip(node);
        const def = node.k === "Comp" ? calls.get(node.name) : undefined;
        if (node.k === "Comp" && def?.kind === "function" && def.lazy && node.args.length >= 3) {
          const name = boundName(node.args[1]);
          const inner = name ? new Set([...scope, name]) : scope;
          // The list is read outside the loop, so its own name does not shadow it.
          node.args.forEach((arg, i) => {
            if (i !== 1 && walk(arg, i === 0 ? scope : inner, binds, components)) found = true;
          });
          return skip(node);
        }
        if (node.k === "StateRef" && Object.hasOwn(result.stateDeclarations, node.n)) {
          state.add(node.n);
        }
        if (node.k !== "Ref" || scope.has(node.n)) return;
        const binding = binds.get(node.n);
        if (binding ? walk(binding.list, new Set(), binding.outer, components) : follow(node.n)) {
          found = true;
        }
      });
      return found;
    };

    walk(from, new Set());
    return { queries: [...queries], via: [...via], state: [...state] };
  };

  try {
    // `card = other` renders `other`'s component under the name `card`.
    let start = own;
    for (const seen = new Set([statementId]); start.k === "Ref" && !seen.has(start.n);) {
      seen.add(start.n);
      start = statements.get(start.n) ?? start;
    }
    // The text of each statement in between, e.g. `now = @First(totals.rows)`.
    const formulas = (via: string[]) =>
      Object.fromEntries(via.map((name) => [name, text(statements.get(name)!)]));
    const text = (node: ASTNode) => serializeASTNode(node, calls);

    if (start.k !== "Comp" || !isComponent(start)) {
      const sources = collect(own);
      // A query statement is its own source.
      if (own.k === "Comp" && own.name === RESERVED_CALLS.Query) {
        sources.queries = [statementId, ...sources.queries.filter((q) => q !== statementId)];
      }
      return { ...sources, formulas: formulas(sources.via) };
    }

    // Positional arguments map to props in the library's order.
    const args = start.args;
    const names = parsed.cat?.get(start.name)?.params.map((p) => p.name) ?? [];
    const props: Record<string, PropSources> = {};
    const all = { queries: new Set<string>(), via: new Set<string>(), state: new Set<string>() };
    names.forEach((name, i) => {
      if (i >= args.length) return;
      props[name] = { ...collect(args[i]), expr: text(args[i]) };
      for (const key of ["queries", "via", "state"] as const) {
        props[name][key].forEach((n) => all[key].add(n));
      }
    });
    const via = [...all.via];
    return {
      queries: [...all.queries],
      via,
      state: [...all.state],
      formulas: formulas(via),
      props,
    };
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
