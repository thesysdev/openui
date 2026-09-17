import { loadAllowlistedProjectEnv } from "../env";
import { readProjectDependencies } from "./project";

/** Known OpenUI template env keys. Values must never be logged or sent to telemetry. */
export const DEPLOY_ENV_ALLOWLIST = [
  "THESYS_API_KEY",
  "THESYS_API_BASE_URL",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "OPENUI_MODEL",
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

/** Load allowlisted keys explicitly stored in the project's env files. */
export function loadProjectDeployFileEnv(projectDir: string): Record<string, string> {
  return loadAllowlistedProjectEnv(projectDir, DEPLOY_ENV_ALLOWLIST);
}

/** Load effective deploy env; shell values override `.env.local`, then `.env`. */
export function loadProjectDeployEnv(projectDir: string): Record<string, string> {
  const env = loadProjectDeployFileEnv(projectDir);
  for (const key of DEPLOY_ENV_ALLOWLIST) {
    const value = process.env[key]?.trim();
    if (value) env[key] = value;
  }
  return env;
}

/** Infer required API-key names from the project's dependencies. */
export function detectRequiredDeployEnvNames(projectDir: string): string[] {
  const deps = readProjectDependencies(projectDir);
  if (deps["@openuidev/thesys-server"] || deps["@openuidev/thesys"]) return ["THESYS_API_KEY"];
  if (deps["openai"] || deps["ai"] || deps["@ai-sdk/openai"]) return ["OPENAI_API_KEY"];
  return [];
}

/** Warn when a required key is missing locally and may also be missing on the platform. */
export function warnMissingRequiredDeployEnv(
  projectDir: string,
  localEnv: Record<string, string>,
  platformLabel: string,
): void {
  for (const key of detectRequiredDeployEnvNames(projectDir)) {
    if (localEnv[key]) continue;
    console.info(
      `[!] ${key} is not set locally. This deployment will fail at runtime unless ${key} is already configured on ${platformLabel}.\n`,
    );
  }
}
