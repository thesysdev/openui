import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { readFileSync } from "fs";
import { join } from "path";
import { promptOptions } from "./prompt-options.ts";

/** Load the generated openuiLibrary spec and wrap it in Cloud's managed prompt block. */
export function cloudInstructions(extra?: string): string {
  const library = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/spec.json"), "utf-8"),
  ) as LibrarySpec;
  return generateSystemPrompt({
    cloud: true,
    library,
    promptOptions,
    instructions: [
      "Forms that ask the assistant to process input must submit the current field values to the assistant using the library Form and submit action (@ToAssistant where supported). Do not replace submission with a local visibility toggle or a pre-written summary. Bind interactive fields to reactive state using the library binding props; conditional fields must read that state. Generate the summary only after receiving the submitted values.",
      extra,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
