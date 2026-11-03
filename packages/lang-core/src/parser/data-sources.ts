import { walkAST, type ASTNode } from "./ast";
import { ACTION_STEPS, RESERVED_CALLS } from "./builtins";
import { isComponentCall, parsedStatements } from "./parser";
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
 * For a component, `props` gives the same for each of its props, and `literal` marks a prop
 * that reads nothing: its value is written in the program. Inline child components count
 * toward the statement. A child that is its own statement does not (ask for its sources by
 * its name), and actions are not followed: the built-in steps, and the library's own when
 * `actions` names them.
 */
export function dataSources(
  result: ParseResult,
  statementId: string,
  actions?: Record<string, unknown>,
): Sources & { props?: Record<string, Sources & { literal: boolean }> } {
  const parsed = parsedStatements.get(result);
  const statements = parsed?.statements;

  const isAction = (node: ASTNode) =>
    node.k === "Comp" &&
    (node.name === "Action" ||
      Object.hasOwn(ACTION_STEPS, node.name) ||
      (actions !== undefined && Object.hasOwn(actions, node.name)));

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
      const target = statements?.get(name);
      let found = false;
      if (target?.k === "Comp" && target.name === RESERVED_CALLS.Query) {
        queries.add(name);
        walk(target);
        found = true;
      } else if (
        target &&
        !(target.k === "Comp" && target.name === RESERVED_CALLS.Mutation) &&
        !isComponentCall(target)
      ) {
        found = walk(target);
        if (found) via.add(name);
      }
      reaches.set(name, found);
      return found;
    };

    const walk = (start: ASTNode): boolean => {
      let found = false;
      const skipped = new Set<ASTNode>();
      walkAST(start, (node) => {
        if (skipped.has(node)) return;
        if (isAction(node)) {
          walkAST(node, (n) => skipped.add(n));
          return;
        }
        if (node.k === "StateRef") state.add(node.n);
        if (node.k === "Ref" && follow(node.n)) found = true;
      });
      return found;
    };

    walk(from);
    return { queries: [...queries], via: [...via], state: [...state] };
  };

  const own = statements?.get(statementId);
  if (!own) return { queries: [], via: [], state: [] };
  // `card = other` renders `other`'s component under the name `card`.
  let start = own;
  for (const seen = new Set([statementId]); start.k === "Ref" && !seen.has(start.n);) {
    seen.add(start.n);
    start = statements?.get(start.n) ?? start;
  }
  if (!isComponentCall(start)) return collect(own);

  // Positional arguments map to props in the library's order; extra ones count toward the total.
  const names = parsed?.cat?.get(start.name)?.params.map((p) => p.name) ?? [];
  const props: Record<string, Sources & { literal: boolean }> = {};
  const all = { queries: new Set<string>(), via: new Set<string>(), state: new Set<string>() };
  start.args.forEach((arg, i) => {
    const sources = collect(arg);
    for (const key of ["queries", "via", "state"] as const)
      sources[key].forEach((n) => all[key].add(n));
    let literal = true;
    walkAST(arg, (node) => {
      if (node.k === "Ref" || node.k === "StateRef") literal = false;
    });
    if (names[i]) props[names[i]] = { ...sources, literal };
  });
  return { queries: [...all.queries], via: [...all.via], state: [...all.state], props };
}
