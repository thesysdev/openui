import { formatCliCommand, resolveCliInvocation } from "../../cli-bin";
import { printLogTail } from "../../command-output";
import {
  loadProjectDeployEnv,
  loadProjectDeployFileEnv,
  printQuietDeploySuccess,
  warnMissingRequiredDeployEnv,
  type DeployTargetOptions,
} from "../../deploy";
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

/** Keep deploy parsing and flags stable until deliberately upgraded and re-tested. */
const VERCEL_CLI_PACKAGE = "vercel@59.15.1";

/** Login, link, optionally save env, then run `vercel` deploy. */
export async function deployToVercel(opts: DeployTargetOptions): Promise<void> {
  const t0 = Date.now();
  adoptVercelEnvVars(opts.projectDir);
  const projectEnv = loadProjectDeployFileEnv(opts.projectDir);
  const availableEnv = loadProjectDeployEnv(opts.projectDir);
  const localEnv = opts.skipEnv ? {} : availableEnv;
  const projectEnvToSave = opts.skipEnv ? {} : projectEnv;
  warnMissingRequiredDeployEnv(opts.projectDir, availableEnv, "Vercel");

  const vercel = resolveCliInvocation(opts.projectDir, "vercel", VERCEL_CLI_PACKAGE);
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
  if (Object.keys(projectEnvToSave).length > 0) {
    envSavedKeyCount = await syncLocalEnvToVercelProject({
      invocation: vercel,
      projectDir: opts.projectDir,
      localEnv: projectEnvToSave,
      yes: opts.yes,
      noInteractive: opts.noInteractive,
    });
  }

  const linkedNow = isVercelLinked(opts.projectDir);
  const quiet = !opts.verbose;
  const noWait = opts.extraArgs.includes("--no-wait");
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
        noWait,
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
