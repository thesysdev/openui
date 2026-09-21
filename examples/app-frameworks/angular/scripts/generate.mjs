import { mkdir, writeFile } from "node:fs/promises";
import { library, promptOptions } from "../server/library.mjs";
await mkdir(new URL("../generated", import.meta.url), { recursive: true });
await writeFile(
  new URL("../generated/system-prompt.txt", import.meta.url),
  library.prompt(promptOptions),
);
await writeFile(
  new URL("../generated/library.schema.json", import.meta.url),
  JSON.stringify(library.toJSONSchema(), null, 2) + "\n",
);
console.log("Generated prompt and schema from the shared component definitions.");
