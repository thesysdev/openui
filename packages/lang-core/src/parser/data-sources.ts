import { walkAST, type ASTNode } from "./ast";
import { getCallDefs, RESERVED_CALLS } from "./builtins";
import { parsedStatements } from "./parser";
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

/**
 * Find the queries a statement's value is read from, for a "where did this come from" view.
 * For a component, `props` gives the same for each prop; one with no queries and no state is
 * written in the program (or reads a Mutation result). Inline child components count toward
 * the statement. A named one does not (ask for it by its name), nor does a Mutation or an
 * action. A query counts what its tool name and arguments read. Null when `result` is not one
 * the parser returned, or has no such statement.
 */
export function dataSources(
  result: ParseResult,
  statementId: string,
): (Sources & { props?: Record<string, Sources> }) | null {
  const parsed = parsedStatements.get(result);
  const own = parsed?.statements.get(statementId);
  if (!parsed || !own) return null;
  const { statements } = parsed;
  const calls = getCallDefs(parsed.cat);

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
        target.args.slice(0, 2).forEach((arg) => walk(arg, new Set()));
        found = true;
      } else if (target && !(target.k === "Comp" && target.name === RESERVED_CALLS.Mutation)) {
        let holdsComponent = false;
        walkAST(target, (node) => {
          if (isComponent(node)) holdsComponent = true;
        });
        if (!holdsComponent) found = walk(target, new Set());
        if (found) via.add(name);
      }
      reaches.set(name, found);
      return found;
    };

    // `scope` holds names an `@Each` binds, which shadow statements of the same name.
    const walk = (start: ASTNode, scope: ReadonlySet<string>): boolean => {
      let found = false;
      const skipped = new Set<ASTNode>();
      const skip = (node: ASTNode) => walkAST(node, (n) => void skipped.add(n));
      walkAST(start, (node) => {
        if (skipped.has(node)) return;
        if (isAction(node)) return skip(node);
        const def = node.k === "Comp" ? calls.get(node.name) : undefined;
        if (node.k === "Comp" && def?.kind === "function" && def.lazy && node.args.length >= 3) {
          const bound = node.args[1];
          const name = bound.k === "Ref" ? bound.n : bound.k === "Str" ? bound.v : undefined;
          const inner = name ? new Set([...scope, name]) : scope;
          node.args.forEach((arg, i) => {
            if (i !== 1 && walk(arg, inner)) found = true;
          });
          return skip(node);
        }
        if (node.k === "StateRef" && Object.hasOwn(result.stateDeclarations, node.n)) {
          state.add(node.n);
        }
        if (node.k === "Ref" && !scope.has(node.n) && follow(node.n)) found = true;
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
    if (start.k !== "Comp" || !isComponent(start)) return collect(own);

    // Positional arguments map to props in the library's order.
    const args = start.args;
    const names = parsed.cat?.get(start.name)?.params.map((p) => p.name) ?? [];
    const props: Record<string, Sources> = {};
    const all = { queries: new Set<string>(), via: new Set<string>(), state: new Set<string>() };
    names.forEach((name, i) => {
      if (i >= args.length) return;
      props[name] = collect(args[i]);
      for (const key of ["queries", "via", "state"] as const) {
        props[name][key].forEach((n) => all[key].add(n));
      }
    });
    return { queries: [...all.queries], via: [...all.via], state: [...all.state], props };
  } catch (error) {
    // A chain of statements too long to walk.
    if (error instanceof RangeError) return null;
    throw error;
  }
}
