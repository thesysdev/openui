import { Command } from "commander";

import { context } from "../../lib/context";
import { resolveArgs } from "../../lib/resolve-args";

import { type GenerateOptions, runGenerate } from "./run";

export const generateCommand = new Command("generate")
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

    await runGenerate((args as { entry: string }).entry, options, context);
  });
