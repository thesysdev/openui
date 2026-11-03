import { generateSystemPrompt, type LibrarySpec, type PromptOptions } from "@openuidev/lang-core";
import { readFileSync } from "fs";
import { join } from "path";

/** Load the generated dashboard-kit spec and wrap it in Cloud's managed prompt block. */
export function systemPrompt(): string {
  // generateSystemPrompt takes the library and its prompt options separately.
  const { promptOptions, ...library } = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/spec.json"), "utf-8"),
  ) as LibrarySpec & { promptOptions?: PromptOptions };
  return generateSystemPrompt({ cloud: true, library, promptOptions });
}
