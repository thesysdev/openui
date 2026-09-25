/** Enough build/install output to dump a useful failure tail in quiet mode. */
export const QUIET_COMMAND_CAPTURE_LIMIT = 256 * 1024;

export function printLogTail(log: string, title = "build log (tail)"): void {
  const trimmed = log.trim();
  if (!trimmed) return;
  console.error(`\n--- ${title} ---\n`);
  process.stderr.write(trimmed + "\n");
  console.error("---\n");
}
