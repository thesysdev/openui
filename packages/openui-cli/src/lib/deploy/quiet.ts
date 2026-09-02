import type { CliInvocation } from "../cli-bin";
import { QUIET_COMMAND_CAPTURE_LIMIT } from "../command-output";
import { runCommand, type CommandResult } from "../process-runner";
import { withSpinner } from "../spinner";

export type QuietCommandOptions = {
  invocation: CliInvocation;
  args: string[];
  cwd: string;
  label: string;
  env?: NodeJS.ProcessEnv;
  captureLimit?: number;
};

/** Run a platform CLI with output captured and a spinner in the terminal. */
export async function runQuietCommand(opts: QuietCommandOptions): Promise<CommandResult> {
  return withSpinner(opts.label, () =>
    runCommand(
      opts.invocation.command,
      [...opts.invocation.quietPrefixArgs, ...opts.args],
      opts.cwd,
      {
        echo: false,
        stdin: "ignore",
        captureLimit: opts.captureLimit ?? QUIET_COMMAND_CAPTURE_LIMIT,
        env: opts.env,
      },
    ),
  );
}

export type DeploySuccessSummary = {
  url?: string;
  inspect?: string;
};

export function printQuietDeploySuccess(summary: DeploySuccessSummary, durationMs: number): void {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  console.info(`✓ Deployed in ${seconds}s`);
  if (summary.url) console.info(`  ${summary.url}`);
  if (summary.inspect) console.info(`  Inspect  ${summary.inspect}`);
  console.info("");
}
