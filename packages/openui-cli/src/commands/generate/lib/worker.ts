/**
 * Worker script that bundles a user's library file and outputs the system
 * prompt, JSON schema, or serialized library spec. Asset imports are stubbed
 * during bundling so React component modules can be evaluated without
 * CSS/image/font loaders.
 *
 * argv: [entryPath, exportName?, "--json-schema"?, "--spec"?, "--prompt-options", name?,
 *        "--component-allowlist", "Card,Table"?, "--no-include-dependencies"?]
 * stdout: one artifact for the mode flags; default emits BOTH the prompt and
 * the spec JSON, joined by SEPARATION_DELIMITER (run.ts splits them).
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as esbuild from "esbuild";
import { SEPARATION_DELIMITER } from "./delimiter";

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
  toolExamples?: string[];
  editMode?: boolean;
  inlineMode?: boolean;
  toolCalls?: boolean;
  bindings?: boolean;
  componentAllowlist?: { components: string[]; includeDependencies?: boolean };
}

function isPromptOptions(value: unknown): value is PromptOptions {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj["examples"]) ||
    Array.isArray(obj["additionalRules"]) ||
    Array.isArray(obj["toolExamples"]) ||
    typeof obj["preamble"] === "string" ||
    typeof obj["editMode"] === "boolean" ||
    typeof obj["inlineMode"] === "boolean" ||
    typeof obj["toolCalls"] === "boolean" ||
    typeof obj["bindings"] === "boolean" ||
    (typeof obj["componentAllowlist"] === "object" && obj["componentAllowlist"] !== null)
  );
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
  const spec = args.includes("--spec");
  const promptOptionsIdx = args.indexOf("--prompt-options");
  const promptOptionsName = promptOptionsIdx !== -1 ? args[promptOptionsIdx + 1] : undefined;
  const noIncludeDependencies = args.includes("--no-include-dependencies");
  const allowlistIdx = args.indexOf("--component-allowlist");
  const allowlistArg = allowlistIdx !== -1 ? args[allowlistIdx + 1] : undefined;
  const valueFlags = new Set(["--prompt-options", "--component-allowlist"]);
  const reserved = new Set(["--json-schema", "--spec", "--no-include-dependencies", ...valueFlags]);
  const exportName = args.find(
    (a, i) => a !== entryPath && !reserved.has(a) && !(i > 0 && valueFlags.has(args[i - 1]!)),
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
  if (spec) {
    // The spec always carries the full library; componentAllowlist only subsets the prompt.
    const { componentAllowlist: _, ...promptOptions } =
      findPromptOptions(mod, promptOptionsName) ?? {};
    output = JSON.stringify(
      {
        ...library.toSpec(),
        schema: library.toJSONSchema(),
        ...(Object.keys(promptOptions).length ? { promptOptions } : {}),
      },
      null,
      2,
    );
  } else if (jsonSchema) {
    // Output a PromptSpec-compatible JSON with component signatures, groups, and JSON schema.
    output = JSON.stringify(library.toJSONSchema(), null, 2);
  } else {
    // This behaviour will be deprecated in next major release
    // and only export standardised payloads
    const promptOptions: PromptOptions = { ...findPromptOptions(mod, promptOptionsName) };
    if (allowlistArg !== undefined) {
      promptOptions.componentAllowlist = {
        components: allowlistArg
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        ...(noIncludeDependencies ? { includeDependencies: false } : {}),
      };
    } else if (noIncludeDependencies && promptOptions.componentAllowlist) {
      // On its own, --no-include-dependencies refines an allowlist from the module's PromptOptions.
      promptOptions.componentAllowlist = {
        ...promptOptions.componentAllowlist,
        includeDependencies: false,
      };
    }
    output = [
      library.prompt(promptOptions),
      JSON.stringify({ ...library.toSpec(), schema: library.toJSONSchema() }, null, 2),
    ].join(SEPARATION_DELIMITER); // record-separator-joined so generate.ts can split multi-artifact payloads
  }

  process.stdout.write(output);
}

main();
