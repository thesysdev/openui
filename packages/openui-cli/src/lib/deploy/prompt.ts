import { CliCancelledError } from "../telemetry";

export function canPromptInteractive(noInteractive = false): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY) && !noInteractive;
}

/**
 * Confirm with a default of yes. `--yes` / `--no-interactive` / non-TTY skip
 * the prompt and return `true` (safe default for deploy happy paths).
 */
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
