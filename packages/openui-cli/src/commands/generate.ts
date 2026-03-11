import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface GenerateOptions {
  out?: string;
  jsonSchema?: boolean;
  export?: string;
  promptOptions?: string;
}

export async function runGenerate(entry: string, options: GenerateOptions): Promise<void> {
  const entryPath = path.resolve(process.cwd(), entry);

  if (!fs.existsSync(entryPath)) {
    console.error(`Error: File not found: ${entryPath}`);
    process.exit(1);
  }

  const workerPath = path.join(__dirname, "generate-worker.js");

  const workerArgs = [workerPath, entryPath];
  if (options.export) workerArgs.push(options.export);
  if (options.jsonSchema) workerArgs.push("--json-schema");
  if (options.promptOptions) workerArgs.push("--prompt-options", options.promptOptions);

  let output: string;
  try {
    output = execFileSync(process.execPath, workerArgs, {
      encoding: "utf-8",
      cwd: process.cwd(),
      stdio: ["inherit", "pipe", "inherit"],
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  if (options.out) {
    const outPath = path.resolve(process.cwd(), options.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output + "\n");
    console.info(`Written to ${outPath}`);
  } else {
    process.stdout.write(output + "\n");
  }
}
