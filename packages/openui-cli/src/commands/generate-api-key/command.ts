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
  .addHelpText(
    "after",
    `
Run this inside an existing project. It uses the same browser sign-in as
openui create, mints an OpenUI Gateway API key, and writes it to the env file.

Examples:
  openui generate-api-key
  openui generate-api-key --file .env.local
  openui generate-api-key --file .env.local --key THESYS_API_KEY
`,
  )
  .action(async (options: { file?: string; key?: string; name?: string }) => {
    await runGenerateApiKey(options, context);
  });
