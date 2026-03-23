import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { emailLibrary, emailPromptOptions } = await import("../src/index.ts");

const prompt = emailLibrary.prompt(emailPromptOptions);
const outPath = join(__dirname, "../../../examples/react-email-chat/src/generated/system-prompt.txt");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, prompt, "utf-8");
console.log(`Generated: ${prompt.length} chars`);
