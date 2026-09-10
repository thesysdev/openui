import { CliCancelledError } from "../telemetry";

/** True when stdin/stdout are TTYs and `--no-interactive` was not passed. */
export function canPromptInteractive(noInteractive = false): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY) && !noInteractive;
}

/**
 * Confirm with default yes when a TTY is available. `--yes` accepts without
 * asking. No TTY and no `--yes` returns false so secrets are not written remotely.
 */
export async function confirmOrDefault(
  message: string,
  opts: { yes?: boolean; noInteractive?: boolean; cancelStage: string },
): Promise<boolean> {
  if (opts.yes) return true;
  if (!canPromptInteractive(opts.noInteractive)) return false;

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
