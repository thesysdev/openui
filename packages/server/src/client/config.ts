import {
  generateSystemPrompt,
  type CloudPromptOptions,
  type LibrarySpec,
} from "@openuidev/lang-core";
import type { ToolDefinition } from "../tools/types";

const CONFIG_MARKER = "]]>openui:config\n";

/**
 * OpenUI Cloud's config block for an artifact: lang-core writes the library
 * part (`chatLibrary`, `systemPromptOptions`), and each call adds what only an
 * artifact has, its data tools (`script`) and title (`meta`).
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

  return (tools: ToolDefinition[], title?: string): string =>
    CONFIG_MARKER +
    JSON.stringify({
      ...base,
      script: { tools },
      ...(title !== undefined && { meta: { name: title } }),
    });
}
