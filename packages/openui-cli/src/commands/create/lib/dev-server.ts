import * as http from "node:http";

import { runCommand, type CommandResult } from "../../../lib/process-runner";

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

async function openWhenReady(url: string, didExit: () => boolean): Promise<void> {
  // A free port is not necessarily accepting connections yet. Wait for the dev
  // server to respond so the browser does not open to a connection-refused page.
  const timeoutAt = Date.now() + 60_000;
  while (!didExit() && Date.now() < timeoutAt) {
    if (await isServerReady(url)) {
      console.info(`\n\ud83c\udf10 Opening ${url} in your browser...`);
      try {
        const { default: open } = await import("open");
        await open(url);
      } catch {
        console.info(`Could not open a browser automatically. Visit ${url}`);
      }
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

export async function runDevCommand(command: string, cwd: string): Promise<CommandResult> {
  const { default: getPort, portNumbers } = await import("get-port");
  const port = await getPort({ port: portNumbers(3000, 3100) });
  const url = `http://localhost:${port}`;
  let exited = false;
  const resultPromise = runCommand(command, ["run", "dev"], cwd, {
    env: { ...process.env, PORT: String(port) },
  });
  void openWhenReady(url, () => exited);
  const result = await resultPromise;
  exited = true;
  return result;
}
