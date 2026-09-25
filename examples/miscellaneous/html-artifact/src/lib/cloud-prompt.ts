import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { readFileSync } from "fs";
import { join } from "path";
import { promptOptions } from "./prompt-options";

/** Load the generated library spec and wrap it in Cloud's managed prompt block. */
export function cloudInstructions(): string {
  const library = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/spec.json"), "utf-8"),
  ) as LibrarySpec;
  return generateSystemPrompt({ cloud: true, library, promptOptions });
}
