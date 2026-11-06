import { CliCancelledError } from "./errors";

/**
 * Turn Ctrl+C into a CliCancelledError for `stage` while `run` is pending.
 *
 * Network and git work has no prompt or child process listening for SIGINT, so
 * Node would exit on the spot and the cancel would never reach telemetry. The
 * interrupted work keeps running; the program exits once telemetry is flushed.
 * Only the first Ctrl+C is caught, so a second one still quits immediately.
 */
export async function cancelOnInterrupt<T>(stage: string, run: () => Promise<T>): Promise<T> {
  let onSigint = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    onSigint = () => reject(new CliCancelledError(stage, 130));
  });
  process.once("SIGINT", onSigint);
  try {
    return await Promise.race([run(), interrupted]);
  } finally {
    process.off("SIGINT", onSigint);
  }
}
