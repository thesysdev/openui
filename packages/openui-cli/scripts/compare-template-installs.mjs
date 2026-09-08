import fs from "node:fs";
import path from "node:path";

const [npmDirArg, pnpmDirArg] = process.argv.slice(2);

if (!npmDirArg || !pnpmDirArg) {
  console.error(
    "Usage: compare-template-installs.mjs <npm-project-dir> <pnpm-project-dir>",
  );
  process.exit(2);
}

const npmDir = path.resolve(npmDirArg);
const pnpmDir = path.resolve(pnpmDirArg);
const manifest = readJson(path.join(npmDir, "package.json"));

// Dependencies declared with ranges can resolve differently: npm uses the
// committed lockfile while pnpm resolves them independently. Compare installed
// direct dependencies so CI catches that drift even when both builds succeed.
const dependencyNames = [
  ...new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ]),
].sort();

const mismatches = [];

for (const dependency of dependencyNames) {
  const npmVersion = installedVersion(npmDir, dependency);
  const pnpmVersion = installedVersion(pnpmDir, dependency);

  if (npmVersion !== pnpmVersion) {
    mismatches.push({ dependency, npmVersion, pnpmVersion });
  }
}

if (mismatches.length > 0) {
  console.error("npm and pnpm resolved different direct dependency versions:");
  console.table(mismatches);
  process.exit(1);
}

console.info(
  `npm and pnpm resolved the same versions for ${dependencyNames.length} direct dependencies.`,
);

function installedVersion(projectDir, dependency) {
  const manifestPath = path.join(
    projectDir,
    "node_modules",
    dependency,
    "package.json",
  );
  return readJson(manifestPath).version;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
