import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import type { CliContext } from "../../lib/context";
import { CreateError } from "../../lib/errors";
import { SEPARATION_DELIMITER } from "./lib/delimiter";
import { GenerateTelemetryClient } from "./lib/telemetry";

export interface GenerateOptions {
  out?: string;
  jsonSchema?: boolean;
  spec?: boolean;
  export?: string;
  promptOptions?: string;
  interactive: boolean;
}

export async function runGenerate(
  entry: string,
  options: Omit<GenerateOptions, "interactive">,
  ctx: CliContext,
): Promise<void> {
  const tel = new GenerateTelemetryClient(ctx.telemetry);
  const t0 = Date.now();
  tel.trackStarted({
    json_schema: !!options.jsonSchema,
    spec: !!options.spec,
    out_to_file: !!options.out,
  });
  const entryPath = path.resolve(ctx.cwd, entry);

  if (!fs.existsSync(entryPath)) {
    throw new CreateError("generate_entry_missing", `File not found: ${entryPath}`);
  }

  const workerPath = path.join(__dirname, "lib", "worker.js");

  const workerArgs = [workerPath, entryPath];
  if (options.export) workerArgs.push(options.export);
  if (options.jsonSchema) workerArgs.push("--json-schema");
  if (options.spec) workerArgs.push("--spec");
  if (options.promptOptions) workerArgs.push("--prompt-options", options.promptOptions);

  let output: string;
  try {
    output = execFileSync(process.execPath, workerArgs, {
      encoding: "utf-8",
      cwd: ctx.cwd,
      stdio: ["inherit", "pipe", "inherit"],
    });
  } catch (err) {
    throw new CreateError("generate_worker", err instanceof Error ? err.message : String(err));
  }

  if (options.jsonSchema || options.spec) {
    if (options.out) {
      const outPath = path.resolve(ctx.cwd, options.out);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, output + "\n");
      console.info(`Written to ${outPath}`);
    } else {
      stdoutWrite(output);
    }
  } else {
    // Both artifact mode
    // `--out <file>` receives the prompt (legacy behavior preserved);
    // the spec lands alongside it as `<file>.spec.json` (extension swapped).
    // Without `--out` both go to stdout.
    const [prompt = "", specJson = ""] = output.split(SEPARATION_DELIMITER);
    if (options.out) {
      const promptPath = path.resolve(ctx.cwd, options.out);
      fs.mkdirSync(path.dirname(promptPath), { recursive: true });
      const base = promptPath.slice(0, promptPath.length - path.extname(promptPath).length);
      const specPath = `${base}.spec.json`;
      fs.writeFileSync(promptPath, prompt + "\n");
      fs.writeFileSync(specPath, specJson + "\n");
      console.info(`Written System Prompt to ${promptPath}`);
      console.info(`Written Library Spec to ${specPath}`);
    } else {
      stdoutWrite(prompt + "\n\n" + specJson);
    }
  }

  tel.trackSucceeded({
    json_schema: !!options.jsonSchema,
    spec: !!options.spec,
    out_to_file: !!options.out,
    duration_ms: Date.now() - t0,
  });
}

function stdoutWrite(content: string) {
  process.stdout.write(content + "\n");
}
