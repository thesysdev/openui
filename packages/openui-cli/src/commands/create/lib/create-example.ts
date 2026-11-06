import * as path from "node:path";

import type { PackageManager } from "../../../lib/detect-package-manager";
import { CliCancelledError, cliErrorProperties, CreateError } from "../../../lib/errors";
import { cancelOnInterrupt } from "../../../lib/interrupt";
import { writeAgentsGuide } from "../../../lib/scaffold";
import { withSpinner } from "../../../lib/spinner";
import type { CreateAppOptions, EnvResult } from "./create-types";
import { runDevServer } from "./dev-server";
import { resolveCloudEnv, writeEnvVar } from "./env";
import type { ExampleProject } from "./examples-catalog";
import { installProjectDependencies, resolveInstallInvocation } from "./install";
import {
  agentReadmeNote,
  cdStep,
  missingCloudKeyNote,
  readmePath,
  skillInstallHint,
} from "./messages";
import { resolveImmediate } from "./resolve";
import {
  exampleDevCommand,
  exampleLayout,
  isNestedExample,
  scaffoldExample,
  type ExampleLayout,
} from "./scaffold-example";
import type { CreateTelemetryClient } from "./telemetry";

export async function runCreateExample(params: {
  options: CreateAppOptions;
  interactive: boolean;
  agent?: string;
  packageManager: PackageManager;
  t0: number;
  name: string;
  /** What to `cd` into: the project folder, or `.` when created in place. */
  dir: string;
  targetDir: string;
  example: ExampleProject;
  tel: CreateTelemetryClient;
  verbose: boolean;
}): Promise<void> {
  const {
    options,
    interactive,
    agent,
    packageManager,
    t0,
    name,
    dir,
    targetDir,
    example,
    tel,
    verbose,
  } = params;

  tel.registerContext({ example: example.name, project_category: "example" });
  tel.trackExampleSelected({
    example: example.name,
    example_source: options.example ? "flag" : interactive ? "prompt" : "default",
  });

  const immediateResolution = resolveImmediate(options.immediate, options.noInstall, interactive);
  tel.trackImmediateSelected({
    immediate: immediateResolution.immediate,
    dependency_install_requested: immediateResolution.installDependencies,
    selection_source: immediateResolution.source,
  });

  console.info();
  tel.trackScaffoldStarted({ example: example.name });
  let layout: ExampleLayout | undefined;
  try {
    const onRetry = tel.reportNetworkRetry("source_checkout");
    const runScaffold = () =>
      cancelOnInterrupt("scaffold", async () => {
        const scaffolded = await scaffoldExample({
          example,
          targetDir,
          name,
          packageManager: packageManager.name,
          onRetry,
        });
        if (!options.noSkill) await writeAgentsGuide(targetDir, { onRetry });
        return scaffolded;
      });
    layout = verbose ? await runScaffold() : await withSpinner("Scaffolding...", runScaffold);
    if (!verbose) {
      console.info("✓ Scaffolded");
    }
  } catch (err) {
    if (err instanceof CliCancelledError) throw err;
    const properties = cliErrorProperties(err, {
      failure_stage: "scaffold",
      error_class: "filesystem",
      error_code: "SCAFFOLD_FAILED",
    });
    tel.trackScaffoldFailed({
      example: example.name,
      ...properties,
    });
    throw new CreateError(
      properties.failure_stage,
      err instanceof Error ? err.message : String(err),
      properties.error_class,
      properties.error_code,
    );
  }
  tel.trackScaffoldSucceeded({ example: example.name });

  layout ??= exampleLayout(targetDir);
  // Nested examples run several apps (often in different languages), so they
  // keep the printed per-app steps instead of one install + `run dev`.
  const nested = isNestedExample(layout);
  const { installCmd, installArgs } = resolveInstallInvocation({ packageManager, targetDir });
  let dependencyInstalled = false;
  if (nested) {
    tel.trackDependencyInstallSkipped({ skip_reason: "nested_example" });
  } else {
    dependencyInstalled = await installProjectDependencies({
      tel,
      verbose,
      targetDir,
      scaffold: { example: example.name },
      packageManager,
      installCmd,
      installArgs,
      installDependencies: immediateResolution.installDependencies,
    });
  }

  // Keys (Thesys sign-in or a provider key) come last, like the template flow.
  tel.trackEnvResolutionStarted({ example: example.name });
  const envResult = await resolveExampleEnv(example, name, options, interactive, agent, tel);
  try {
    if (envResult.envKeyValue && example.env.key) {
      writeEnvVar(path.join(targetDir, example.env.file), example.env.key, envResult.envKeyValue);
    }
  } catch (err) {
    const properties = cliErrorProperties(err, {
      failure_stage: "environment_write",
      error_class: "filesystem",
      error_code: "WRITE_FAILED",
    });
    throw new CreateError(
      properties.failure_stage,
      err instanceof Error ? err.message : String(err),
      properties.error_class,
      properties.error_code,
    );
  }
  tel.trackEnvResolved({
    example: example.name,
    env_written: envResult.envWritten,
    auth_method: envResult.authMethod,
    auth_succeeded: envResult.authSucceeded,
  });

  // Examples without a primary key (several keys to fill in) never auto-start.
  const apiKeyAvailable = Boolean(
    example.env.key && (envResult.envWritten || process.env[example.env.key]?.trim()),
  );
  const devStartBlockedByMissingApiKey =
    immediateResolution.immediate && !nested && !apiKeyAvailable;
  const startDev =
    immediateResolution.immediate && dependencyInstalled && !devStartBlockedByMissingApiKey;

  tel.trackCreateSucceeded({
    example: example.name,
    duration_ms: Date.now() - t0,
    env_written: envResult.envWritten,
    auth_method: envResult.authMethod,
    auth_succeeded: envResult.authSucceeded,
    dependency_installed: dependencyInstalled,
  });
  const agentReadme = agent ? readmePath(targetDir) : undefined;
  const envNote = exampleEnvNote(
    example.env,
    envResult.envWritten,
    apiKeyAvailable,
    dir,
    packageManager.dlxCmd,
  );
  const devCmd = `${packageManager.runCmd} run dev`;
  // The missing-key note already cd's into the project, so the run steps carry on from there.
  const alreadyInProject = example.env.key === "THESYS_API_KEY" && !apiKeyAvailable;
  const nextStep = nested
    ? nestedExampleNextSteps({ name: dir, targetDir, layout, packageManager })
    : startDev
      ? `Starting the development server in "${name}"...\n\n> ${devCmd}`
      : [
          ...(alreadyInProject ? [] : cdStep(dir)),
          ...(dependencyInstalled ? [] : [`> ${installCmd}`]),
          `> ${devCmd}`,
        ].join("\n");

  console.info(
    `\n${[
      "Done!",
      envNote,
      nextStep,
      options.noSkill ? skillInstallHint() : "",
      agentReadme ? agentReadmeNote(agentReadme) : "",
    ]
      .filter(Boolean)
      .join("\n\n")}\n`,
  );

  if (devStartBlockedByMissingApiKey) {
    tel.trackDevCommandSkipped({
      skip_reason: "missing_api_key",
      required_env: example.env.key,
    });
    return;
  }

  if (!startDev) {
    tel.trackDevCommandSkipped({
      skip_reason: nested
        ? "nested_example"
        : options.noInstall
          ? "dependencies_not_installed"
          : "not_immediate",
    });
    return;
  }

  await runDevServer({ tel, packageManager, targetDir, dir });
}

async function resolveExampleEnv(
  example: ExampleProject,
  name: string,
  options: CreateAppOptions,
  interactive: boolean,
  agent: string | undefined,
  tel: CreateTelemetryClient,
): Promise<EnvResult & { envKeyValue?: string }> {
  if (!example.env.key) {
    return { envWritten: false };
  }

  if (example.env.key === "THESYS_API_KEY") {
    const result = await resolveCloudEnv(
      name,
      { ...options, envFile: example.env.file },
      interactive,
      agent,
      tel,
    );
    return { ...result, envKeyValue: result.envVars?.[example.env.key] || undefined };
  }

  const apiKey = interactive ? await promptForProviderKey(example.env.key) : null;
  return {
    envWritten: apiKey != null,
    envKeyValue: apiKey ?? undefined,
  };
}

async function promptForProviderKey(envKey: string): Promise<string | null> {
  try {
    const { input } = await import("@inquirer/prompts");
    const apiKey = (
      await input({
        message: `Enter your ${envKey} (leave blank to skip):`,
      })
    ).trim();
    return apiKey || null;
  } catch (error) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (error instanceof ExitPromptError) {
      throw new CliCancelledError("environment_resolution");
    }
    throw error;
  }
}

function exampleEnvNote(
  env: ExampleProject["env"],
  envWritten: boolean,
  /** The key is in the env file or already exported in the shell. */
  apiKeyAvailable: boolean,
  name: string,
  dlxCmd: string,
): string {
  if (!env.key) return `Add your API keys to ${env.file} (see the example README).`;
  if (envWritten) return `✅ ${env.file} updated with ${env.key}.`;
  if (apiKeyAvailable) return "";
  if (env.key === "THESYS_API_KEY") return missingCloudKeyNote(name, dlxCmd, env.file);
  return `Add ${env.key}=… to ${env.file} (see the example README).`;
}

function posixJoin(...parts: string[]): string {
  return parts.filter((part) => part && part !== ".").join("/");
}

function nestedExampleNextSteps(params: {
  name: string;
  targetDir: string;
  layout: ExampleLayout;
  packageManager: PackageManager;
}): string {
  const { packageManager } = params;
  const blocks: string[] = [];
  for (const relative of params.layout.jsPackages) {
    const pkgDir = relative === "." ? params.targetDir : path.join(params.targetDir, relative);
    const { installCmd } = resolveInstallInvocation({ packageManager, targetDir: pkgDir });
    blocks.push(
      [
        `> cd ${posixJoin(params.name, relative)}`,
        `> ${installCmd}`,
        `> ${exampleDevCommand(pkgDir, packageManager.runCmd)}`,
      ].join("\n"),
    );
  }
  for (const relative of params.layout.pythonPackages) {
    blocks.push(
      [`> cd ${posixJoin(params.name, relative)}`, `> uv run uvicorn app.main:app --reload`].join(
        "\n",
      ),
    );
  }
  return blocks.join("\n\n");
}
