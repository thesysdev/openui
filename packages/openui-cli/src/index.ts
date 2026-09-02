#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { Command } from "commander";

import { runCreateApp } from "./commands/create-app";
import { runDeploy } from "./commands/deploy";
import { GenerateOptions, runGenerate } from "./commands/generate";
import { runGenerateApiKey } from "./commands/generate-api-key";
import { detectAgent, UNKNOWN_AGENT_NAME } from "./lib/detect-agent";
import { DEFAULT_ENV_FILE } from "./lib/env";
import { rejectConflictingImmediateFlags, resolveArgs } from "./lib/resolve-args";
import { telemetry } from "./lib/telemetry";
import {
  handleCliError,
  normalizeAuth,
  normalizeBackendFramework,
  normalizeTemplate,
} from "./lib/utils"; // Ensure utils.ts is included for type declarations

const program = new Command();

const cliVersion = (
  JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")) as {
    version: string;
  }
).version;

program.name("openui").description("CLI for OpenUI").version(cliVersion);
program.option("--no-telemetry", "Disable anonymous usage analytics");

program.option(
  "--agent-name <name>",
  "AI agents: declare your stable lowercase kebab-case product slug for telemetry (e.g. codex or claude-code); humans can omit",
  UNKNOWN_AGENT_NAME,
);
program.configureHelp({ showGlobalOptions: true });

// Init telemetry once, just before any command runs (honors --no-telemetry / DO_NOT_TRACK).
program.hook("preAction", (_thisCommand, actionCommand) => {
  const globalOptions = program.opts<{ agentName: string; telemetry?: boolean }>();
  const command = actionCommand.name();
  telemetry.init({ cliVersion, flagEnabled: globalOptions.telemetry !== false });
  telemetry.register({
    agent_name: globalOptions.agentName,
    detected_agent_name: detectAgent(),
    cli_run_id: randomUUID(),
    command,
  });
  telemetry.capture("cli_invoked");
});

program
  .command("create")
  .description(
    "Scaffold a Next.js agent app with the recommended OpenUI Cloud backend or your own provider",
  )
  .option("-n, --name <string>", "Project name (interactive default: openui-agent)")
  .option(
    "-t, --template <template>",
    "AI backend: openui-cloud (recommended default) | openui-self-hosted (infrastructure control)",
  )
  .option(
    "--backend-framework <framework>",
    "Backend framework: default | langgraph | vercel-ai-sdk | vercel-eve",
  )
  .option("--api-key <key>", "OpenUI Cloud API key (cloud template; skips sign-in)")
  .option("--auth <method>", "Cloud auth method: oauth | skip (manual is deprecated)")
  .option("--skill", "Install the OpenUI agent skill for AI coding assistants")
  .option("--no-skill", "Skip installing the OpenUI agent skill")
  .option("--no-interactive", "Fail with error if required args are missing")
  .option("--no-install", "Scaffold without running the package install")
  .option("-i, --immediate", "Start the development server after installing dependencies")
  .option("--no-immediate", "Install dependencies without starting the development server")
  .option("--verbose", "Stream full dependency install logs")
  .addHelpText(
    "after",
    `
Templates:
  openui-cloud        Recommended default for prototypes and evaluations.
                      Hosted models, managed conversation history, built-in tools,
                      and ready-to-use reports and presentations. No model, storage,
                      or artifact infrastructure to operate. Bring your own
                      OpenAI/Anthropic/Google key (BYOK) on any plan,
                      including the free tier.
  openui-self-hosted  Choose when owning the OpenAI-compatible provider, AI route,
                      and persistence is a requirement. Available only via
                      --template; interactive runs default to openui-cloud.

Backend frameworks:
  default        Uses OpenAI SDK.
  langgraph      Bootstraps a LangGraph agent with the selected model backend.
  vercel-ai-sdk  Scaffolds a Vercel AI SDK agent with the selected model backend.
  vercel-eve     Scaffolds a Vercel Eve agent with the selected model backend.
`,
  )
  .action(
    async (options: {
      name?: string;
      template?: string;
      backendFramework?: string;
      apiKey?: string;
      auth?: string;
      skill?: boolean;
      interactive: boolean;
      install: boolean;
      immediate?: boolean;
      verbose?: boolean;
    }) => {
      try {
        rejectConflictingImmediateFlags(process.argv.slice(2));
        await runCreateApp({
          name: options.name,
          template: normalizeTemplate(options.template),
          backendFramework: normalizeBackendFramework(options.backendFramework),
          apiKey: options.apiKey,
          auth: normalizeAuth(options.auth),
          skill: options.skill,
          noInteractive: !options.interactive,
          noInstall: !options.install,
          immediate: options.immediate,
          verbose: options.verbose,
        });
      } catch (e) {
        handleCliError(e, "cli_create_failed");
      } finally {
        await telemetry.shutdown();
      }
    },
  );

program
  .command("deploy")
  .description("Deploy an OpenUI project")
  .usage("[dir] [options]")
  .argument("[dir]", "Project directory (default: current directory)")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("--skip-env", "Do not pass or save local .env values")
  .option("--no-interactive", "Skip prompts (implies --yes)")
  .option("--verbose", "Stream full deployment build logs")
  .allowUnknownOption()
  .allowExcessArguments()
  .addHelpText(
    "after",
    `
Deploys an OpenUI project to Vercel. If you are not logged in, opens vercel login
first. Links the project when needed, then offers to save missing allowlisted
keys from .env / .env.local to the Vercel project (auto-accepted with --yes).
Build logs are hidden by default; pass --verbose to stream them. On failure the
log tail is printed.

Extra flags after deploy are forwarded as-is to the target deployment platform,
which validates them (for example --prod or --force).

Examples:
  $ openui deploy
  $ openui deploy ./my-app
  $ openui deploy ./my-app --prod
  $ openui deploy --verbose
  $ openui deploy -- --archive=tgz
`,
  )
  .action(
    async (
      dir: string | undefined,
      options: {
        yes?: boolean;
        skipEnv?: boolean;
        interactive: boolean;
        verbose?: boolean;
      },
      command: Command,
    ) => {
      try {
        await runDeploy({
          dir,
          yes: options.yes,
          skipEnv: options.skipEnv,
          noInteractive: !options.interactive,
          verbose: options.verbose,
          extraArgs: command.args,
        });
      } catch (e) {
        handleCliError(e, "cli_deploy_failed");
      } finally {
        await telemetry.shutdown();
      }
    },
  );

program
  .command("generate-api-key")
  .description("Mint an OpenUI Cloud API key and write it to a project env file")
  .option("-f, --file <path>", "Env file to write", DEFAULT_ENV_FILE)
  .option("-k, --key <name>", "Environment variable name", "THESYS_API_KEY")
  .option("-n, --name <string>", "Name of the minted key in the Thesys console")
  .addHelpText(
    "after",
    `
Run this inside an existing project. It uses the same browser sign-in as
openui create, mints an OpenUI Cloud API key, and writes it to the env file.

Examples:
  openui generate-api-key
  openui generate-api-key --file .env.local
  openui generate-api-key --file .env.local --key THESYS_API_KEY
`,
  )
  .action(async (options: { file?: string; key?: string; name?: string }) => {
    try {
      await runGenerateApiKey({
        file: options.file,
        key: options.key,
        name: options.name,
      });
    } catch (e) {
      handleCliError(e, "cli_generate_api_key_failed");
    } finally {
      await telemetry.shutdown();
    }
  });

program
  .command("generate")
  .description("Generate the system prompt + serialized spec from a library definition")
  .argument("[entry]", "Path to a file that exports a createLibrary() result")
  .option(
    "-o, --out <file>",
    "Write the prompt to a file; the spec JSON lands alongside with .spec.json extension",
  )
  .option(
    "--json-schema",
    "Output JSON schema with component signatures for standalone prompt generation",
  )
  .option("--spec", "Generate a serialized library spec JSON (signatures, groups, JSON schema)")
  .option("--export <name>", "Name of the export to use (auto-detected by default)")
  .option(
    "--prompt-options <name>",
    "Name of the PromptOptions export to use (auto-detected by default)",
  )
  .option("--no-interactive", "Fail with error if required args are missing")
  .action(async (entry: string | undefined, options: GenerateOptions) => {
    try {
      const args = await resolveArgs(
        {
          entry: entry
            ? { value: entry }
            : {
                prompt: { type: "input", message: "Entry file path?" },
                required: true,
              },
        },
        options.interactive,
      );

      await runGenerate((args as { entry: string }).entry, options);
    } catch (e) {
      handleCliError(e, "cli_generate_failed");
    } finally {
      await telemetry.shutdown();
    }
  });

program.parse();
