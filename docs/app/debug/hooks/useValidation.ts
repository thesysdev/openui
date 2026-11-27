"use client";

import { getComponentNames, getRootName, getSchema, type LibraryId } from "@paste/lib/libraries";
import { EMPTY_OUTCOME, runValidation, type ValidationOutcome } from "@paste/lib/parse";
import { loadLangCore } from "@paste/lib/versions/loader";
import type { LoadedLangCore } from "@paste/lib/versions/types";
import { useEffect, useMemo, useState } from "react";

export interface ValidationState {
  outcome: ValidationOutcome;
  loaded: LoadedLangCore | null;
  /** True while the selected version is downloading from the CDN. */
  loadingVersion: boolean;
}

const DEBOUNCE_MS = 150;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/**
 * Loads the selected lang-core version and derives debounced one-shot
 * validation from code / version / library.
 */
export function useValidation(
  code: string,
  version: string,
  libraryId: LibraryId,
): ValidationState {
  // Which version a load completed FOR (the loaded module may be a fallback
  // with a different .version) — loading state is derived by comparison.
  const [loadState, setLoadState] = useState<{ requested: string; loaded: LoadedLangCore } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    loadLangCore(version).then((loaded) => {
      if (!cancelled) setLoadState({ requested: version, loaded });
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const loaded = loadState?.requested === version ? loadState.loaded : null;
  const debouncedCode = useDebounced(code, DEBOUNCE_MS);

  const outcome = useMemo(() => {
    if (!loaded?.compatible) return EMPTY_OUTCOME;
    return runValidation(
      debouncedCode,
      loaded,
      getSchema(libraryId),
      getRootName(libraryId),
      getComponentNames(libraryId),
    );
  }, [debouncedCode, loaded, libraryId]);

  return { outcome, loaded, loadingVersion: !loaded };
}
