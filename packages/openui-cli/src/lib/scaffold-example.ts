import * as fs from "node:fs";
import * as path from "node:path";

import { checkoutSource } from "./checkout";
import type { PackageManagerName } from "./detect-package-manager";
import type { ExampleProject } from "./projects";
import {
  pruneScaffoldLockfiles,
  restoreDotfiles,
  rewriteScaffoldPackageJson,
} from "./scaffold-package";
import { CreateError } from "./telemetry";

const ARTIFACT_DIRS = new Set(["node_modules", ".next", ".turbo", "dist", ".nuxt", ".svelte-kit"]);

const GENERATE_SCRIPT_RE =
  /pnpm --filter @openuidev\/cli build && node (?:\.\.\/)+packages\/openui-cli\/dist\/index\.js generate/;
const GENERATE_SCRIPT_FALLBACK_RE =
  /node (?:\.\.\/)+packages\/openui-cli\/dist\/index\.js generate/;

export type ExampleLayout = {
  /** Directories with a `package.json`, relative to the example root (`"."` = root). */
  jsPackages: string[];
  /** Directories with a `pyproject.toml`, relative to the example root. */
  pythonPackages: string[];
};

function collectRelativeDirs(dir: string, fileName: string, root = dir): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ARTIFACT_DIRS.has(entry.name) || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectRelativeDirs(full, fileName, root));
      continue;
    }
    if (entry.name !== fileName) continue;
    const relative = path.relative(root, dir);
    found.push(relative === "" ? "." : relative);
  }
  return found;
}

export function exampleLayout(projectDir: string): ExampleLayout {
  return {
    jsPackages: collectRelativeDirs(projectDir, "package.json"),
    pythonPackages: collectRelativeDirs(projectDir, "pyproject.toml"),
  };
}

export function isNestedExample(layout: ExampleLayout): boolean {
  return layout.jsPackages.length > 0 && !layout.jsPackages.includes(".");
}

export function exampleDevCommand(pkgDir: string, runCmd: string): string {
  const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  if (pkg.scripts?.["dev"]) return `${runCmd} run dev`;
  if (pkg.scripts?.["start"]) return `${runCmd} start`;
  return `${runCmd} run dev`;
}

function rewriteGenerateScript(value: string): string {
  if (GENERATE_SCRIPT_RE.test(value)) {
    return value.replace(GENERATE_SCRIPT_RE, "npx @openuidev/cli generate");
  }
  if (GENERATE_SCRIPT_FALLBACK_RE.test(value)) {
    return value.replace(GENERATE_SCRIPT_FALLBACK_RE, "npx @openuidev/cli generate");
  }
  return value;
}

function copyEnvExamples(projectDir: string): void {
  const mappings: Array<[string, string]> = [
    [".env.example", ".env"],
    [".env.local.example", ".env.local"],
    ["env.example", ".env"],
  ];

  const visit = (dir: string) => {
    for (const [fromName, toName] of mappings) {
      const from = path.join(dir, fromName);
      const to = path.join(dir, toName);
      if (fs.existsSync(from)) {
        if (!fs.existsSync(to)) {
          fs.copyFileSync(from, to);
        }
        fs.unlinkSync(from);
      }
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || ARTIFACT_DIRS.has(entry.name)) continue;
      visit(path.join(dir, entry.name));
    }
  };

  visit(projectDir);
}

export async function scaffoldExample(params: {
  example: ExampleProject;
  targetDir: string;
  name: string;
  packageManager: PackageManagerName;
}): Promise<ExampleLayout> {
  const { example, targetDir, name, packageManager } = params;

  try {
    await checkoutSource(example.path, { dest: targetDir });
  } catch (err) {
    if (err instanceof CreateError) throw err;
    throw new CreateError(
      "scaffold",
      err instanceof Error ? err.message : String(err),
      "filesystem",
      "EXAMPLE_SCAFFOLD_FAILED",
    );
  }

  const layout = exampleLayout(targetDir);
  if (layout.jsPackages.length === 0 && layout.pythonPackages.length === 0) {
    throw new CreateError(
      "scaffold",
      `Example "${example.name}" was not found at ${example.path}.`,
      "filesystem",
      "EXAMPLE_MISSING",
    );
  }

  restoreDotfiles(targetDir);

  for (const relative of layout.jsPackages) {
    const pkgDir = relative === "." ? targetDir : path.join(targetDir, relative);
    rewriteScaffoldPackageJson({
      pkgPath: path.join(pkgDir, "package.json"),
      name: relative === "." ? name : undefined,
      packageManager,
      rewriteScript: rewriteGenerateScript,
    });
    pruneScaffoldLockfiles(pkgDir, packageManager, { keepPnpmWorkspace: true });
  }

  copyEnvExamples(targetDir);
  return layout;
}
