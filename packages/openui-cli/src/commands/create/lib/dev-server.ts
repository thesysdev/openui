import * as http from "node:http";
import * as net from "node:net";

import { runCommand, type CommandResult } from "../../../lib/process-runner";

export type DevCommandResult = CommandResult & { timedOut: boolean };

export type DevCommandOptions = {
  /** Stop the dev server when it is not listening on its port within this window. */
  startupTimeoutMs?: number;
  /** Called once the dev server is listening (only with `startupTimeoutMs`). */
  onStarted?: (url: string) => void;
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

function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "localhost" });
    socket.setTimeout(1_000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => socket.destroy());
    socket.once("error", () => resolve(false));
    socket.once("close", () => resolve(false));
  });
}

async function waitUntil(
  check: () => Promise<boolean>,
  timeoutMs: number,
  didExit: () => boolean,
): Promise<boolean> {
  const timeoutAt = Date.now() + timeoutMs;
  while (!didExit() && Date.now() < timeoutAt) {
    if (await check()) return true;
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
  const didExit = () => exited;
  void (async () => {
    const { startupTimeoutMs } = options;
    if (startupTimeoutMs !== undefined) {
      if (!(await waitUntil(() => isPortListening(port), startupTimeoutMs, didExit))) {
        if (exited) return;
        timedOut = true;
        console.error(
          `\nDevelopment server did not start on ${url} within ${Math.round(startupTimeoutMs / 1000)}s. Stopping it.`,
        );
        abort.abort();
        return;
      }
      options.onStarted?.(url);
    }
    // A listening port is not necessarily serving pages yet. Wait for the dev
    // server to respond so the browser does not open to a connection-refused page.
    if (await waitUntil(() => isServerReady(url), DEFAULT_READY_WAIT_MS, didExit)) {
      await openInBrowser(url);
    }
  })();
  const result = await resultPromise;
  exited = true;
  return { ...result, timedOut };
}
