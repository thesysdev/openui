import * as readline from "node:readline";

/**
 * Terminal spinner for long-running work. Safe in non-TTY (prints the label once).
 * Clears the spinner line before resolving so callers can print a final status.
 *
 * Uses readline cursor APIs instead of bare `\r` — some terminals (including
 * Cursor/VS Code) don't reliably overwrite the current line with carriage return.
 */
export async function withSpinner<T>(label: string, run: () => Promise<T>): Promise<T> {
  if (!process.stdout.isTTY) {
    console.info(label);
    return run();
  }

  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let frame = 0;

  const render = () => {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${frames[frame]} ${label}`);
  };

  render();
  const timer = setInterval(() => {
    frame = (frame + 1) % frames.length;
    render();
  }, 80);
  timer.unref();

  try {
    return await run();
  } finally {
    clearInterval(timer);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
  }
}
