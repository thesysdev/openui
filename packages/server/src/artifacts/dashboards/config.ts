import {
  generateSystemPrompt,
  type CloudPromptOptions,
  type LibrarySpec,
} from "@openuidev/lang-core";
import type { ToolDefinition } from "../../interpreter/types";

const CONFIG_MARKER = "]]>openui:config\n";

/** What a dashboard call adds to the config block, as its `artifact` key. */
export interface ArtifactCall {
  /** The data tools its queries may call. */
  tools: ToolDefinition[];
  /** The artifact's title, on create. */
  title?: string;
  /** The artifact an edit changes. */
  id?: string;
  /** Tool rounds before the model must write the dashboard. */
  maxToolRounds?: number;
}

/** OpenUI Cloud's config block: the library part, each call's `artifact`, then your instructions. */
export function artifactConfig(
  library: LibrarySpec,
  promptOptions?: CloudPromptOptions,
  instructions?: string,
) {
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
  // Where lang-core's `instructions` would put them: after the block.
  const prose = instructions ? `\n${instructions}` : "";

  return (artifact: ArtifactCall): string =>
    CONFIG_MARKER + JSON.stringify({ ...base, artifact }) + prose;
}
