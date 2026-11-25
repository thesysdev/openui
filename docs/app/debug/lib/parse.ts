import type { LoadedLangCore, OpenUIError, ParseResult, ValidationError } from "./versions/types";

export interface ValidationOutcome {
  result: ParseResult | null;
  enriched: OpenUIError[] | null;
  /** The parser itself threw — happens on some old lang-core versions. */
  fatal: string | null;
}

export const EMPTY_OUTCOME: ValidationOutcome = { result: null, enriched: null, fatal: null };

/**
 * Old lang-core versions return ParseResults with missing fields (0.1.x has
 * no meta.unresolved/orphaned, for example) — panels would crash on `.map`.
 * Coerce every result to the full modern shape before it reaches React.
 */
export function normalizeResult(raw: unknown): ParseResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<ParseResult>;
  const meta = (r.meta ?? {}) as Partial<ParseResult["meta"]>;
  return {
    root: r.root ?? null,
    meta: {
      incomplete: !!meta.incomplete,
      unresolved: Array.isArray(meta.unresolved) ? meta.unresolved : [],
      orphaned: Array.isArray(meta.orphaned) ? meta.orphaned : [],
      statementCount: typeof meta.statementCount === "number" ? meta.statementCount : 0,
      errors: Array.isArray(meta.errors) ? meta.errors : [],
    },
    stateDeclarations: r.stateDeclarations,
    queryStatements: r.queryStatements,
    mutationStatements: r.mutationStatements,
  };
}

/**
 * One-shot validation with the user-selected lang-core version. Everything a
 * dynamically loaded module does is wrapped — a throw becomes `fatal`, never
 * an unhandled exception. (If parsing ever needs to move off the main thread,
 * this function is the seam to put behind a worker.)
 */
export function runValidation(
  code: string,
  loaded: LoadedLangCore,
  schema: unknown,
  rootName: string | undefined,
  componentNames: string[],
): ValidationOutcome {
  if (!code.trim()) return EMPTY_OUTCOME;
  let result: ParseResult | null;
  try {
    result = normalizeResult(loaded.mod.createParser!(schema, rootName).parse(code));
  } catch (err) {
    return {
      result: null,
      enriched: null,
      fatal: err instanceof Error ? err.message : String(err),
    };
  }
  if (!result) {
    return { result: null, enriched: null, fatal: "Parser returned an unrecognizable result." };
  }
  return {
    result,
    enriched: tryEnrich(result.meta.errors, loaded, schema, componentNames),
    fatal: null,
  };
}

export function tryEnrich(
  errors: ValidationError[],
  loaded: LoadedLangCore,
  schema: unknown,
  componentNames: string[],
): OpenUIError[] | null {
  if (!loaded.capabilities.enrich || errors.length === 0) return null;
  try {
    return loaded.mod.enrichErrors!(errors, schema, componentNames);
  } catch {
    return null;
  }
}
