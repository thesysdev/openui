import { Command } from "commander";

import { context } from "../../lib/context";

import { runFeedback } from "./run";

type FeedbackOptions = {
  category?: string;
};

export const feedbackCommand = new Command("feedback")
  .description("Send anonymous feedback about OpenUI to the OpenUI team")
  .argument("<message...>")
  .option("-c, --category <category>", "bug | feature | docs | other")
  .addHelpText(
    "after",
    `
Examples:
  openui feedback "The streaming docs don't explain how to handle partial components"
  openui --agent-name codex feedback --category bug "Renderer throws when a streamed component closes before its props"
`,
  )
  .action(async (messageWords: string[], options: FeedbackOptions, command: Command) => {
    const globalOptions = command.optsWithGlobals<{ agentName?: string }>();
    await runFeedback(
      {
        messageWords,
        category: options.category,
        agentName: globalOptions.agentName,
      },
      context,
    );
  });
