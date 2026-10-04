import type { CloudPromptOptions, LibrarySpec, SystemPromptOptions } from "./prompt";
import { validateChatLibrary } from "./validate-library";

/** `]]>openui:config\n` — request-direction config block header. Trailing newline is part of the wire contract. */
const CLOUD_CONFIG_MARKER = "]]>openui:config\n";

/**
 * Wire pin for OpenUI Cloud's built-in chat library when `generateSystemPrompt({ cloud: true })`
 * is called without your own library. Cloud rejects a non-numeric or too-old version.
 */
const CLOUD_CHAT_LIBRARY_VERSION = "0.1.0";

type CloudConfig =
  | { libraryVersion: string }
  | { chatLibrary: Omit<LibrarySpec, "components">; systemPromptOptions?: CloudPromptOptions };

function pickCloudPromptOptions(
  options: SystemPromptOptions | CloudPromptOptions | undefined,
): CloudPromptOptions | undefined {
  if (!options) return undefined;
  const picked: CloudPromptOptions = {};
  if (options.examples) picked.examples = options.examples;
  if (options.preamble) picked.preamble = options.preamble;
  if (options.additionalRules) picked.additionalRules = options.additionalRules;
  return Object.keys(picked).length > 0 ? picked : undefined;
}

export function generateCloudConfig(spec: {
  library?: LibrarySpec;
  promptOptions?: SystemPromptOptions | CloudPromptOptions;
  instructions?: string;
}): string {
  let config: CloudConfig;

  if (spec.library) {
    const issues = validateChatLibrary(spec.library);
    if (issues.length > 0) {
      throw new Error(
        `[generateSystemPrompt] Invalid library: ${issues.map((i) => i.message).join(" ")}`,
      );
    }
    const { components: _components, ...chatLibrary } = spec.library;
    const promptOptions = pickCloudPromptOptions(spec.promptOptions);
    config = {
      chatLibrary,
      ...(promptOptions ? { systemPromptOptions: promptOptions } : {}),
    };
  } else {
    if (spec.promptOptions && pickCloudPromptOptions(spec.promptOptions)) {
      throw new Error(
        "[generateSystemPrompt] promptOptions requires a library — the built-in library ignores it.",
      );
    }
    config = { libraryVersion: CLOUD_CHAT_LIBRARY_VERSION };
  }

  const block = `${CLOUD_CONFIG_MARKER}${JSON.stringify(config)}`;
  return spec.instructions ? `${block}\n${spec.instructions}` : block;
}
