import * as fs from "node:fs";
import * as path from "node:path";

import {
  DEFAULT_DEPLOY_TARGET,
  deployToTarget,
  type DeployTargetOptions,
} from "../lib/deploy-targets";
import { resolveInstallPackageManager } from "../lib/detect-package-manager";
import { CreateError, telemetry } from "../lib/telemetry";

/** OpenUI-only flags. Everything else is forwarded for the target CLI to validate. */
const OWN_FLAGS = new Set(["--skip-env", "--no-interactive", "--verbose"]);

export type DeployOptions = {
  dir?: string;
  yes?: boolean;
  skipEnv?: boolean;
  noInteractive?: boolean;
  verbose?: boolean;
  extraArgs?: string[];
};

type ResolvedDeploy = {
  projectDir?: string;
  extraArgs: string[];
};

export async function runDeploy(options: DeployOptions): Promise<void> {
  const resolved = resolveDeployInvocation(options);
  const projectDir = resolveProjectDir(resolved.projectDir);
  const extraArgs = resolved.extraArgs.filter((arg) => arg !== "--verbose");
  const prod = extraArgs.includes("--prod");
  const yes =
    Boolean(options.yes) ||
    Boolean(options.noInteractive) ||
    extraArgs.includes("--yes") ||
    extraArgs.includes("-y");
  const skipEnv = Boolean(options.skipEnv);
  const verbose = Boolean(options.verbose) || (options.extraArgs ?? []).includes("--verbose");

  const target = DEFAULT_DEPLOY_TARGET;
  const targetOpts: DeployTargetOptions = {
    projectDir,
    extraArgs,
    prod,
    yes,
    skipEnv,
    noInteractive: Boolean(options.noInteractive),
    verbose,
  };

  telemetry.register({ package_manager: resolveInstallPackageManager().name });
  telemetry.capture("cli_deploy_started", {
    target,
    prod,
    yes,
    skip_env: skipEnv,
    verbose,
    has_dir_arg: Boolean(resolved.projectDir),
  });

  await deployToTarget(target, targetOpts);
}

function resolveDeployInvocation(options: DeployOptions): ResolvedDeploy {
  const projectDir = unsetIfFlag(options.dir);
  const extraArgs = extraDeployArgs(options.extraArgs ?? [], { dir: projectDir });
  if (options.dir?.startsWith("-") && !extraArgs.includes(options.dir)) {
    extraArgs.unshift(options.dir);
  }
  return { projectDir, extraArgs };
}

function extraDeployArgs(args: string[], consumed: { dir?: string }): string[] {
  const skip = new Set(
    [consumed.dir].filter((value): value is string => Boolean(value && !value.startsWith("-"))),
  );
  const out: string[] = [];
  for (const arg of args) {
    if (skip.has(arg) || OWN_FLAGS.has(arg)) continue;
    out.push(arg);
  }
  return out;
}

function unsetIfFlag(value?: string): string | undefined {
  return value?.startsWith("-") ? undefined : value;
}

function resolveProjectDir(dir?: string): string {
  const projectDir = path.resolve(process.cwd(), dir ?? ".");
  if (!fs.existsSync(projectDir)) {
    throw new CreateError(
      "args_resolution",
      `Directory not found: ${projectDir}`,
      "invalid_input",
      "NOT_FOUND",
    );
  }
  if (!fs.statSync(projectDir).isDirectory()) {
    throw new CreateError(
      "args_resolution",
      `Not a directory: ${projectDir}`,
      "invalid_input",
      "NOT_A_DIRECTORY",
    );
  }
  if (!fs.existsSync(path.join(projectDir, "package.json"))) {
    throw new CreateError(
      "args_resolution",
      `No package.json in ${projectDir}. Run this from an OpenUI project, or pass its directory.`,
      "invalid_input",
      "PROJECT_NOT_FOUND",
    );
  }
  return projectDir;
}
