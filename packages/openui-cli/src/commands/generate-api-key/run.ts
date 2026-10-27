import * as fs from "node:fs";
import * as path from "node:path";

import { assertValidApiKeyName, CloudAuthError, mintCloudApiKey } from "../../lib/auth/mint";
import { AuthTelemetryClient } from "../../lib/auth/telemetry";
import type { CliContext } from "../../lib/context";
import { resolveInstallPackageManager } from "../../lib/detect-package-manager";
import { assertValidEnvVarName, DEFAULT_ENV_FILE, upsertEnvVar } from "../../lib/env";
import { runDevCommand } from "../create/lib/dev-server";
import { GenerateApiKeyTelemetryClient } from "./lib/telemetry";

export interface GenerateApiKeyOptions {
  file?: string;
  key?: string;
  name?: string;
  dev?: boolean;
}

const DEFAULT_ENV_KEY = "THESYS_API_KEY";
const DEV_STARTUP_TIMEOUT_MS = 60_000;

function hasDevScript(cwd: string): boolean {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8")) as {
      scripts?: Record<string, unknown>;
    };
    return typeof pkg.scripts?.["dev"] === "string";
  } catch {
    return false;
  }
}

function resolveProjectName(explicit: string | undefined, cwd: string): string {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8")) as {
      name?: unknown;
    };
    if (typeof pkg.name === "string" && pkg.name.trim()) return pkg.name.trim();
  } catch {
    /* no package.json, or it isn't valid JSON */
  }
  return path.basename(cwd) || "OpenUI Cloud App";
}

export async function runGenerateApiKey(
  options: GenerateApiKeyOptions,
  ctx: CliContext,
): Promise<void> {
  const tel = new GenerateApiKeyTelemetryClient(ctx.telemetry);
  const authTel = new AuthTelemetryClient(ctx.telemetry);
  const t0 = Date.now();
  const file = options.file?.trim() || DEFAULT_ENV_FILE;
  const envKey = options.key?.trim() || DEFAULT_ENV_KEY;
  const projectName = resolveProjectName(options.name, ctx.cwd);
  assertValidEnvVarName(envKey, "--key");
  if (options.name?.trim()) assertValidApiKeyName(projectName);

  tel.trackStarted({
    env_file: path.basename(file),
    env_key: envKey,
  });

  // The sign-in happens in a browser and needs a person at the terminal;
  // without one this would wait on a callback that never arrives.
  if (!ctx.detectedInteractive) {
    const { dlxCmd } = resolveInstallPackageManager();
    const fileArg = file === DEFAULT_ENV_FILE ? "" : ` --file ${file}`;
    throw new CloudAuthError(
      "method_resolution",
      "INTERACTIVE_REQUIRED",
      "generate-api-key signs you in through a browser, so it needs an interactive shell. " +
        `Run this command yourself in a terminal:\n\n> ${dlxCmd} @openuidev/cli@latest generate-api-key${fileArg}`,
    );
  }

  const apiKey = await mintCloudApiKey(projectName, authTel);

  const filePath = path.resolve(ctx.cwd, file);
  upsertEnvVar(filePath, envKey, apiKey);

  const displayPath = path.relative(ctx.cwd, filePath) || file;
  console.info(`✅ ${envKey} written to ${displayPath}`);

  tel.trackSucceeded({
    auth_method: "oauth",
    env_file: path.basename(file),
    env_key: envKey,
    duration_ms: Date.now() - t0,
  });

  if (options.dev === false || !hasDevScript(ctx.cwd)) return;

  const { runCmd } = resolveInstallPackageManager();
  console.info(`\nStarting the development server...\n\n> ${runCmd} run dev\n`);
  const devResult = await runDevCommand(runCmd, ctx.cwd, {
    startupTimeoutMs: DEV_STARTUP_TIMEOUT_MS,
  });
  const stoppedByUser =
    !devResult.timedOut &&
    (devResult.status === 0 ||
      devResult.status === 130 ||
      devResult.status === 143 ||
      devResult.signal === "SIGINT" ||
      devResult.signal === "SIGTERM");
  if (stoppedByUser) return;

  console.error(`\nDevelopment server did not start. Retry with:\n\n> ${runCmd} run dev\n`);
  process.exitCode = devResult.timedOut ? 1 : (devResult.status ?? 1);
}
