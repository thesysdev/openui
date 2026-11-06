/**
 * Provenance brand for the values the parser and evaluator build: elements, reactive
 * bindings and action steps. Data (tool results, state, any JSON) can never carry a symbol
 * key, so a data object that merely looks like an element or an AST node is never evaluated
 * or rendered as one. `Symbol.for` keeps the brand shared across package copies; object
 * spread copies it along with the other own properties.
 */
export const OWN = Symbol.for("@openuidev/lang-core:own");

export function own<T extends object>(value: T): T {
  (value as Record<symbol, unknown>)[OWN] = true;
  return value;
}

export function isOwn(value: object): boolean {
  return (value as Record<symbol, unknown>)[OWN] === true;
}
