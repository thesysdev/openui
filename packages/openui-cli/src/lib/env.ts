import * as fs from "node:fs";
import * as path from "node:path";

import { CreateError } from "./telemetry";

/** True for `"1"` or `"true"` (any case). */
export const isTruthyEnv = (value?: string) => value === "1" || value?.toLowerCase() === "true";

export const DEFAULT_ENV_FILE = ".env";
export const PROJECT_ENV_FILES = [".env", ".env.local"] as const;

/** Parse a dotenv-style file into key/value pairs (no expansion). */
export function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Merge env files (later files win) and keep only allowlisted keys with
 * non-empty values. Values are never logged by this helper.
 */
export function loadAllowlistedEnvFiles(
  filePaths: string[],
  allowlist: readonly string[],
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const filePath of filePaths) {
    Object.assign(merged, parseEnvFile(filePath));
  }
  const allowlisted: Record<string, string> = {};
  for (const key of allowlist) {
    const value = merged[key]?.trim();
    if (value) allowlisted[key] = value;
  }
  return allowlisted;
}

/** Load allowlisted keys from the usual project env files (`.env`, `.env.local`). */
export function loadAllowlistedProjectEnv(
  projectDir: string,
  allowlist: readonly string[],
  fileNames: readonly string[] = PROJECT_ENV_FILES,
): Record<string, string> {
  return loadAllowlistedEnvFiles(
    fileNames.map((name) => path.join(projectDir, name)),
    allowlist,
  );
}

const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=[^\r\n]*$/;

function isKeyLine(line: string, name: string): boolean {
  return new RegExp(`^\\s*#?\\s*${name}\\s*=`).test(line);
}

/**
 * Create or update `name=value` in an env file. Replaces the first matching
 * assignment (including a commented one) and otherwise appends.
 */
export function upsertEnvVar(filePath: string, name: string, value: string): void {
  const assignment = `${name}=${value}`;
  if (!ENV_ASSIGNMENT.test(assignment)) {
    throw new CreateError(
      "args_resolution",
      "Invalid env assignment. Name must use letters, digits, and underscores; value cannot contain newlines.",
      "invalid_input",
      "INVALID_ENV_ASSIGNMENT",
    );
  }

  const resolved = path.resolve(filePath);
  let content = "";
  try {
    content = fs.readFileSync(resolved, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.length === 0 ? [] : content.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  const replaceAt = lines.findIndex((line) => isKeyLine(line, name));
  if (replaceAt >= 0) lines[replaceAt] = assignment;
  else lines.push(assignment);

  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, lines.join(newline) + newline);
}
