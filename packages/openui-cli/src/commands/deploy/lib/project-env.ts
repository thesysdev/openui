import { loadAllowlistedProjectEnv } from "../../../lib/env";

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
