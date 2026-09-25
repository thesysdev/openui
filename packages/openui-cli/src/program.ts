import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { Command } from "commander";

import { commands } from "./commands";
import { CreateTelemetryClient } from "./commands/create/lib/telemetry";
import { context as ctx } from "./lib/context";
import { detectAgent, UNKNOWN_AGENT_NAME } from "./lib/detect-agent";
import { CliCancelledError, cliErrorProperties, CreateError } from "./lib/errors";

let activeCommand = "unknown";

function buildProgram(): Command {
  const program = new Command();

  const cliVersion = (
    JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")) as {
      version: string;
    }
  ).version;

  program.name("openui").description("CLI for OpenUI").version(cliVersion);
  program.option("--no-telemetry", "Disable anonymous usage analytics");
  program.option("--verbose", "Stream full command logs");
  program.option(
    "--agent-name <name>",
    "AI agents: declare your stable lowercase kebab-case product slug for telemetry (e.g. codex or claude-code); humans can omit",
    UNKNOWN_AGENT_NAME,
  );
  program.configureHelp({ showGlobalOptions: true });

  program.hook("preAction", (_thisCommand, actionCommand) => {
    activeCommand = actionCommand.name();
    const globalOptions = program.opts<{
      agentName: string;
      telemetry?: boolean;
      verbose?: boolean;
    }>();
    ctx.verbose = Boolean(globalOptions.verbose || actionCommand.optsWithGlobals()["verbose"]);
    ctx.telemetry.init({ cliVersion, flagEnabled: globalOptions.telemetry !== false });
    ctx.telemetry.registerRun({
      agent_name: globalOptions.agentName,
      detected_agent_name: detectAgent(),
      cli_run_id: randomUUID(),
      command: actionCommand.name(),
    });
    ctx.telemetry.trackInvoked();
  });

  for (const command of commands) {
    command.configureHelp({ showGlobalOptions: true });
    program.addCommand(command);
  }

  return program;
}

function handleCliError(e: unknown, event: string, extra?: Record<string, unknown>): void {
  const cancelled = e instanceof CliCancelledError;
  const message = e instanceof Error ? e.message : String(e);
  if (cancelled) console.info("Cancelled.");
  else console.error(e instanceof CreateError ? `Error: ${message}` : message);

  const errorProperties = cliErrorProperties(e);
  const capturedEvent = cancelled ? event.replace(/_failed$/, "_cancelled") : event;
  ctx.telemetry.capture(capturedEvent, { ...extra, ...errorProperties });

  process.exitCode = cancelled ? e.exitCode : 1;
}

export async function runProgram(): Promise<void> {
  const program = buildProgram();
  try {
    await program.parseAsync(process.argv);
  } catch (e) {
    const cancelled = e instanceof CliCancelledError;
    const event = `cli_${activeCommand.replace(/-/g, "_")}_failed`;
    const extra =
      activeCommand === "create" ? CreateTelemetryClient.failedProperties(cancelled) : undefined;
    handleCliError(e, event, extra);
  } finally {
    await ctx.telemetry.shutdown();
  }
}
