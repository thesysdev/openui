import { Command, Option } from "commander";

import { context } from "../../lib/context";

import { runAuthLogin, runAuthLogout } from "./run";

const jsonOption = () => new Option("--json", "Print machine-readable JSON");

const loginCommand = new Command("login")
  .description("Sign in to Thesys so commands can mint API keys without opening the browser again")
  .addOption(jsonOption())
  .addOption(new Option("--background-child").hideHelp())
  .addHelpText(
    "after",
    `
In a terminal, this opens the browser and waits for you to sign in.

When run by a coding agent (or without a TTY), it starts the sign-in in the
background, prints the link, and exits 75. Show the link to the user and re-run
the command: it waits for the sign-in to finish (exit 0), or exits 75 again if
the user isn't done yet. create and generate-api-key behave the same way, so
running this first is optional.
`,
  )
  .action(async (options: { json?: boolean; backgroundChild?: boolean }) => {
    await runAuthLogin(options, context);
  });

const logoutCommand = new Command("logout")
  .description("Forget the saved Thesys sign-in")
  .addOption(jsonOption())
  .action((options: { json?: boolean }) => {
    runAuthLogout(options);
  });

export const authCommand = new Command("auth")
  .description("Sign in to Thesys for API key generation")
  .addCommand(loginCommand)
  .addCommand(logoutCommand);
