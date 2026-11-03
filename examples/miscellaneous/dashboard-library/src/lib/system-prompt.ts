import { generateSystemPrompt, type LibrarySpec, type PromptOptions } from "@openuidev/lang-core";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Build the full system prompt from the generated dashboard-kit spec.
 *
 * Not `cloud: true`: Cloud's managed config only forwards preamble, examples and
 * additionalRules, so tools, edit mode, inline mode and bindings would be dropped.
 */
export function systemPrompt(): string {
  const { promptOptions, ...library } = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/spec.json"), "utf-8"),
  ) as LibrarySpec & { promptOptions?: PromptOptions };
  return generateSystemPrompt({ library, promptOptions });
}
