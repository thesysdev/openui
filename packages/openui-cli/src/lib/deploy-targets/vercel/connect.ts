import * as fs from "node:fs";
import * as path from "node:path";

import type { CliInvocation } from "../../cli-bin";
import { readProjectPackageJson } from "../../deploy/project";
import { canPromptInteractive } from "../../deploy/prompt";
import type { DeployTargetOptions } from "../../deploy/types";
import { adoptVercelEnvVars, loadAllowlistedProjectEnv } from "../../env";
import { mutedNpmEnv, runCommand } from "../../process-runner";
import { withSpinner } from "../../spinner";
import { CreateError } from "../../telemetry";
import { throwCommandFailure } from "../../utils";
import { vercelLinkScopeArgs, vercelSpawnArgs } from "./args";

/** Auth vars Vercel CLI reads. OpenUI apps keep these in `.env`; Vercel often writes `.env.local`. */
const VERCEL_CLI_ENV_KEYS = ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"] as const;

/** Spawn env for Vercel CLI: process env wins, then `.env` / `.env.local`. */
export function vercelCliEnv(projectDir: string): NodeJS.ProcessEnv {
  const fromFiles = loadAllowlistedProjectEnv(projectDir, VERCEL_CLI_ENV_KEYS);
  const env = mutedNpmEnv();
  for (const key of VERCEL_CLI_ENV_KEYS) {
    const fromFile = fromFiles[key];
    if (fromFile && !env[key]?.trim()) env[key] = fromFile;
  }
  const hasOrgId = Boolean(env["VERCEL_ORG_ID"]?.trim());
  const hasProjectId = Boolean(env["VERCEL_PROJECT_ID"]?.trim());
  if (hasOrgId !== hasProjectId) {
    throw new CreateError(
      "vercel_auth_env",
      "Set both VERCEL_ORG_ID and VERCEL_PROJECT_ID, or remove both and use --scope.",
      "invalid_input",
      "INCOMPLETE_VERCEL_PROJECT_ID_PAIR",
    );
  }
  return env;
}

/** True when `.vercel/project.json` exists in the project. */
export function isVercelLinked(projectDir: string): boolean {
  return fs.existsSync(path.join(projectDir, ".vercel", "project.json"));
}

/**
 * Vercel project names are lowercase alphanumeric + hyphens, max 100 chars.
 * Prefer `package.json` `name` over the folder.
 */
export function toVercelProjectName(projectDir: string): string {
  const resolved = path.resolve(projectDir);
  const slug =
    vercelSlug(readPackageName(resolved)) || vercelSlug(path.basename(resolved)) || "openui-app";
  return slug;
}

function readPackageName(projectDir: string): string | undefined {
  try {
    const name = readProjectPackageJson(projectDir).name;
    return typeof name === "string" && name.trim() ? name.trim() : undefined;
  } catch {
    return undefined;
  }
}

function vercelSlug(value?: string): string {
  if (!value) return "";
  const unscoped = value.includes("/") ? value.slice(value.lastIndexOf("/") + 1) : value;
  return unscoped
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
    .replace(/-$/, "");
}

/** Ensure the Vercel CLI is runnable, installing via dlx when needed. */
export async function prepareVercelCli(invocation: CliInvocation, cwd: string): Promise<void> {
  const preparing = invocation.source === "dlx";
  const runVersion = () =>
    runCommand(invocation.command, vercelSpawnArgs(invocation, ["--version"]), cwd, {
      echo: false,
      stdin: "ignore",
      env: vercelCliEnv(cwd),
    });

  const result = preparing
    ? await withSpinner("Preparing Vercel CLI...", runVersion)
    : await runVersion();

  if (!result.error && result.status === 0) {
    if (preparing) console.info("✓ Vercel CLI ready\n");
    return;
  }

  if (result.diagnosticTail) process.stderr.write(result.diagnosticTail);
  throwCommandFailure(
    result,
    preparing ? "vercel_cli_install" : "vercel_cli_version",
    preparing ? "Failed to install Vercel CLI" : "Failed to run Vercel CLI",
  );
}

/** Probe login with a non-interactive `vercel whoami`. */
export async function isVercelLoggedIn(invocation: CliInvocation, cwd: string): Promise<boolean> {
  const result = await runCommand(
    invocation.command,
    vercelSpawnArgs(invocation, ["--non-interactive", "whoami"]),
    cwd,
    { echo: false, stdin: "ignore", env: vercelCliEnv(cwd) },
  );
  return !result.error && result.status === 0;
}

/** Run interactive `vercel login`, or fail if there is no TTY. */
export async function loginToVercel(
  invocation: CliInvocation,
  opts: Pick<DeployTargetOptions, "projectDir" | "noInteractive">,
): Promise<void> {
  if (!canPromptInteractive(opts.noInteractive)) {
    throw new CreateError(
      "vercel_login",
      "Not logged into Vercel. Run `vercel login` or set VERCEL_TOKEN, then retry.",
      "authentication",
      "NOT_LOGGED_IN",
    );
  }

  console.info("Not logged into Vercel. Starting login...\n");
  const result = await runCommand(
    invocation.command,
    vercelSpawnArgs(invocation, ["login"]),
    opts.projectDir,
    { inheritOutput: true, env: vercelCliEnv(opts.projectDir) },
  );
  if (!result.error && result.status === 0) return;
  throwCommandFailure(result, "vercel_login", "Vercel login failed");
}

/** Link the directory to a Vercel project (`vercel link`, `--yes` when skipping prompts). */
export async function linkVercelProject(
  invocation: CliInvocation,
  opts: Pick<DeployTargetOptions, "projectDir" | "yes" | "noInteractive" | "extraArgs">,
): Promise<void> {
  const skipPrompts = opts.yes || opts.noInteractive;
  if (!skipPrompts && !canPromptInteractive(opts.noInteractive)) {
    throw new CreateError(
      "vercel_link",
      "Vercel project is not linked. Run `vercel link` or re-run with a TTY / --yes.",
      "invalid_input",
      "NOT_LINKED",
    );
  }

  console.info(
    skipPrompts
      ? "Linking Vercel project...\n"
      : "Linking Vercel project (choose team / project)...\n",
  );
  const args = [
    "link",
    "--project",
    toVercelProjectName(opts.projectDir),
    ...vercelLinkScopeArgs(opts.extraArgs),
  ];
  if (skipPrompts) args.push("--yes");
  const result = await runCommand(
    invocation.command,
    vercelSpawnArgs(invocation, args),
    opts.projectDir,
    {
      inheritOutput: true,
      // --yes + no stdin TTY skips Vercel's post-link env pull into `.env.local`.
      stdin: skipPrompts ? "ignore" : "inherit",
      env: vercelCliEnv(opts.projectDir),
    },
  );
  if (!result.error && result.status === 0 && isVercelLinked(opts.projectDir)) {
    adoptVercelEnvVars(opts.projectDir);
    return;
  }
  throwCommandFailure(result, "vercel_link", "Vercel link failed");
}
