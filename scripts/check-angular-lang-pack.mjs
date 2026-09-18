import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "openui-angular-pack-"));

try {
  const archive = join(temporaryDirectory, "angular-lang.tgz");
  // Match the workspace release path, not an explicit pack of dist/angular-lang.
  execFileSync("pnpm", ["pack", "--out", archive], {
    cwd: join(root, "packages/angular-lang"),
    stdio: "inherit",
  });
  const files = new Set(
    execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).trim().split("\n"),
  );
  const manifest = JSON.parse(
    execFileSync("tar", ["-xOf", archive, "package/package.json"], { encoding: "utf8" }),
  );
  assert.equal(manifest.name, "@openuidev/angular-lang");
  assert(
    [...files].some((file) => /^package\/fesm2022\/.*\.mjs$/.test(file)),
    "Missing Angular runtime",
  );
  assert(
    [...files].some((file) => file.endsWith(".d.ts")),
    "Missing declarations",
  );
  assert(
    manifest.module && manifest.typings && manifest.exports?.["."],
    "Missing entry-point metadata",
  );

  function checkEntryPoints(value) {
    if (typeof value === "string") {
      assert(files.has(`package/${value.replace(/^\.\//, "")}`), `Missing entry point: ${value}`);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(checkEntryPoints);
    }
  }
  checkEntryPoints(manifest.module);
  checkEntryPoints(manifest.typings);
  checkEntryPoints(manifest.exports);
  for (const field of ["dependencies", "peerDependencies"]) {
    for (const [name, version] of Object.entries(manifest[field] ?? {})) {
      assert(!/^(workspace|catalog):/.test(version), `Unresolved ${field}: ${name}`);
    }
  }
  assert(
    !manifest.publishConfig?.directory,
    "Generated package must not redirect publishing again",
  );
  console.log("Angular workspace pack contains runtime, declarations, and valid entry points.");
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
