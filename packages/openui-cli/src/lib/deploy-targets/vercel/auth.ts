import * as fs from "node:fs";
import * as path from "node:path";

import type { CliInvocation } from "../../cli-bin";
import { throwCommandFailure } from "../../deploy/failure";
import { canPromptInteractive } from "../../deploy/prompt";
import type { DeployTargetOptions } from "../../deploy/types";
import { mutedNpmEnv, runCommand } from "../../process-runner";
import { withSpinner } from "../../spinner";
import { CreateError } from "../../telemetry";
import { vercelSpawnArgs } from "./args";

export function isVercelLinked(projectDir: string): boolean {
  return fs.existsSync(path.join(projectDir, ".vercel", "project.json"));
}

export async function prepareVercelCli(invocation: CliInvocation, cwd: string): Promise<void> {
  const preparing = invocation.source === "dlx";
  const runVersion = () =>
    runCommand(invocation.command, vercelSpawnArgs(invocation, ["--version"]), cwd, {
      echo: false,
      stdin: "ignore",
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

export async function isVercelLoggedIn(invocation: CliInvocation, cwd: string): Promise<boolean> {
  const result = await runCommand(
    invocation.command,
    vercelSpawnArgs(invocation, ["--non-interactive", "whoami"]),
    cwd,
    { echo: false, stdin: "ignore" },
  );
  return !result.error && result.status === 0;
}

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
    { inheritOutput: true },
  );
  if (!result.error && result.status === 0) return;
  throwCommandFailure(result, "vercel_login", "Vercel login failed");
}

export async function linkVercelProject(
  invocation: CliInvocation,
  opts: Pick<DeployTargetOptions, "projectDir" | "yes" | "noInteractive">,
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
  const args = ["link"];
  if (skipPrompts) args.push("--yes");
  const result = await runCommand(
    invocation.command,
    vercelSpawnArgs(invocation, args),
    opts.projectDir,
    { inheritOutput: true, env: mutedNpmEnv() },
  );
  if (!result.error && result.status === 0 && isVercelLinked(opts.projectDir)) return;
  throwCommandFailure(result, "vercel_link", "Vercel link failed");
}
