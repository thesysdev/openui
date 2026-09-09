import * as fs from "node:fs";
import * as path from "node:path";

import { resolveCloudApiKey, THESYS_KEYS_URL } from "../auth/mint";
import {
  formatCreateDoneMessage,
  runScaffoldDependencyInstall,
  runScaffoldDevCommand,
  runScaffoldSkillInstall,
} from "../lib/create-finish";
import { promptForProviderKey, resolveImmediate, withProgress } from "../lib/create-helpers";
import { aiSetupFromTemplate, createFunnelProps } from "../lib/create-telemetry";
import type { CreateAppOptions, EnvResult, TemplateName } from "../lib/create-types";
import { resolveInstallPackageManager } from "../lib/detect-package-manager";
import { loadExamplesCatalog } from "../lib/examples-catalog";
import { shouldInstallSkill } from "../lib/install-skill";
import { applyOverlay, OVERLAYS_DIR, resolveOverlay, type TemplateOverlay } from "../lib/overlays";
import {
  findExample,
  rejectConflictingScaffoldSelectors,
  resolveProject,
  templatesFromOverlays,
  type ExampleProject,
} from "../lib/projects";
import { resolveArgs } from "../lib/resolve-args";
import {
  pruneScaffoldLockfiles,
  restoreDotfiles,
  rewriteScaffoldPackageJson,
  syncNpmLockRoot,
} from "../lib/scaffold-package";
import { resolveTemplateSource } from "../lib/scaffold-template";
import { resolveAvailableTarget } from "../lib/target-dir";
import { CliCancelledError, CreateError, telemetry } from "../lib/telemetry";
import {
  DEFAULT_TEMPLATE_KEY,
  findCatalogOverlay,
  findCatalogTemplate,
  loadTemplatesCatalog,
  type CatalogTemplate,
} from "../lib/templates-catalog";
import { cliErrorProperties } from "../lib/utils";

import { runCreateExample } from "./create-example";

function shouldCopyTemplatePath(templateDir: string, src: string): boolean {
  const rel = path.relative(templateDir, src);
  if (!rel) return true;
  const top = rel.split(path.sep)[0] ?? "";
  // Copy the base template only; selected backend overlays are applied later.
  // Also exclude install/build artifacts that may sit in a template directory.
  return ![OVERLAYS_DIR, "node_modules", ".next", ".turbo", "dist"].includes(top);
}

function buildAppId(name: string): string {
  // Stable per-scaffold identity (see writeEnv). Slugified because the name is
  // free-form and APP_ID lands in .env and ?app_id= query params; the random
  // suffix keeps two same-named apps in one org from colliding.
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

function requiredApiKeyEnv(template: TemplateName): "THESYS_API_KEY" | "OPENAI_API_KEY" {
  return template === "openui-cloud" ? "THESYS_API_KEY" : "OPENAI_API_KEY";
}

export async function runCreateApp(options: CreateAppOptions): Promise<void> {
  const interactive = !options.noInteractive;
  const packageManager = resolveInstallPackageManager();
  const t0 = Date.now();
  telemetry.register({ interactive, package_manager: packageManager.name });
  telemetry.capture("cli_create_started", {
    ...createFunnelProps("create_started"),
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

  rejectConflictingScaffoldSelectors({
    example: options.example,
    backendFramework: options.backendFramework,
    template: options.template,
  });

  // Interactive runs always scaffold the Cloud backend; openui-self-hosted stays
  // available, but only when requested explicitly with --template.
  if (!interactive) {
    if (!options.name) {
      throw new CreateError(
        "args_resolution",
        "Missing required argument --name",
        "invalid_input",
        "MISSING_REQUIRED_ARG",
      );
    }
    if (!options.example && !options.template) {
      throw new CreateError(
        "args_resolution",
        "Missing required argument --template",
        "invalid_input",
        "MISSING_REQUIRED_ARG",
      );
    }
  }

  let examples: ExampleProject[] = [];
  let template: TemplateName | undefined;
  let templateEntry: CatalogTemplate | undefined;

  if (options.example) {
    examples = await loadExamplesCatalog();
    findExample(options.example, examples);
  } else if (interactive) {
    const [catalog, loadedExamples] = await Promise.all([
      loadTemplatesCatalog(),
      loadExamplesCatalog(),
    ]);
    examples = loadedExamples;
    template = options.template ?? DEFAULT_TEMPLATE_KEY;
    templateEntry = findCatalogTemplate(catalog, template);
    if (options.backendFramework) {
      findCatalogOverlay(templateEntry, options.backendFramework);
    }
  } else {
    const catalog = await loadTemplatesCatalog();
    template = options.template ?? DEFAULT_TEMPLATE_KEY;
    templateEntry = findCatalogTemplate(catalog, template);
    if (options.backendFramework) {
      findCatalogOverlay(templateEntry, options.backendFramework);
    }
  }

  const nameArgs = await resolveArgs(
    {
      name: options.name
        ? { value: options.name }
        : {
            prompt: { type: "input", message: "Project name?", default: "openui-agent" },
            required: true,
          },
    },
    interactive,
  );
  const { name, targetDir } = await resolveAvailableTarget(
    (nameArgs as { name: string }).name,
    interactive,
  );

  const project = await resolveProject({
    backendFramework: options.backendFramework,
    example: options.example,
    examples,
    templates: templatesFromOverlays(templateEntry?.overlays ?? []),
    interactive,
  });

  if (project.category === "example") {
    await runCreateExample({
      options,
      interactive,
      packageManager,
      t0,
      name,
      targetDir,
      example: project,
    });
    return;
  }

  if (!template || !templateEntry) {
    throw new CreateError(
      "args_resolution",
      "Missing required argument --template",
      "invalid_input",
      "MISSING_REQUIRED_ARG",
    );
  }

  const backendFramework = project.name;
  findCatalogOverlay(templateEntry, backendFramework);

  const aiSetup = aiSetupFromTemplate(template);
  telemetry.register({ template, ai_setup: aiSetup, backend_framework: backendFramework });
  telemetry.capture("cli_ai_setup_selected", {
    ...createFunnelProps("ai_setup_selected"),
    template,
    ai_setup: aiSetup,
  });
  telemetry.capture("cli_backend_framework_selected", {
    ...createFunnelProps("backend_framework_selected"),
    backend_framework: backendFramework,
    backend_framework_source: options.backendFramework
      ? "flag"
      : interactive
        ? "prompt"
        : "default",
  });

  telemetry.capture("cli_env_resolution_started", {
    ...createFunnelProps("env_resolution_started"),
    template,
    ai_setup: aiSetup,
  });
  const envResult =
    template === "openui-self-hosted"
      ? await resolveChatEnv(interactive)
      : await resolveCloudEnv(name, options, interactive);

  const installSkill = await shouldInstallSkill(options.skill, interactive);
  telemetry.capture("cli_skill_installed", {
    ...createFunnelProps("skill_prompt_resolved"),
    skill_installed: installSkill,
  });

  const immediateResolution = resolveImmediate(options.immediate, options.noInstall, interactive);
  const apiKeyEnv = requiredApiKeyEnv(template);
  const apiKeyAvailable = envResult.envWritten || Boolean(process.env[apiKeyEnv]?.trim());
  const devStartBlockedByMissingApiKey = immediateResolution.immediate && !apiKeyAvailable;
  telemetry.capture("cli_immediate_selected", {
    immediate: immediateResolution.immediate,
    dependency_install_requested: immediateResolution.installDependencies,
    selection_source: immediateResolution.source,
  });

  let overlay: TemplateOverlay | undefined;
  const runScaffold = async () => {
    const { dir: templateDir } = await resolveTemplateSource(template);
    telemetry.capture("cli_scaffold_started", {
      ...createFunnelProps("scaffold_started"),
      template,
      ai_setup: aiSetup,
    });
    try {
      overlay = resolveOverlay(templateDir, backendFramework);
      fs.cpSync(templateDir, targetDir, {
        recursive: true,
        filter: (src) => shouldCopyTemplatePath(templateDir, src),
      });
      restoreDotfiles(targetDir);
      applyOverlay(targetDir, overlay);
      const pkg = rewriteScaffoldPackageJson({
        pkgPath: path.join(targetDir, "package.json"),
        name,
        packageManager: packageManager.name,
        overlayPackageJson: overlay?.manifest.packageJson,
      });
      syncNpmLockRoot(targetDir, name, pkg);
      const overlayShipsNpmLock = Boolean(
        overlay && fs.existsSync(path.join(overlay.dir, "package-lock.json")),
      );
      pruneScaffoldLockfiles(targetDir, packageManager.name, {
        keepNpmLock: packageManager.name === "npm" && !(overlay && !overlayShipsNpmLock),
        keepPnpmLock: packageManager.name === "pnpm" && backendFramework === "default",
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
      telemetry.capture("cli_scaffold_failed", {
        ...createFunnelProps("scaffold_failed"),
        template,
        ai_setup: aiSetup,
        ...properties,
      });
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
  await withProgress(
    options.verbose ? `Scaffolding ${template} into "${name}"...` : "Scaffolding...",
    runScaffold,
    options.verbose,
  );
  if (!options.verbose) {
    console.info("✓ Scaffolded");
  }
  telemetry.capture("cli_scaffold_succeeded", {
    ...createFunnelProps("scaffold_succeeded"),
    template,
    ai_setup: aiSetup,
  });
  telemetry.capture("cli_env_resolved", {
    ...createFunnelProps("env_written"),
    template,
    ai_setup: aiSetup,
    env_written: envResult.envWritten,
    auth_method: envResult.authMethod,
    auth_succeeded: envResult.authSucceeded,
  });

  const { dependencyInstalled, installCmd } = await runScaffoldDependencyInstall({
    verbose: options.verbose,
    packageManager,
    targetDir,
    unlockedInstall: backendFramework !== "default",
    installDependencies: immediateResolution.installDependencies,
    telemetryProps: { template, ai_setup: aiSetup },
  });

  const skillInstalled = await runScaffoldSkillInstall({
    enabled: installSkill,
    verbose: options.verbose,
    targetDir,
  });

  const startDev =
    immediateResolution.immediate && dependencyInstalled && !devStartBlockedByMissingApiKey;

  telemetry.capture("cli_create_succeeded", {
    ...createFunnelProps("create_succeeded"),
    template,
    ai_setup: aiSetup,
    duration_ms: Date.now() - t0,
    skill_installed: skillInstalled,
    env_written: envResult.envWritten,
    dependency_installed: dependencyInstalled,
  });
  const envNote =
    template === "openui-cloud"
      ? envResult.envWritten
        ? "✅ .env created with your OpenUI Cloud API key + base URL."
        : `[!] .env created without a key. Add THESYS_API_KEY=… (get one at ${THESYS_KEYS_URL}).`
      : envResult.envWritten
        ? "✅ .env created with your API key."
        : "Add your API key to .env:\nOPENAI_API_KEY=sk-your-key-here";
  const frameworkNote = overlay?.manifest.gettingStarted?.replaceAll(
    "{{packageManager}}",
    packageManager.runCmd,
  );
  console.info(
    formatCreateDoneMessage({
      skillInstalled,
      envNote,
      extraNotes: frameworkNote ? [frameworkNote] : undefined,
      name,
      devCmd: packageManager.runCmd,
      installCmd,
      startDev,
      dependencyInstalled,
    }),
  );

  await runScaffoldDevCommand({
    name,
    targetDir,
    packageManager,
    startDev,
    noInstall: options.noInstall,
    missingApiKey: devStartBlockedByMissingApiKey ? { env: apiKeyEnv } : undefined,
  });
}

async function writeEnv(targetDir: string, result: EnvResult, appId?: string): Promise<void> {
  // APP_ID is the scaffold's stable identity: the frontend-token route sends
  // it as `app_id`, so every conversation this app creates is bound to it and
  // apps sharing one org API key stay isolated from each other. It must stay
  // stable for the app's lifetime — regenerating it orphans existing threads.
  const content = `${result.envContent ?? ""}${appId ? `APP_ID=${appId}\n` : ""}`;
  if (!content) return;
  await fs.promises.writeFile(path.join(targetDir, ".env"), content);
}

async function resolveChatEnv(interactive: boolean): Promise<EnvResult> {
  const apiKey = interactive ? await promptForProviderKey() : null;

  // Always write a file, so the scaffold has a .env to edit rather than one the
  // user must know to create. Without a key the entries stay commented out: an
  // empty `OPENAI_API_KEY=` would shadow a key already exported in the shell.
  const lines = apiKey
    ? [`OPENAI_API_KEY=${apiKey}`]
    : [
        "# Your OpenAI-compatible provider key. Uncomment and fill it in.",
        "# OPENAI_API_KEY=sk-your-key-here",
        "# Optional:",
        "# OPENAI_MODEL=gpt-5.2",
        "# OPENAI_BASE_URL=https://api.openai.com/v1",
      ];

  return {
    // False without a key, so the immediate dev-server gate and the
    // "add your API key" message still apply even though .env now exists.
    envWritten: apiKey != null,
    envContent: lines.join("\n") + "\n",
  };
}

async function resolveCloudEnv(
  name: string,
  options: CreateAppOptions,
  interactive: boolean,
): Promise<EnvResult> {
  let apiKey: string | null = null;
  let authMethod: EnvResult["authMethod"];
  try {
    telemetry.capture("cli_cloud_auth_started", {
      ...createFunnelProps("cloud_auth_started"),
      auth_method: options.auth ?? (options.apiKey ? "apikey-flag" : undefined),
    });
    const resolved = await resolveCloudApiKey({
      apiKey: options.apiKey,
      auth: options.auth,
      projectName: name,
      interactive,
    });
    apiKey = resolved.key;
    authMethod = resolved.method;
    telemetry.capture("cli_cloud_auth_method", {
      ...createFunnelProps("cloud_auth_resolved"),
      auth_method: resolved.method,
      auth_succeeded: apiKey != null,
    });
  } catch (err) {
    if (err instanceof CliCancelledError) {
      telemetry.capture("cli_cloud_auth_cancelled", {
        ...createFunnelProps("cloud_auth_cancelled"),
        auth_method: options.auth ?? (options.apiKey ? "apikey-flag" : undefined),
        auth_succeeded: false,
        ...cliErrorProperties(err),
      });
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    const properties = cliErrorProperties(err, {
      failure_stage: "cloud_auth",
      error_class: "authentication",
      error_code: "AUTH_FAILED",
    });
    telemetry.capture("cli_cloud_auth_failed", {
      ...createFunnelProps("cloud_auth_failed"),
      auth_method: options.auth ?? (options.apiKey ? "apikey-flag" : undefined),
      auth_succeeded: false,
      ...properties,
    });
    console.error(`\n[!] Could not obtain an API key: ${msg}`);
    console.error(`  Add THESYS_API_KEY to .env later (keys: ${THESYS_KEYS_URL}).\n`);
  }
  const lines = [`THESYS_API_KEY=${apiKey ?? ""}`, `DEMO_USER_ID=demo-user`];
  return {
    envWritten: apiKey != null,
    envContent: lines.join("\n") + "\n",
    authMethod,
    authSucceeded: apiKey != null,
  };
}
