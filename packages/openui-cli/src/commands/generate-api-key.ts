import * as fs from "node:fs";
import * as path from "node:path";

import { mintCloudApiKey } from "../auth/mint";
import { DEFAULT_ENV_FILE, upsertEnvVar } from "../lib/env";
import { telemetry } from "../lib/telemetry";

export interface GenerateApiKeyOptions {
  file?: string;
  key?: string;
  name?: string;
}

const DEFAULT_ENV_KEY = "THESYS_API_KEY";

function resolveProjectName(explicit?: string): string {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
      name?: unknown;
    };
    if (typeof pkg.name === "string" && pkg.name.trim()) return pkg.name.trim();
  } catch {
    /* no package.json, or it isn't valid JSON */
  }
  return path.basename(process.cwd()) || "OpenUI Cloud App";
}

export async function runGenerateApiKey(options: GenerateApiKeyOptions): Promise<void> {
  const t0 = Date.now();
  const file = options.file?.trim() || DEFAULT_ENV_FILE;
  const envKey = options.key?.trim() || DEFAULT_ENV_KEY;
  const projectName = resolveProjectName(options.name);

  telemetry.capture("cli_generate_api_key_started", {
    env_file: path.basename(file),
    env_key: envKey,
  });

  const apiKey = await mintCloudApiKey(projectName);

  const filePath = path.resolve(process.cwd(), file);
  upsertEnvVar(filePath, envKey, apiKey);

  const displayPath = path.relative(process.cwd(), filePath) || file;
  console.info(`✅ ${envKey} written to ${displayPath}`);

  telemetry.capture("cli_generate_api_key_succeeded", {
    auth_method: "oauth",
    env_file: path.basename(file),
    env_key: envKey,
    duration_ms: Date.now() - t0,
  });
}
