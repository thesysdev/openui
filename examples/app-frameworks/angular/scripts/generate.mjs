import { generateSystemPrompt } from "@openuidev/lang-core";
import { mkdir, writeFile } from "node:fs/promises";
import { library, promptOptions } from "../server/library.mjs";
await mkdir(new URL("../generated", import.meta.url), { recursive: true });
await writeFile(
  new URL("../generated/system-prompt.txt", import.meta.url),
  generateSystemPrompt({ cloud: true, library: library.toSpec(), promptOptions }),
);
await writeFile(
  new URL("../generated/library.schema.json", import.meta.url),
  JSON.stringify(library.toJSONSchema(), null, 2) + "\n",
);
console.log("Generated Cloud configuration and schema from the shared component definitions.");
