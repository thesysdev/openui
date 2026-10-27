import * as fs from "node:fs";
import * as path from "node:path";

export type PackageJson = {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  pnpm?: unknown;
  [key: string]: unknown;
};

/** Parse `<dir>/package.json`. Throws when it is missing or not valid JSON. */
export function readPackageJson(dir: string): PackageJson {
  return JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")) as PackageJson;
}

/** Like `readPackageJson`, but returns undefined when it is missing or not valid JSON. */
export function tryReadPackageJson(dir: string): PackageJson | undefined {
  try {
    return readPackageJson(dir);
  } catch {
    return undefined;
  }
}
