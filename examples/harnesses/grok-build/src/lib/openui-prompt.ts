import type { LibraryJSONSchema, LibrarySpec } from "@openuidev/lang-core";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { readFileSync } from "fs";
import { join } from "path";
import { promptOptions } from "./prompt-options";

function loadSpec(): LibrarySpec {
  return JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/spec.json"), "utf-8"),
  ) as LibrarySpec;
}

/** Compile openuiLibrary locally — Grok Build talks to xAI, not OpenUI Cloud. */
export function localSystemPrompt(): string {
  return generateSystemPrompt({ library: loadSpec(), promptOptions });
}

export function librarySchema(): LibraryJSONSchema {
  const schema = loadSpec().schema;
  if (!schema) throw new Error("src/generated/spec.json is missing schema — run pnpm generate");
  return schema;
}

export function libraryRoot(): string {
  return loadSpec().root ?? "Stack";
}
