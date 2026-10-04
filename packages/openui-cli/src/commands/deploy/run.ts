import * as fs from "node:fs";
import * as path from "node:path";

import type { CliContext } from "../../lib/context";
import { resolveInstallPackageManager } from "../../lib/detect-package-manager";
import { CreateError } from "../../lib/errors";
import {
  DEFAULT_DEPLOY_TARGET,
  hasOpenUiPackages,
  readProjectDependencies,
  type DeployTargetOptions,
} from "./lib";
import { deployToTarget } from "./lib/targets";
import { DeployTelemetryClient } from "./lib/telemetry";

/** OpenUI-only flags. Everything else is forwarded for the target CLI to validate. */
const OWN_FLAGS = new Set(["--skip-env", "--no-interactive", "--verbose"]);

export type DeployOptions = {
  dir?: string;
  yes?: boolean;
  skipEnv?: boolean;
  noInteractive?: boolean;
  extraArgs?: string[];
};

type ResolvedDeploy = {
  projectDir?: string;
  extraArgs: string[];
};

/** Resolve flags, validate the project dir, then hand off to the deploy target. */
export async function runDeploy(options: DeployOptions, ctx: CliContext): Promise<void> {
  const tel = new DeployTelemetryClient(ctx.telemetry);
  const resolved = resolveDeployInvocation(options);
  const projectDir = resolveProjectDir(resolved.projectDir, ctx.cwd);
  const extraArgs = resolved.extraArgs.filter((arg) => arg !== "--verbose");
  const prod = extraArgs.includes("--prod");
  const yes =
    Boolean(options.yes) ||
    Boolean(options.noInteractive) ||
    extraArgs.includes("--yes") ||
    extraArgs.includes("-y");
  const skipEnv = Boolean(options.skipEnv);
  const verbose = ctx.verbose || (options.extraArgs ?? []).includes("--verbose");
  const interactive = !options.noInteractive;
  const isOpenUiProject = hasOpenUiPackages(readProjectDependencies(projectDir));

  const targetOpts: DeployTargetOptions = {
    projectDir,
    extraArgs,
    prod,
    yes,
    skipEnv,
    noInteractive: Boolean(options.noInteractive),
    verbose,
    tel,
  };

  tel.registerContext({
    interactive,
    is_openui_project: isOpenUiProject,
    package_manager: resolveInstallPackageManager().name,
  });
  if (!isOpenUiProject) tel.trackNonOpenUiProject();
  tel.trackStarted({
    target: DEFAULT_DEPLOY_TARGET,
    prod,
    yes,
    skip_env: skipEnv,
    verbose,
    interactive,
    is_openui_project: isOpenUiProject,
    has_dir_arg: Boolean(resolved.projectDir),
  });

  await deployToTarget(DEFAULT_DEPLOY_TARGET, targetOpts);
}

/** Split `[dir]` from extra args when Commander treats a flag as the dir. */
function resolveDeployInvocation(options: DeployOptions): ResolvedDeploy {
  const projectDir = unsetIfFlag(options.dir);
  const extraArgs = extraDeployArgs(options.extraArgs ?? [], { dir: projectDir });
  if (options.dir?.startsWith("-") && !extraArgs.includes(options.dir)) {
    extraArgs.unshift(options.dir);
  }
  return { projectDir, extraArgs };
}

/** Drop OpenUI-owned flags and the consumed dir so the rest can go to Vercel. */
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

/** Treat a leading-dash value as a flag, not a project directory. */
function unsetIfFlag(value?: string): string | undefined {
  return value?.startsWith("-") ? undefined : value;
}

/** Resolve and require a directory that contains package.json. */
function resolveProjectDir(dir: string | undefined, cwd: string): string {
  const projectDir = path.resolve(cwd, dir ?? ".");
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
      `No package.json in ${projectDir}. Run this from a project, or pass its directory.`,
      "invalid_input",
      "PROJECT_NOT_FOUND",
    );
  }
  return projectDir;
}
