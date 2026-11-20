import { library } from "@openuidev/intelligent-ui-library";
import type { Library } from "@openuidev/react-lang";

export type LibraryId = "intelligent-ui";

export interface LibraryEntry {
  id: LibraryId;
  label: string;
  library: Library;
}

export const LIBRARIES: LibraryEntry[] = [
  { id: "intelligent-ui", label: "Intelligent UI", library },
];

export function getLibrary(id: LibraryId): LibraryEntry {
  return LIBRARIES.find((l) => l.id === id) ?? LIBRARIES[0];
}

// toJSONSchema() walks every component's zod schema — do it once per library.
const schemaCache = new Map<LibraryId, unknown>();

export function getSchema(id: LibraryId): unknown {
  let schema = schemaCache.get(id);
  if (!schema) {
    schema = getLibrary(id).library.toJSONSchema();
    schemaCache.set(id, schema);
  }
  return schema;
}

export function getRootName(id: LibraryId): string | undefined {
  return getLibrary(id).library.root;
}

export function getComponentNames(id: LibraryId): string[] {
  return Object.keys(getLibrary(id).library.components);
}
