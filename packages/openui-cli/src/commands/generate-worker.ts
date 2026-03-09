/**
 * Worker script that bundles a user's library file and outputs the system
 * prompt or JSON schema. Asset imports are stubbed during bundling so React
 * component modules can be evaluated without CSS/image/font loaders.
 *
 * argv: [entryPath, exportName?, "--json-schema"?]
 * stdout: the prompt string or JSON schema
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as esbuild from "esbuild";

// ── Main ──

interface Library {
  prompt(options?: unknown): string;
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
  return typeof obj["prompt"] === "function" && typeof obj["toJSONSchema"] === "function";
}

function findLibrary(
  mod: Record<string, unknown>,
  exportName?: string,
): Library | undefined {
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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const entryPath = args[0];
  if (!entryPath) {
    console.error("Usage: generate-worker <entryPath> [exportName] [--json-schema]");
    process.exit(1);
  }

  const jsonSchema = args.includes("--json-schema");
  const exportName = args.find((a) => a !== entryPath && a !== "--json-schema");

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

  const output = jsonSchema
    ? JSON.stringify(library.toJSONSchema(), null, 2)
    : library.prompt();

  process.stdout.write(output);
}

main();
