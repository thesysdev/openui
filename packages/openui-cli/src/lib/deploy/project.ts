import * as fs from "node:fs";
import * as path from "node:path";

import { CreateError } from "../telemetry";

type ProjectPackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/** Read dependencies and devDependencies from package.json. */
export function readProjectDependencies(projectDir: string): Record<string, string> {
  const pkgPath = path.join(projectDir, "package.json");
  let pkg: ProjectPackageJson;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as ProjectPackageJson;
  } catch {
    throw new CreateError(
      "args_resolution",
      `Invalid package.json in ${projectDir}.`,
      "invalid_input",
      "INVALID_PACKAGE_JSON",
    );
  }
  return { ...pkg.dependencies, ...pkg.devDependencies };
}

/** True when the project depends on at least one `@openuidev/*` package. */
export function hasOpenUiPackages(deps: Record<string, string>): boolean {
  return Object.keys(deps).some((name) => name.startsWith("@openuidev/"));
}

/** Require an OpenUI app (any `@openuidev/*` dependency). */
export function assertOpenUiProject(projectDir: string): void {
  if (hasOpenUiPackages(readProjectDependencies(projectDir))) return;
  throw new CreateError(
    "args_resolution",
    "Not an OpenUI project. Run this from an OpenUI app, or pass its directory.",
    "invalid_input",
    "NOT_OPENUI_PROJECT",
  );
}
