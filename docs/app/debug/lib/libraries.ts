import {
  library as dashboardLibrary,
  ThemeProvider as DashboardThemeProvider,
} from "@openuidev/dashboard-library";
import {
  library as intelligentUiLibrary,
  ThemeProvider as IntelligentUiThemeProvider,
} from "@openuidev/intelligent-ui-library";
import type { Library } from "@openuidev/react-lang";
import { openuiChatLibrary, openuiLibrary } from "@openuidev/react-ui/genui-lib";
import type { ComponentType, ReactNode } from "react";

export type LibraryId = "intelligent-ui" | "dashboard" | "openui" | "chat";

export interface LibraryEntry {
  id: LibraryId;
  label: string;
  library: Library;
  /**
   * Libraries that don't read react-ui's theme bring their own provider; the
   * render panel wraps output in it and passes the page's light/dark mode.
   */
  ThemeProvider?: ComponentType<{ mode?: "light" | "dark"; children?: ReactNode }>;
}

export const LIBRARIES: LibraryEntry[] = [
  {
    id: "intelligent-ui",
    label: "Intelligent UI",
    library: intelligentUiLibrary,
    ThemeProvider: IntelligentUiThemeProvider,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    library: dashboardLibrary,
    ThemeProvider: DashboardThemeProvider,
  },
  { id: "openui", label: "openui", library: openuiLibrary as Library },
  { id: "chat", label: "openui chat", library: openuiChatLibrary as Library },
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
