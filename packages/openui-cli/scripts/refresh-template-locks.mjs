import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Regenerate both template lockfiles from the same registry state. npm and pnpm
// must agree on the resolved versions (see compare-template-installs.mjs), so
// they are always refreshed together — never edit or refresh one on its own.

const repoRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const templatesDir = path.join(repoRoot, "templates");
const requested = process.argv.slice(2);
const templates =
  requested.length > 0
    ? requested
    : fs
        .readdirSync(templatesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

for (const template of templates) {
  const templateDir = path.join(templatesDir, template);
  if (!fs.existsSync(path.join(templateDir, "package.json"))) {
    console.error(`Skipping ${template}: no package.json`);
    continue;
  }

  console.info(`Refreshing lockfiles for ${template}`);
  for (const lockfile of ["package-lock.json", "pnpm-lock.yaml"]) {
    fs.rmSync(path.join(templateDir, lockfile), { force: true });
  }

  run("npm", ["install", "--package-lock-only", "--no-audit", "--no-fund"], templateDir);
  run("pnpm", ["install", "--lockfile-only"], templateDir);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(`${command} ${args.join(" ")} failed in ${cwd}`);
    process.exit(result.status ?? 1);
  }
}
