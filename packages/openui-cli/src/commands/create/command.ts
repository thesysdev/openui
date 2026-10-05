import { Command } from "commander";

import { normalizeAuth } from "../../lib/auth/mint";
import { context } from "../../lib/context";
import { rejectConflictingScaffoldSelectors } from "./lib/examples-catalog";
import { printCreateHelp } from "./lib/help";
import { rejectConflictingImmediateFlags } from "./lib/resolve";

import { runCreateApp } from "./run";

export const createCommand = new Command("create")
  .description(
    "Scaffold a Next.js agent app with the recommended OpenUI Cloud backend or your own provider",
  )
  .option("-n, --name <string>", "Project name (interactive default: openui-agent)")
  .option("-t, --template <template>", "AI backend to use (default: openui-cloud)")
  .option("--backend-framework <framework>", "Backend framework to use")
  .option("-e, --example <example>", "Create from an example in examples/examples.json")
  .option("--api-key <key>", "OpenUI Cloud API key (cloud template; skips sign-in)")
  .option("--auth <method>", "Cloud auth method: oauth | skip (manual is deprecated)")
  .option("--skill", "Install the OpenUI agent skill for AI coding assistants")
  .option("--no-skill", "Skip installing the OpenUI agent skill")
  .option("--no-interactive", "Fail with error if required args are missing")
  .option("--no-install", "Scaffold without running the package install")
  .option("-i, --immediate", "Start the development server after installing dependencies")
  .option("--no-immediate", "Install dependencies without starting the development server")
  .helpOption(false)
  .option("-h, --help", "display help for command")
  .action(
    async (options: {
      name?: string;
      template?: string;
      backendFramework?: string;
      example?: string;
      apiKey?: string;
      auth?: string;
      skill?: boolean;
      interactive: boolean;
      install: boolean;
      immediate?: boolean;
      help?: boolean;
    }) => {
      if (options.help) {
        await printCreateHelp(createCommand);
        return;
      }

      rejectConflictingImmediateFlags(context.argv.slice(2));
      rejectConflictingScaffoldSelectors({
        example: options.example,
        backendFramework: options.backendFramework,
        template: options.template,
      });

      await runCreateApp(
        {
          name: options.name,
          template: options.template,
          backendFramework: options.backendFramework,
          example: options.example,
          apiKey: options.apiKey,
          auth: normalizeAuth(options.auth),
          skill: options.skill,
          noInteractive: !options.interactive,
          noInstall: !options.install,
          immediate: options.immediate,
        },
        context,
      );
    },
  );

// `openui help create` calls help() (sync) then, if it doesn't exit, dispatches `--help`.
createCommand.help = (() => undefined) as Command["help"];
