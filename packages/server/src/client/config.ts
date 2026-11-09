import {
  generateSystemPrompt,
  type CloudPromptOptions,
  type LibrarySpec,
} from "@openuidev/lang-core";
import type { ToolDefinition } from "../tools/types";

const CONFIG_MARKER = "]]>openui:config\n";

/** The kinds of artifact OpenUI Cloud generates from a config block. */
export type ArtifactKind = "dashboard";

/** What a call adds to the config block, as its `artifact` key. */
export interface ArtifactCall {
  /** What to generate, so OpenUI Cloud doesn't have to guess. */
  kind: ArtifactKind;
  /** The data tools its queries may call. */
  tools: ToolDefinition[];
  /** The artifact's title, on create. */
  title?: string;
  /** The artifact an edit changes. */
  id?: string;
}

/**
 * OpenUI Cloud's config block for an artifact: lang-core writes the library
 * part (`chatLibrary`, `systemPromptOptions`), and each call adds its own
 * under `artifact`: kind, data tools, title and edit target.
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

  return (artifact: ArtifactCall): string => CONFIG_MARKER + JSON.stringify({ ...base, artifact });
}
