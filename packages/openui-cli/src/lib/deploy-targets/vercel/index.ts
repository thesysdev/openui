import { formatCliCommand, resolveCliInvocation } from "../../cli-bin";
import { printLogTail } from "../../command-output";
import {
  loadProjectDeployEnv,
  printQuietDeploySuccess,
  warnMissingRequiredDeployEnv,
  type DeployTargetOptions,
} from "../../deploy";
import { resolveInstallPackageManager } from "../../detect-package-manager";
import { adoptVercelEnvVars } from "../../env";
import { runCommand, runQuietCommand } from "../../process-runner";
import { telemetry } from "../../telemetry";
import { throwCommandFailure } from "../../utils";
import { buildVercelDeployArgs, publicVercelArgs, vercelSpawnArgs } from "./args";
import {
  isVercelLinked,
  isVercelLoggedIn,
  linkVercelProject,
  loginToVercel,
  prepareVercelCli,
  vercelCliEnv,
} from "./connect";
import { syncLocalEnvToVercelProject } from "./project-env";
import { extractVercelDeploymentSummary } from "./summary";

/** Login, link, optionally save env, then run `vercel` deploy. */
export async function deployToVercel(opts: DeployTargetOptions): Promise<void> {
  const t0 = Date.now();
  const packageManager = resolveInstallPackageManager();
  adoptVercelEnvVars(opts.projectDir);
  const fileEnv = loadProjectDeployEnv(opts.projectDir);
  const localEnv = opts.skipEnv ? {} : fileEnv;
  warnMissingRequiredDeployEnv(opts.projectDir, fileEnv, "Vercel");

  const vercel = resolveCliInvocation(opts.projectDir, "vercel", packageManager);
  await prepareVercelCli(vercel, opts.projectDir);

  let loggedIn = await isVercelLoggedIn(vercel, opts.projectDir);
  if (!loggedIn) {
    await loginToVercel(vercel, opts);
    loggedIn = true;
  }

  // Link before env sync / deploy so new projects can save env and run a
  // non-interactive (quiet) deploy without mid-build prompts.
  if (!isVercelLinked(opts.projectDir)) {
    await linkVercelProject(vercel, opts);
  }

  let envSavedKeyCount = 0;
  if (Object.keys(localEnv).length > 0) {
    envSavedKeyCount = await syncLocalEnvToVercelProject({
      invocation: vercel,
      projectDir: opts.projectDir,
      localEnv,
      yes: opts.yes,
      noInteractive: opts.noInteractive,
    });
  }

  const linkedNow = isVercelLinked(opts.projectDir);
  const quiet = !opts.verbose;
  // Quiet mode needs a non-interactive Vercel deploy (piped stdio).
  const deployYes = opts.yes || (quiet && linkedNow);
  const vercelArgs = buildVercelDeployArgs({
    extraArgs: opts.extraArgs,
    yes: deployYes,
    localEnv,
  });

  if (opts.verbose) {
    console.info(
      `Deploying to Vercel (${vercel.source}): ${formatCliCommand(vercel, publicVercelArgs(vercelArgs))}`,
    );
    if (Object.keys(localEnv).length > 0) {
      console.info(
        envSavedKeyCount > 0
          ? `Also attaching local env on this deployment: ${Object.keys(localEnv).sort().join(", ")}`
          : `Passing local env on this deployment: ${Object.keys(localEnv).sort().join(", ")}`,
      );
    }
    console.info("");
  }

  const deployEnv = vercelCliEnv(opts.projectDir);
  const result = quiet
    ? await runQuietCommand({
        command: vercel.command,
        args: vercelSpawnArgs(vercel, vercelArgs),
        cwd: opts.projectDir,
        label: "Uploading and building on Vercel...",
        env: deployEnv,
      })
    : await runCommand(vercel.command, vercelSpawnArgs(vercel, vercelArgs), opts.projectDir, {
        inheritOutput: true,
        env: deployEnv,
      });

  if (!result.error && result.status === 0) {
    if (quiet) {
      printQuietDeploySuccess(
        extractVercelDeploymentSummary(result.diagnosticTail),
        result.durationMs,
      );
    }
    telemetry.capture("cli_deploy_succeeded", {
      target: "vercel",
      prod: opts.prod,
      yes: opts.yes,
      skip_env: opts.skipEnv,
      verbose: opts.verbose,
      cli_source: vercel.source,
      logged_in: loggedIn,
      env_key_count: Object.keys(localEnv).length,
      env_saved_key_count: envSavedKeyCount,
      duration_ms: Date.now() - t0,
    });
    return;
  }

  if (quiet) printLogTail(result.diagnosticTail, "Vercel log (tail)");
  throwCommandFailure(result, "vercel_deploy", "Vercel deploy failed");
}
