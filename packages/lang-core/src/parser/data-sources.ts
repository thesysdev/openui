import { walkAST, type ASTNode } from "./ast";
import { ACTION_STEPS, RESERVED_CALLS } from "./builtins";
import { isComponentCall, parsedStatements } from "./parser";
import type { ParseResult } from "./types";

/** Where a statement's value comes from. */
interface DataSources {
  /** Query statements it reads, directly or through other statements. */
  queries: string[];
  /** Statements between it and those queries, e.g. `latest` in `latest = @Last(weekly.rows)`. */
  via: string[];
  /** `$variables` it, or a statement it reads, uses. */
  state: string[];
}

/**
 * Find the queries a statement's value is read from, for a "where did this come from" view.
 * Inline child components count toward the statement. A child that is its own statement does
 * not (ask for its sources by its name), and actions are not followed: the built-in steps,
 * and the library's own when `actions` names them.
 */
export function dataSources(
  result: ParseResult,
  statementId: string,
  actions?: Record<string, unknown>,
): DataSources {
  const statements = parsedStatements.get(result);
  const queries = new Set<string>();
  const via = new Set<string>();
  const state = new Set<string>();
  // Whether a statement leads to a query; set to false first so a cycle stops.
  const reaches = new Map<string, boolean>([[statementId, false]]);

  const isAction = (node: ASTNode) =>
    node.k === "Comp" &&
    (node.name === "Action" ||
      Object.hasOwn(ACTION_STEPS, node.name) ||
      (actions !== undefined && Object.hasOwn(actions, node.name)));

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

  const start = statements?.get(statementId);
  if (start) walk(start);
  return { queries: [...queries], via: [...via], state: [...state] };
}
