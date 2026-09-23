import * as fs from "node:fs";

import { localSourceDir } from "../../lib/checkout";
import type { CliContext } from "../../lib/context";
import { resolveInstallPackageManager } from "../../lib/detect-package-manager";
import { cliErrorProperties, CreateError, processErrorProperties } from "../../lib/errors";
import { ensureGitAvailable } from "../../lib/git-preflight";
import { applyScaffoldFiles, resolveTemplateSource } from "../../lib/scaffold";
import { withSpinner } from "../../lib/spinner";
import { runCreateExample } from "./lib/create-example";
import type { CreateAppOptions } from "./lib/create-types";
import { runDevCommand } from "./lib/dev-server";
import {
  buildAppId,
  requiredApiKeyEnv,
  resolveChatEnv,
  resolveCloudEnv,
  writeEnv,
} from "./lib/env";
import { installProjectDependencies, resolveInstallInvocation } from "./lib/install";
import { installRequestedSkill, shouldInstallSkill } from "./lib/install-skill";
import { getStartedMessage } from "./lib/messages";
import type { TemplateOverlay } from "./lib/overlays";
import {
  loadCreateCatalog,
  resolveCreateSelection,
  resolveImmediate,
  resolveProjectIdentity,
} from "./lib/resolve";
import { aiSetupFromTemplate, CreateTelemetryClient } from "./lib/telemetry";
import { findCatalogOverlay } from "./lib/templates-catalog";

export async function runCreateApp(options: CreateAppOptions, ctx: CliContext): Promise<void> {
  const tel = new CreateTelemetryClient(ctx.telemetry);
  const interactive = !options.noInteractive;
  const packageManager = resolveInstallPackageManager();
  const t0 = Date.now();
  tel.registerContext({ interactive, package_manager: packageManager.name });
  tel.trackStarted({
    interactive,
    has_name_arg: Boolean(options.name),
    has_template_arg: Boolean(options.template),
    has_backend_framework_arg: Boolean(options.backendFramework),
    has_example_arg: Boolean(options.example),
    has_api_key_arg: Boolean(options.apiKey),
    has_auth_arg: Boolean(options.auth),
    no_install: Boolean(options.noInstall),
    immediate_arg: options.immediate,
  });

  if (!localSourceDir()) await ensureGitAvailable();
  const sourceRetryReporter = tel.retryReporter("source_checkout");
  const catalog = await loadCreateCatalog({
    example: options.example,
    template: options.template,
    backendFramework: options.backendFramework,
    interactive,
    onRetry: sourceRetryReporter,
  });
  const { name, targetDir } = await resolveProjectIdentity(options.name, interactive, tel);

  const selected = await resolveCreateSelection({
    backendFramework: options.backendFramework,
    example: options.example,
    examples: catalog.examples,
    overlays: catalog.templateEntry?.overlays ?? [],
    interactive,
  });
  if (selected.kind === "example") {
    await runCreateExample({
      options,
      interactive,
      packageManager,
      t0,
      name,
      targetDir,
      example: selected.example,
      tel,
      verbose: ctx.verbose,
    });
    return;
  }

  const template = catalog.template;
  const templateEntry = catalog.templateEntry;
  if (!template || !templateEntry) {
    throw new CreateError(
      "args_resolution",
      "Missing required argument --template",
      "invalid_input",
      "MISSING_REQUIRED_ARG",
    );
  }

  const backendFramework = selected.overlay;
  findCatalogOverlay(templateEntry, backendFramework);

  const aiSetup = aiSetupFromTemplate(template);
  tel.registerContext({ template, ai_setup: aiSetup, backend_framework: backendFramework });
  tel.trackAiSetupSelected({ template, ai_setup: aiSetup });
  tel.trackBackendFrameworkSelected({
    backend_framework: backendFramework,
    backend_framework_source: options.backendFramework
      ? "flag"
      : interactive
        ? "prompt"
        : "default",
  });

  tel.trackEnvResolutionStarted({ template, ai_setup: aiSetup });
  const envResult =
    template === "openui-self-hosted"
      ? await resolveChatEnv(interactive)
      : await resolveCloudEnv(name, options, interactive, tel);

  const installSkill = await shouldInstallSkill(options.skill, interactive);
  tel.trackSkillInstalled({ skill_installed: installSkill });

  const immediateResolution = resolveImmediate(options.immediate, options.noInstall, interactive);
  const apiKeyEnv = requiredApiKeyEnv(template);
  const apiKeyAvailable = envResult.envWritten || Boolean(process.env[apiKeyEnv]?.trim());
  const devStartBlockedByMissingApiKey = immediateResolution.immediate && !apiKeyAvailable;
  tel.trackImmediateSelected({
    immediate: immediateResolution.immediate,
    dependency_install_requested: immediateResolution.installDependencies,
    selection_source: immediateResolution.source,
  });

  let overlay: TemplateOverlay | undefined;
  const runScaffold = async () => {
    const { dir: templateDir } = await resolveTemplateSource(template, {
      onRetry: sourceRetryReporter,
    });
    tel.trackScaffoldStarted({ template, ai_setup: aiSetup });
    try {
      overlay = applyScaffoldFiles({
        templateDir,
        targetDir,
        name,
        packageManager: packageManager.name,
        backendFramework,
      });
      await writeEnv(
        targetDir,
        envResult,
        template === "openui-cloud" ? buildAppId(name) : undefined,
      );
    } catch (err) {
      const properties = cliErrorProperties(err, {
        failure_stage: "scaffold",
        error_class: "filesystem",
        error_code: "SCAFFOLD_FAILED",
      });
      tel.trackScaffoldFailed({ template, ai_setup: aiSetup, ...properties });
      throw new CreateError(
        properties.failure_stage,
        err instanceof Error ? err.message : String(err),
        properties.error_class,
        properties.error_code,
      );
    } finally {
      fs.rmSync(templateDir, { recursive: true, force: true });
    }
  };

  console.info();
  if (ctx.verbose) {
    console.info(`Scaffolding ${template} into "${name}"...\n`);
    await runScaffold();
  } else {
    await withSpinner("Scaffolding...", runScaffold);
    console.info("✓ Scaffolded");
  }
  tel.trackScaffoldSucceeded({ template, ai_setup: aiSetup });
  tel.trackEnvResolved({
    template,
    ai_setup: aiSetup,
    env_written: envResult.envWritten,
    auth_method: envResult.authMethod,
    auth_succeeded: envResult.authSucceeded,
  });

  const { installCmd, installArgs } = resolveInstallInvocation({
    backendFramework,
    packageManager,
    targetDir,
  });
  const dependencyInstalled = await installProjectDependencies({
    tel,
    verbose: ctx.verbose,
    targetDir,
    template,
    aiSetup,
    packageManager,
    installCmd,
    installArgs,
    installDependencies: immediateResolution.installDependencies,
  });

  const skillInstalled = await installRequestedSkill({
    enabled: installSkill,
    verbose: ctx.verbose,
    targetDir,
    tel,
  });

  const devCmd = packageManager.runCmd;
  const startDev =
    immediateResolution.immediate && dependencyInstalled && !devStartBlockedByMissingApiKey;

  tel.trackCreateSucceeded({
    template,
    ai_setup: aiSetup,
    duration_ms: Date.now() - t0,
    skill_installed: skillInstalled,
    env_written: envResult.envWritten,
    dependency_installed: dependencyInstalled,
  });
  console.info(
    getStartedMessage({
      name,
      devCmd,
      template,
      backendGettingStarted: overlay?.manifest.gettingStarted,
      skillInstalled,
      envWritten: envResult.envWritten,
      startDev,
      installCmd,
      dependencyInstalled,
    }),
  );

  if (devStartBlockedByMissingApiKey) {
    tel.trackDevCommandSkipped({
      skip_reason: "missing_api_key",
      required_env: apiKeyEnv,
    });
    return;
  }

  if (!startDev) {
    tel.trackDevCommandSkipped({
      skip_reason: options.noInstall ? "dependencies_not_installed" : "not_immediate",
    });
    return;
  }

  tel.trackDevCommandStarted({
    package_manager: packageManager.name,
  });
  const devResult = await runDevCommand(devCmd, targetDir);
  const stoppedNormally =
    devResult.status === 0 ||
    devResult.status === 130 ||
    devResult.status === 143 ||
    devResult.signal === "SIGINT" ||
    devResult.signal === "SIGTERM";

  if (stoppedNormally) {
    tel.trackDevCommandStopped({
      package_manager: packageManager.name,
      duration_ms: devResult.durationMs,
      exit_code: devResult.status,
      failure_signal: devResult.signal,
    });
  } else {
    const exitCode = devResult.status ?? 1;
    const properties = processErrorProperties(devResult, "dev_server", {
      error_class: "process",
      error_code: "NONZERO_EXIT",
    });
    tel.trackDevCommandFailed({
      package_manager: packageManager.name,
      failure_reason: devResult.error ? "spawn_error" : "nonzero_exit",
      ...properties,
    });
    console.error(
      `\nDevelopment server exited. Retry with:\n\n> cd ${name}\n> ${devCmd} run dev\n`,
    );
    process.exitCode = exitCode;
  }
}
