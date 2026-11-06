import * as fs from "node:fs";
import * as path from "node:path";

import { resolveCloudApiKey, THESYS_KEYS_URL } from "../../../lib/auth/mint";
import { DEFAULT_ENV_FILE, upsertEnvVar } from "../../../lib/env";
import { CliCancelledError, cliErrorProperties } from "../../../lib/errors";
import type { CreateAppOptions, EnvResult } from "./create-types";
import type { CreateTelemetryClient } from "./telemetry";

export function buildAppId(name: string): string {
  // Stable per-scaffold identity (see writeEnv). Slugified because the name is
  // free-form and APP_ID lands in .env and ?app_id= query params; the random
  // suffix keeps two same-named apps in one org from colliding.
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

export function writeEnvVar(filePath: string, name: string, value: string): void {
  upsertEnvVar(filePath, name, value);
}

export async function writeEnv(
  targetDir: string,
  result: EnvResult,
  appId?: string,
): Promise<void> {
  // APP_ID is the scaffold's stable identity: the frontend-token route sends
  // it as `app_id`, so every conversation this app creates is bound to it and
  // apps sharing one org API key stay isolated from each other. It must stay
  // stable for the app's lifetime — regenerating it orphans existing threads.
  const dest = path.join(targetDir, DEFAULT_ENV_FILE);
  const vars = { ...result.envVars };
  if (appId) vars["APP_ID"] = appId;
  const names = Object.keys(vars);
  if (names.length === 0) {
    if (!result.envStub) return;
    await fs.promises.writeFile(dest, result.envStub);
    return;
  }
  for (const name of names) {
    writeEnvVar(dest, name, vars[name] ?? "");
  }
}

/** `.env` values for an OpenUI Cloud app; the key stays empty until sign-in fills it. */
export function cloudEnvVars(apiKey = ""): Record<string, string> {
  return { THESYS_API_KEY: apiKey, DEMO_USER_ID: "demo-user" };
}

export async function resolveCloudEnv(
  name: string,
  options: CreateAppOptions,
  interactive: boolean,
  agent: string | undefined,
  tel: CreateTelemetryClient,
): Promise<EnvResult> {
  const envFile = options.envFile ?? DEFAULT_ENV_FILE;
  // Sign-in can't be skipped from the prompt, so a key already exported in the
  // shell (which the dev server inherits) is the one way past it besides Ctrl+C.
  const skipReason = !interactive
    ? agent
      ? "Coding agent detected"
      : "Non-interactive run"
    : process.env["THESYS_API_KEY"]?.trim()
      ? "THESYS_API_KEY is already set"
      : undefined;
  console.info();
  if (skipReason) console.info(`${skipReason} — skipping OpenUI Cloud sign-in.`);
  let apiKey: string | null = null;
  let authMethod: EnvResult["authMethod"];
  try {
    tel.trackCloudAuthStarted();
    const resolved = await resolveCloudApiKey({
      projectName: name,
      interactive: !skipReason,
      tel: tel.authClient(),
    });
    apiKey = resolved.key;
    authMethod = resolved.method;
    tel.trackCloudAuthMethod({
      auth_method: resolved.method,
      auth_succeeded: apiKey != null,
    });
  } catch (err) {
    if (err instanceof CliCancelledError) {
      tel.trackCloudAuthCancelled({
        auth_succeeded: false,
        ...cliErrorProperties(err),
      });
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    const properties = cliErrorProperties(err, {
      failure_stage: "cloud_auth",
      error_class: "authentication",
      error_code: "AUTH_FAILED",
    });
    tel.trackCloudAuthFailed({
      auth_succeeded: false,
      ...properties,
    });
    console.error(`\n[!] Could not obtain an API key: ${msg}`);
    console.error(`  Add THESYS_API_KEY to ${envFile} later (keys: ${THESYS_KEYS_URL}).\n`);
  }
  return {
    envWritten: apiKey != null,
    envVars: cloudEnvVars(apiKey ?? undefined),
    authMethod,
    authSucceeded: apiKey != null,
  };
}
