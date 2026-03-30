/**
 * Worker script that bundles a user's library file and outputs the system
 * prompt or JSON schema. Asset imports are stubbed during bundling so React
 * component modules can be evaluated without CSS/image/font loaders.
 *
 * argv: [entryPath, exportName?, "--json-schema"?, "--prompt-options", name?]
 * stdout: the prompt string or JSON schema
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as esbuild from "esbuild";

// ── Main ──

interface Library {
  prompt(options?: unknown): string;
  toSpec(): object;
  toJSONSchema(): object;
}

const ASSET_RE = /\.(css|scss|less|sass|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|eot)(\?.*)?$/i;

function createAssetStubPlugin(): esbuild.Plugin {
  return {
    name: "openui-asset-stub",
    setup(build) {
      build.onResolve({ filter: ASSET_RE }, (args) => {
        const assetPath = args.path.split("?")[0]!;
        const resolvedPath = path.isAbsolute(assetPath)
          ? assetPath
          : path.join(args.resolveDir, assetPath);
        return { path: resolvedPath, namespace: "openui-asset-stub" };
      });

      build.onLoad({ filter: /.*/, namespace: "openui-asset-stub" }, (args) => {
        const ext = path.extname(args.path).toLowerCase();
        const contents =
          ext === ".svg"
            ? "export default {}; export const ReactComponent = () => null;"
            : "export default {};";

        return { contents, loader: "js" };
      });
    },
  };
}

function isLibrary(value: unknown): value is Library {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj["prompt"] === "function" && typeof obj["toSpec"] === "function";
}

function findLibrary(mod: Record<string, unknown>, exportName?: string): Library | undefined {
  if (exportName) {
    const val = mod[exportName];
    return isLibrary(val) ? val : undefined;
  }

  for (const name of ["library", "default"]) {
    if (isLibrary(mod[name])) return mod[name];
  }

  for (const val of Object.values(mod)) {
    if (isLibrary(val)) return val;
  }

  return undefined;
}

interface PromptOptions {
  preamble?: string;
  additionalRules?: string[];
  examples?: string[];
}

function isPromptOptions(value: unknown): value is PromptOptions {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  const hasExamples = Array.isArray(obj["examples"]);
  const hasRules = Array.isArray(obj["additionalRules"]);
  const hasPreamble = typeof obj["preamble"] === "string";
  return hasExamples || hasRules || hasPreamble;
}

function findPromptOptions(
  mod: Record<string, unknown>,
  exportName?: string,
): PromptOptions | undefined {
  if (exportName) {
    const val = mod[exportName];
    return isPromptOptions(val) ? val : undefined;
  }

  // Check well-known names first
  for (const name of ["promptOptions", "options"]) {
    if (isPromptOptions(mod[name])) return mod[name] as PromptOptions;
  }

  // Check any export ending with "PromptOptions" or "promptOptions"
  for (const [key, val] of Object.entries(mod)) {
    if (/[Pp]rompt[Oo]ptions$/.test(key) && isPromptOptions(val)) return val;
  }

  return undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const entryPath = args[0];
  if (!entryPath) {
    console.error(
      "Usage: generate-worker <entryPath> [exportName] [--json-schema] [--prompt-options <name>]",
    );
    process.exit(1);
  }

  const jsonSchema = args.includes("--json-schema");
  const promptOptionsIdx = args.indexOf("--prompt-options");
  const promptOptionsName = promptOptionsIdx !== -1 ? args[promptOptionsIdx + 1] : undefined;
  const reserved = new Set(["--json-schema", "--prompt-options"]);
  if (promptOptionsName) reserved.add(promptOptionsName);
  const exportName = args.find(
    (a, i) => a !== entryPath && !reserved.has(a) && !(i > 0 && args[i - 1] === "--prompt-options"),
  );

  const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), "openui-generate-"));
  const bundlePath = path.join(bundleDir, "entry.cjs");

  let mod: Record<string, unknown> | undefined;
  let importError: unknown;
  try {
    await esbuild.build({
      absWorkingDir: process.cwd(),
      bundle: true,
      entryPoints: [entryPath],
      format: "cjs",
      outfile: bundlePath,
      platform: "node",
      plugins: [createAssetStubPlugin()],
      sourcemap: "inline",
      target: "node18",
      write: true,
    });

    mod = require(bundlePath) as Record<string, unknown>;
  } catch (err) {
    importError = err;
  } finally {
    fs.rmSync(bundleDir, { force: true, recursive: true });
  }

  if (!mod) {
    console.error(`Error: Failed to import ${entryPath}`);
    console.error(importError instanceof Error ? importError.message : importError);
    process.exit(1);
  }

  const library = findLibrary(mod, exportName);

  if (!library) {
    const exports = Object.keys(mod).join(", ");
    console.error(
      `Error: No Library export found.\n` +
        `Found exports: ${exports || "(none)"}\n` +
        `Export a createLibrary() result, or use --export <name> to specify which export to use.`,
    );
    process.exit(1);
  }

  let output: string;
  if (jsonSchema) {
    // Output a PromptSpec-compatible JSON with component signatures, groups, and JSON schema.
    output = JSON.stringify(library.toSpec(), null, 2);
  } else {
    const promptOptions = findPromptOptions(mod, promptOptionsName);
    output = library.prompt(promptOptions);
  }

  process.stdout.write(output);
}

main();
