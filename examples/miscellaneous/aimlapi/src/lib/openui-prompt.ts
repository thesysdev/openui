import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { readFileSync } from "fs";
import { join } from "path";
import { promptOptions } from "./prompt-options";

/**
 * Compile openuiLibrary into the system prompt locally. This example talks to
 * AI/ML API directly, so there is no OpenUI Gateway to hold the prompt (and no
 * server-side correction of invalid OpenUI Lang — the renderer's own recovery
 * is what you get).
 */
export function localInstructions(extra?: string): string {
  const library = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/spec.json"), "utf-8"),
  ) as LibrarySpec;
  return generateSystemPrompt({
    library,
    promptOptions,
    ...(extra ? { instructions: extra } : {}),
  });
}
