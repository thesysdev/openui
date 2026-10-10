import { observability } from "@openuidev/observability";
import type { Library } from "./library";

/**
 * Shared with `@openuidev/devtools` via `Symbol.for`. Not a public API —
 * the live library object stays off the observability bus (serializable ping
 * only). Keep the string in sync with `packages/devtools/src/libraryRegistry.ts`.
 */
export const DEVTOOLS_LIBRARIES_KEY = Symbol.for("openui.devtools.libraries");

export const LIBRARY_EVENT_KIND = "react-lang:library";

export type LibraryRegistry = Record<string, Library>;

interface RegistryStore {
  [DEVTOOLS_LIBRARIES_KEY]?: LibraryRegistry;
}

export function libraryKey(library: {
  id?: string;
  root?: string;
  components: Record<string, unknown>;
}): string {
  return library.id ?? library.root ?? Object.keys(library.components).sort().join(",");
}

function getRegistry(): LibraryRegistry {
  const store = globalThis as RegistryStore;
  return (store[DEVTOOLS_LIBRARIES_KEY] ??= {});
}

/** Dev-only: stash the live library and emit a serializable registration ping. */
export function publishLibrary(library: Library, key = libraryKey(library)): void {
  getRegistry()[key] = library;
  observability.info({
    kind: LIBRARY_EVENT_KIND,
    __libraryId: library.__libraryId,
    ...(library.id !== undefined ? { id: library.id } : {}),
    ...(library.root !== undefined ? { root: library.root } : {}),
    components: Object.keys(library.components),
    message: library.id
      ? `Library "${library.id}" registered`
      : `Library registered (root: ${library.root ?? "none"})`,
  });
}
