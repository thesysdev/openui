import {
  generateSystemPrompt,
  type CloudPromptOptions,
  type LibrarySpec,
} from "@openuidev/lang-core";
import type { ToolDefinition } from "../tools/types";

const CONFIG_MARKER = "]]>openui:config\n";

/** What a dashboard call adds to the config block. */
export interface ArtifactCall {
  tools: ToolDefinition[];
  /** Which dashboard: the dashboard's name. */
  definition: string;
  /** The artifact's title, on create. */
  title?: string;
  /** The artifact an edit changes. */
  artifactId?: string;
}

/**
 * OpenUI Cloud's config block for an artifact: lang-core writes the library
 * part (`chatLibrary`, `systemPromptOptions`), and each call adds the rest:
 * its data tools (`script`), title (`meta`), dashboard and edit target.
 */
export function artifactConfig(library: LibrarySpec, promptOptions?: CloudPromptOptions) {
  // Built once, so an invalid library fails when the dashboard is defined.
  const block = generateSystemPrompt({
    cloud: true,
    library,
    ...(promptOptions && { promptOptions }),
  });
  if (!block.startsWith(CONFIG_MARKER)) {
    throw new Error("lang-core returned an unexpected config block");
  }
  const base = JSON.parse(block.slice(CONFIG_MARKER.length)) as Record<string, unknown>;

  return ({ tools, definition, title, artifactId }: ArtifactCall): string =>
    CONFIG_MARKER +
    JSON.stringify({
      ...base,
      script: { tools },
      ...(title !== undefined && { meta: { name: title } }),
      definition,
      ...(artifactId !== undefined && { artifactId }),
    });
}
