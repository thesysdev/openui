import * as http from "node:http";

import { runCommand, type CommandResult } from "../../../lib/process-runner";

export type DevCommandResult = CommandResult & { timedOut: boolean };

export type DevCommandOptions = {
  /** Stop the dev server when it does not respond within this window. */
  startupTimeoutMs?: number;
};

const DEFAULT_READY_WAIT_MS = 60_000;

function isServerReady(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: 1_000 }, (response) => {
      response.resume();
      resolve(true);
    });
    request.once("timeout", () => request.destroy());
    request.once("error", () => resolve(false));
  });
}

async function waitUntilReady(
  url: string,
  timeoutMs: number,
  didExit: () => boolean,
): Promise<boolean> {
  // A free port is not necessarily accepting connections yet. Wait for the dev
  // server to respond so the browser does not open to a connection-refused page.
  const timeoutAt = Date.now() + timeoutMs;
  while (!didExit() && Date.now() < timeoutAt) {
    if (await isServerReady(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

async function openInBrowser(url: string): Promise<void> {
  console.info(`\n\ud83c\udf10 Opening ${url} in your browser...`);
  try {
    const { default: open } = await import("open");
    await open(url);
  } catch {
    console.info(`Could not open a browser automatically. Visit ${url}`);
  }
}

export async function runDevCommand(
  command: string,
  cwd: string,
  options: DevCommandOptions = {},
): Promise<DevCommandResult> {
  const { default: getPort, portNumbers } = await import("get-port");
  const port = await getPort({ port: portNumbers(3000, 3100) });
  const url = `http://localhost:${port}`;
  const abort = new AbortController();
  let exited = false;
  let timedOut = false;
  const resultPromise = runCommand(command, ["run", "dev"], cwd, {
    env: { ...process.env, PORT: String(port) },
    signal: abort.signal,
  });
  const startupTimeoutMs = options.startupTimeoutMs;
  void waitUntilReady(url, startupTimeoutMs ?? DEFAULT_READY_WAIT_MS, () => exited).then(
    async (ready) => {
      if (ready) return openInBrowser(url);
      if (exited || startupTimeoutMs === undefined) return;
      timedOut = true;
      console.error(
        `\nDevelopment server did not respond at ${url} within ${Math.round(startupTimeoutMs / 1000)}s. Stopping it.`,
      );
      abort.abort();
    },
  );
  const result = await resultPromise;
  exited = true;
  return { ...result, timedOut };
}
