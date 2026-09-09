import * as fs from "node:fs";
import * as path from "node:path";

import { CreateError } from "./telemetry";

/** True for `"1"` or `"true"` (any case). */
export const isTruthyEnv = (value?: string) => value === "1" || value?.toLowerCase() === "true";

const ENV_VAR_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

function isKeyLine(line: string, name: string): boolean {
  return new RegExp(`^\\s*#?\\s*${name}\\s*=`).test(line);
}

/** POSIX-style env names: letters, digits, underscores; must not start with a digit. */
export function assertValidEnvVarName(name: string, flag = "environment variable name"): void {
  if (!ENV_VAR_NAME.test(name)) {
    throw new CreateError(
      "args_resolution",
      `Invalid ${flag} "${name}". Must start with a letter or underscore, then letters, digits, or underscores.`,
      "invalid_input",
      "INVALID_ENV_ASSIGNMENT",
    );
  }
}

/**
 * Create or update `name=value` in an env file. Replaces the first matching
 * assignment (including a commented one) and otherwise appends.
 */
export function upsertEnvVar(filePath: string, name: string, value: string): void {
  assertValidEnvVarName(name);
  if (/[\r\n]/.test(value)) {
    throw new CreateError(
      "args_resolution",
      "Invalid env assignment. Value cannot contain newlines.",
      "invalid_input",
      "INVALID_ENV_ASSIGNMENT",
    );
  }
  const assignment = `${name}=${value}`;

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
