import { CreateError } from "../../../lib/errors";
import { readPackageJson, type PackageJson } from "../../../lib/package-json";

/** Parse the project's package.json. */
export function readProjectPackageJson(projectDir: string): PackageJson {
  try {
    return readPackageJson(projectDir);
  } catch {
    throw new CreateError(
      "args_resolution",
      `Invalid package.json in ${projectDir}.`,
      "invalid_input",
      "INVALID_PACKAGE_JSON",
    );
  }
}

/** Read dependencies and devDependencies from package.json. */
export function readProjectDependencies(projectDir: string): Record<string, string> {
  const pkg = readProjectPackageJson(projectDir);
  return { ...pkg.dependencies, ...pkg.devDependencies };
}

/** True when the project depends on at least one `@openuidev/*` package. */
export function hasOpenUiPackages(deps: Record<string, string>): boolean {
  return Object.keys(deps).some((name) => name.startsWith("@openuidev/"));
}
