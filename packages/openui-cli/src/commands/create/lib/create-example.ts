import * as path from "node:path";

import { resolveInstallPackageManager } from "../../../lib/detect-package-manager";
import { CliCancelledError, cliErrorProperties, CreateError } from "../../../lib/errors";
import { withSpinner } from "../../../lib/spinner";
import type { CreateAppOptions, EnvResult } from "./create-types";
import { writeEnvVar } from "./env";
import type { ExampleProject } from "./examples-catalog";
import { installRequestedSkill, shouldInstallSkill } from "./install-skill";
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
  packageManager: ReturnType<typeof resolveInstallPackageManager>;
  t0: number;
  name: string;
  targetDir: string;
  example: ExampleProject;
  tel: CreateTelemetryClient;
  verbose: boolean;
}): Promise<void> {
  const { options, interactive, packageManager, t0, name, targetDir, example, tel, verbose } =
    params;

  tel.registerContext({ example: example.name, project_category: "example" });
  tel.trackExampleSelected({
    example: example.name,
    example_source: options.example ? "flag" : interactive ? "prompt" : "default",
  });

  tel.trackEnvResolutionStarted({ example: example.name });
  const envResult = await resolveExampleEnv(example, interactive);

  const installSkill = await shouldInstallSkill(options.skill, false);
  tel.trackSkillInstalled({ skill_installed: installSkill });
  tel.trackImmediateSelected({
    immediate: false,
    dependency_install_requested: false,
    selection_source: "no_install",
  });

  console.info();
  tel.trackScaffoldStarted({ example: example.name });
  let layout: ExampleLayout | undefined;
  try {
    const runScaffold = () =>
      scaffoldExample({
        example,
        targetDir,
        name,
        packageManager: packageManager.name,
        onRetry: tel.reportNetworkRetry("source_checkout"),
      });
    layout = verbose ? await runScaffold() : await withSpinner("Scaffolding...", runScaffold);
    if (!verbose) {
      console.info("✓ Scaffolded");
    }
  } catch (err) {
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

  try {
    for (const [key, value] of Object.entries(envResult.envVars ?? {})) {
      writeEnvVar(path.join(targetDir, example.env.file), key, value);
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
  });

  layout ??= exampleLayout(targetDir);
  const installCmd = packageManager.installCmd;
  tel.trackDependencyInstallSkipped({
    skip_reason: "example_scaffold_only",
  });
  tel.trackDevCommandSkipped({
    skip_reason: "not_immediate",
  });

  const skillInstalled = await installRequestedSkill({
    enabled: installSkill,
    verbose,
    targetDir,
    tel,
    printFailureLog: true,
  });

  tel.trackCreateSucceeded({
    example: example.name,
    duration_ms: Date.now() - t0,
    skill_installed: skillInstalled,
    env_written: envResult.envWritten,
    dependency_installed: false,
  });
  const writtenKeys = Object.keys(envResult.envVars ?? {});
  const missingKeys = example.env.keys.filter((key) => !writtenKeys.includes(key));
  const envNote = [
    writtenKeys.length > 0 ? `✅ ${example.env.file} updated with ${writtenKeys.join(", ")}.` : "",
    missingKeys.length > 0
      ? `Add ${missingKeys.map((key) => `${key}=…`).join(", ")} to ${example.env.file} (see the example README).`
      : example.env.keys.length === 0
        ? `Add your API keys to ${example.env.file} (see the example README).`
        : "",
  ]
    .filter(Boolean)
    .join("\n");
  const skillMessage = skillInstalled
    ? "The OpenUI agent skill was installed.\nAI coding assistants will use it to help you build with OpenUI.\n"
    : "";
  const nextStep = isNestedExample(layout)
    ? nestedExampleNextSteps({
        name,
        targetDir,
        layout,
        runCmd: packageManager.runCmd,
        installCmd,
      })
    : [`> cd ${name}`, `> ${installCmd}`, `> ${packageManager.runCmd} run dev`].join("\n");

  console.info(
    `\n${[skillMessage.trim(), "Done!", envNote, nextStep].filter(Boolean).join("\n\n")}\n`,
  );
}

async function resolveExampleEnv(
  example: ExampleProject,
  interactive: boolean,
): Promise<EnvResult> {
  const envVars: Record<string, string> = {};
  if (interactive) {
    for (const key of example.env.keys) {
      const value = await promptForProviderKey(key);
      if (value) envVars[key] = value;
    }
  }
  return { envWritten: Object.keys(envVars).length > 0, envVars };
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

function posixJoin(...parts: string[]): string {
  return parts.filter((part) => part && part !== ".").join("/");
}

function nestedExampleNextSteps(params: {
  name: string;
  targetDir: string;
  layout: ExampleLayout;
  runCmd: string;
  installCmd: string;
}): string {
  const blocks: string[] = [];
  for (const relative of params.layout.jsPackages) {
    const pkgDir = relative === "." ? params.targetDir : path.join(params.targetDir, relative);
    blocks.push(
      [
        `> cd ${posixJoin(params.name, relative)}`,
        `> ${params.installCmd}`,
        `> ${exampleDevCommand(pkgDir, params.runCmd)}`,
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
