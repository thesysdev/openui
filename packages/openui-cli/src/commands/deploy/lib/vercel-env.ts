import * as fs from "node:fs";
import * as path from "node:path";

import { DEFAULT_ENV_FILE, parseEnvFile, removeEnvVar, upsertEnvVar } from "../../../lib/env";

const VERCEL_WRITTEN_ENV_KEYS = [
  "VERCEL_TOKEN",
  "VERCEL_OIDC_TOKEN",
  "VERCEL_ORG_ID",
  "VERCEL_PROJECT_ID",
] as const;

/** `.env` when it already exists (OpenUI default); otherwise `.env.local`. */
function resolveProjectEnvFileName(projectDir: string): string {
  return fs.existsSync(path.join(projectDir, DEFAULT_ENV_FILE)) ? DEFAULT_ENV_FILE : ".env.local";
}

/**
 * Vercel always writes `.env.local`. If the project already has `.env`, move
 * those Vercel keys there and drop an emptied `.env.local`.
 */
export function adoptVercelEnvVars(projectDir: string): void {
  const targetName = resolveProjectEnvFileName(projectDir);
  if (targetName === ".env.local") return;
  const localPath = path.join(projectDir, ".env.local");
  if (!fs.existsSync(localPath)) return;

  const fromLocal = parseEnvFile(localPath);
  const targetPath = path.join(projectDir, targetName);
  for (const key of VERCEL_WRITTEN_ENV_KEYS) {
    const value = fromLocal[key]?.trim();
    if (!value || /[\r\n]/.test(value)) continue;
    upsertEnvVar(targetPath, key, value);
    removeEnvVar(localPath, key);
  }
  if (fs.existsSync(localPath) && fs.readFileSync(localPath, "utf8").trim() === "") {
    fs.unlinkSync(localPath);
  }
}
