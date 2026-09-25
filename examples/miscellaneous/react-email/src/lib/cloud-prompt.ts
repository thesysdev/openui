import {
  generateSystemPrompt,
  type LibrarySpec,
  type PromptOptions,
} from "@openuidev/lang-core";
import { readFileSync } from "fs";
import { join } from "path";

/** Load the generated email library spec and wrap it in Cloud's managed prompt block. */
export function cloudInstructions(): string {
  const library = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/spec.json"), "utf-8"),
  ) as LibrarySpec;
  const promptOptions = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/prompt-options.json"), "utf-8"),
  ) as PromptOptions;
  return generateSystemPrompt({ cloud: true, library, promptOptions });
}
