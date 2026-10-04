import { emailLibrary, emailPromptOptions } from "@openuidev/react-email";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { mkdirSync, writeFileSync } from "node:fs";

// LibrarySpec from toSpec(); Cloud ignores `components` and validates schema/root/groups.
const { components: _components, ...library } = emailLibrary.toSpec();
const promptOptions = {
  examples: emailPromptOptions.examples,
  additionalRules: emailPromptOptions.additionalRules,
};

// Fail generate if Cloud rejects the spec.
generateSystemPrompt({ cloud: true, library, promptOptions });

mkdirSync("src/generated", { recursive: true });
writeFileSync("src/generated/spec.json", JSON.stringify(library, null, 2));
writeFileSync("src/generated/prompt-options.json", JSON.stringify(promptOptions, null, 2));
console.log("Generated spec.json and prompt-options.json");
