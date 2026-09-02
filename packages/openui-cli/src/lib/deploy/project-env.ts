import * as fs from "node:fs";
import * as path from "node:path";

import { loadAllowlistedProjectEnv } from "../env";

/** Known OpenUI template env keys. Values must never be logged or sent to telemetry. */
export const DEPLOY_ENV_ALLOWLIST = [
  "THESYS_API_KEY",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "APP_ID",
  "DEMO_USER_ID",
  "LANGGRAPH_API_URL",
  "LANGGRAPH_ASSISTANT_ID",
  "LANGSMITH_API_KEY",
] as const;

/** Prefer secret storage on platforms that distinguish secret vs config. */
export const SENSITIVE_DEPLOY_ENV_KEYS = new Set([
  "THESYS_API_KEY",
  "OPENAI_API_KEY",
  "LANGSMITH_API_KEY",
]);

export function loadProjectDeployEnv(projectDir: string): Record<string, string> {
  return loadAllowlistedProjectEnv(projectDir, DEPLOY_ENV_ALLOWLIST);
}

export function detectRequiredDeployEnvNames(projectDir: string): string[] {
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps["@openuidev/thesys-server"] || deps["@openuidev/thesys"]) return ["THESYS_API_KEY"];
  if (deps["openai"] || deps["ai"] || deps["@ai-sdk/openai"]) return ["OPENAI_API_KEY"];
  return [];
}

export function warnMissingRequiredDeployEnv(
  projectDir: string,
  localEnv: Record<string, string>,
  platformLabel: string,
): void {
  for (const key of detectRequiredDeployEnvNames(projectDir)) {
    if (localEnv[key] || process.env[key]?.trim()) continue;
    console.info(
      `[!] ${key} is not set locally. This deployment will fail at runtime unless ${key} is already configured on ${platformLabel}.\n`,
    );
  }
}
