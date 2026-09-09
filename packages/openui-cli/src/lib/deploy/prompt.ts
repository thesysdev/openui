import { CliCancelledError } from "../telemetry";

/** True when stdin/stdout are TTYs and `--no-interactive` was not passed. */
export function canPromptInteractive(noInteractive = false): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY) && !noInteractive;
}

/** Confirm with default yes; `--yes`, `--no-interactive`, and non-TTY skip the prompt. */
export async function confirmOrDefault(
  message: string,
  opts: { yes?: boolean; noInteractive?: boolean; cancelStage: string },
): Promise<boolean> {
  if (opts.yes || opts.noInteractive) return true;
  if (!canPromptInteractive()) return true;

  try {
    const { confirm } = await import("@inquirer/prompts");
    return await confirm({ message, default: true });
  } catch (err) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (err instanceof ExitPromptError) {
      throw new CliCancelledError(opts.cancelStage);
    }
    throw err;
  }
}
