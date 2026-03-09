#!/usr/bin/env node

import { Command } from "commander";

import { runCreateChatApp } from "./commands/create-chat-app";
import { runGenerate } from "./commands/generate";

const program = new Command();

program.name("openui").description("CLI for OpenUI").version("0.0.1");

program
  .command("chat")
  .description("Scaffold a new Next.js app with OpenUI Chat")
  .option("-n, --name <string>", "Project name")
  .option("--no-interactive", "Fail with error if required args are missing")
  .action(async (options: { name?: string; interactive: boolean }) => {
    await runCreateChatApp({ name: options.name, noInteractive: !options.interactive });
  });

program
  .command("generate")
  .description("Generate system prompt or JSON schema from a library definition")
  .argument("<entry>", "Path to a file that exports a createLibrary() result")
  .option("-o, --out <file>", "Write output to a file instead of stdout")
  .option("--json-schema", "Output JSON schema instead of the system prompt")
  .option("--export <name>", "Name of the export to use (auto-detected by default)")
  .action(
    async (
      entry: string,
      options: { out?: string; jsonSchema?: boolean; export?: string },
    ) => {
      await runGenerate(entry, options);
    },
  );

program.parse();
