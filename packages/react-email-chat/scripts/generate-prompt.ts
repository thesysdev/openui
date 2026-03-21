import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  // Dynamic import to handle the "use client" directive in the library file
  const { library, promptOptions } = await import("../src/library");
  const prompt = library.prompt(promptOptions);
  const outPath = join(process.cwd(), "src/generated/system-prompt.txt");
  writeFileSync(outPath, prompt, "utf-8");
  console.log(`System prompt written to ${outPath} (${prompt.length} chars)`);
}

main().catch((err) => {
  console.error("Failed to generate prompt:", err);
  process.exit(1);
});
