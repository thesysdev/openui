import { Command } from "commander";

import { context } from "../../lib/context";
import { DEFAULT_ENV_FILE } from "../../lib/env";

import { runGenerateApiKey } from "./run";

export const generateApiKeyCommand = new Command("generate-api-key")
  .description("Mint an OpenUI Gateway API key and write it to a project env file")
  .option("-f, --file <path>", "Env file to write", DEFAULT_ENV_FILE)
  .option(
    "-k, --key <name>",
    "Environment variable name (letters, digits, underscores)",
    "THESYS_API_KEY",
  )
  .option("-n, --name <string>", "Name of the minted key in the Thesys console")
  .option("--no-dev", "Don't start the development server after writing the key")
  .addHelpText(
    "after",
    `
Run this inside an existing project. It uses the same browser sign-in as
openui create, mints an OpenUI Gateway API key, and writes it to the env file.
It then starts the project's dev script unless you pass --no-dev.

Examples:
  openui generate-api-key
  openui generate-api-key --file .env.local
  openui generate-api-key --file .env.local --key THESYS_API_KEY
  openui generate-api-key --no-dev
`,
  )
  .action(async (options: { file?: string; key?: string; name?: string; dev?: boolean }) => {
    await runGenerateApiKey(options, context);
  });
