import * as fs from "node:fs";

import { localSourceDir } from "../../lib/checkout";
import type { CliContext } from "../../lib/context";
import { resolveInstallPackageManager } from "../../lib/detect-package-manager";
import { cliErrorProperties, CreateError } from "../../lib/errors";
import { ensureGitAvailable } from "../../lib/git-preflight";
import { applyScaffoldFiles, resolveTemplateSource, writeAgentsGuide } from "../../lib/scaffold";
import { withSpinner } from "../../lib/spinner";
import { runCreateExample } from "./lib/create-example";
import type { CreateAppOptions } from "./lib/create-types";
import { runDevServer } from "./lib/dev-server";
import { buildAppId, cloudEnvVars, resolveCloudEnv, writeEnv } from "./lib/env";
import { installProjectDependencies, resolveInstallInvocation } from "./lib/install";
import { getStartedMessage, readmePath } from "./lib/messages";
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
  const interactive = ctx.canPrompt;
  const agent = ctx.activeAgent;
  const packageManager = resolveInstallPackageManager();
  const t0 = Date.now();
  tel.registerContext({ package_manager: packageManager.name });
  tel.trackStarted({
    has_name_arg: Boolean(options.name),
    has_backend_framework_arg: Boolean(options.backendFramework),
    has_example_arg: Boolean(options.example),
    no_install: Boolean(options.noInstall),
    immediate_arg: options.immediate,
  });

  if (!localSourceDir()) await ensureGitAvailable();
  const sourceRetryReporter = tel.reportNetworkRetry("source_checkout");
  const catalogStartedAt = Date.now();
  const catalog = await loadCreateCatalog({
    example: options.example,
    backendFramework: options.backendFramework,
    interactive,
    onRetry: sourceRetryReporter,
  });
  tel.trackCatalogLoaded({ duration_ms: Date.now() - catalogStartedAt });
  const { name, targetDir, dir } = await resolveProjectIdentity(options.name, interactive, tel);
  tel.trackProjectNameSelected({
    name_source:
      dir === "." ? "current_dir" : options.name ? "arg" : interactive ? "prompt" : "default",
  });

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
      agent,
      packageManager,
      t0,
      name,
      dir,
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
      "The OpenUI Cloud template is missing from the template catalog.",
      "network",
      "TEMPLATE_NOT_FOUND",
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

  const immediateResolution = resolveImmediate(options.immediate, options.noInstall, interactive);
  tel.trackImmediateSelected({
    immediate: immediateResolution.immediate,
    dependency_install_requested: immediateResolution.installDependencies,
    selection_source: immediateResolution.source,
  });

  let overlay: TemplateOverlay | undefined;
  const runScaffold = async () => {
    const cloneStartedAt = Date.now();
    const { dir: templateDir } = await resolveTemplateSource(template, {
      onRetry: sourceRetryReporter,
    });
    tel.trackTemplateCloned({ template, duration_ms: Date.now() - cloneStartedAt });
    tel.trackScaffoldStarted({ template, ai_setup: aiSetup });
    try {
      overlay = applyScaffoldFiles({
        templateDir,
        targetDir,
        name,
        packageManager: packageManager.name,
        backendFramework,
      });
      // Write APP_ID and DEMO_USER_ID now, with THESYS_API_KEY left empty.
      // Sign-in at the end only fills in the key, so a run that stops before
      // it still leaves both in .env for `generate-api-key` to complete.
      await writeEnv(targetDir, { envWritten: false, envVars: cloudEnvVars() }, buildAppId(name));
      if (!options.noSkill) await writeAgentsGuide(targetDir, { onRetry: sourceRetryReporter });
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

  const { installCmd, installArgs } = resolveInstallInvocation({ packageManager, targetDir });
  const dependencyInstalled = await installProjectDependencies({
    tel,
    verbose: ctx.verbose,
    targetDir,
    scaffold: { template, ai_setup: aiSetup },
    packageManager,
    installCmd,
    installArgs,
    installDependencies: immediateResolution.installDependencies,
  });

  // Sign-in is the last step: the project is ready by now, and it's the only
  // thing left before the dev server can start.
  tel.trackEnvResolutionStarted({ template, ai_setup: aiSetup });
  const envResult = await resolveCloudEnv(name, options, interactive, agent, tel);
  if (envResult.envWritten) await writeEnv(targetDir, envResult);
  tel.trackEnvResolved({
    template,
    ai_setup: aiSetup,
    env_written: envResult.envWritten,
    auth_method: envResult.authMethod,
    auth_succeeded: envResult.authSucceeded,
  });

  const apiKeyEnv = "THESYS_API_KEY";
  const apiKeyAvailable = envResult.envWritten || Boolean(process.env[apiKeyEnv]?.trim());
  const devStartBlockedByMissingApiKey = immediateResolution.immediate && !apiKeyAvailable;
  const devCmd = packageManager.runCmd;
  const startDev =
    immediateResolution.immediate && dependencyInstalled && !devStartBlockedByMissingApiKey;

  tel.trackCreateSucceeded({
    template,
    ai_setup: aiSetup,
    duration_ms: Date.now() - t0,
    env_written: envResult.envWritten,
    dependency_installed: dependencyInstalled,
  });
  console.info(
    getStartedMessage({
      name,
      dir,
      devCmd,
      dlxCmd: packageManager.dlxCmd,
      backendGettingStarted: overlay?.manifest.gettingStarted,
      envWritten: envResult.envWritten,
      apiKeyAvailable,
      startDev,
      installCmd,
      dependencyInstalled,
      agentReadmePath: agent ? readmePath(targetDir) : undefined,
      skillHint: options.noSkill,
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

  await runDevServer({ tel, packageManager, targetDir, dir });
}
