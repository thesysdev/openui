/**
 * gws CLI bridge — executes Google Workspace CLI commands and parses JSON output.
 *
 * The `gws` binary must be installed (`npm i -g @googleworkspace/cli`)
 * and authenticated (`gws auth setup && gws auth login -s calendar`).
 *
 * Gracefully degrades: returns an error string if gws is missing or auth fails.
 */
import { execFile } from "node:child_process";

export async function runGws(args: string[]): Promise<unknown> {
  return new Promise((resolve) => {
    execFile("gws", args, { timeout: 30_000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        const msg = stderr?.trim() || err.message;
        if (msg.includes("ENOENT") || msg.includes("not found")) {
          resolve({ error: "gws CLI not found — run: npm install -g @googleworkspace/cli" });
          return;
        }
        if (msg.includes("auth") || msg.includes("credential") || msg.includes("token")) {
          resolve({ error: "gws not authenticated — run: gws auth setup && gws auth login -s calendar" });
          return;
        }
        console.error(`[gws] Command failed: gws ${args.join(" ")}`, msg);
        resolve({ error: `gws error: ${msg}` });
        return;
      }

      const text = stdout.trim();
      if (!text) {
        resolve({ error: "gws returned empty response" });
        return;
      }

      try {
        resolve(JSON.parse(text));
      } catch {
        resolve({ raw: text });
      }
    });
  });
}
