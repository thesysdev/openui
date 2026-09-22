import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import type { OverlayManifest } from "../../commands/create/lib/overlays";
import type { PackageManagerName } from "../detect-package-manager";

/** Match npm/pnpm install: keep dependency keys alphabetically sorted. */
function sortPackageRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

export function rewritePackageJson(
  projectDir: string,
  name: string,
  packageManager: PackageManagerName,
  overlayPackageJson?: OverlayManifest["packageJson"],
) {
  // package.json: set the project name and de-vendor monorepo-local deps
  // (workspace:* / file: / catalog:) to the published "latest". link: deps are
  // rewritten to an absolute file: path so locally-linked packages (e.g.
  // @openuidev/thesys) keep resolving against the developer's checkout under any
  // package manager — npm rejects link:, and ~ isn't expanded. Temporary, until
  // these packages are published.
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    name: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    pnpm?: unknown;
  };
  pkg.name = name;
  if (packageManager !== "pnpm") delete pkg.pnpm;

  if (overlayPackageJson) {
    pkg.dependencies ??= {};
    for (const dependency of overlayPackageJson.removeDependencies ?? []) {
      delete pkg.dependencies[dependency];
    }
    Object.assign(pkg.dependencies, overlayPackageJson.dependencies ?? {});
    Object.assign((pkg.devDependencies ??= {}), overlayPackageJson.devDependencies ?? {});
    Object.assign((pkg.scripts ??= {}), overlayPackageJson.scripts ?? {});
  }

  for (const section of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const key of Object.keys(deps)) {
      const v = deps[key];
      if (!v) continue;
      if (v.startsWith("link:")) {
        const target = v.slice("link:".length);
        const abs = target.startsWith("~")
          ? path.join(os.homedir(), target.slice(1))
          : path.resolve(target);
        deps[key] = `file:${abs}`;
        continue;
      }
      // workspace:/file:/catalog: are monorepo-only protocols npm/yarn/bun
      // can't resolve standalone — pin them to the published "latest".
      if (/^(workspace:|file:|catalog:)/.test(v)) deps[key] = "latest";
    }
    // Object.assign appends overlay packages at the end; re-sort so the
    // scaffolded package.json matches what `npm install` / `pnpm add` write.
    pkg[section] = sortPackageRecord(deps);
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // Keep the copied npm lockfile's root package metadata aligned so npm ci can
  // consume the template without having to rewrite or re-resolve it.
  const lockPath = path.join(projectDir, "package-lock.json");
  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8")) as {
      name?: string;
      packages?: Record<
        string,
        {
          name?: string;
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        }
      >;
    };
    lock.name = name;
    const lockRoot = lock.packages?.[""];
    if (lockRoot) {
      lockRoot.name = name;
      lockRoot.dependencies = pkg.dependencies;
      lockRoot.devDependencies = pkg.devDependencies;
    }
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
  }
}
