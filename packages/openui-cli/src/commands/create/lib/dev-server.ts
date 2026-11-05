import * as http from "node:http";

import type { PackageManager } from "../../../lib/detect-package-manager";
import { processErrorProperties } from "../../../lib/errors";
import { runCommand, type CommandResult } from "../../../lib/process-runner";
import { cdStep } from "./messages";
import type { CreateTelemetryClient } from "./telemetry";

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

/** Runs `<pm> run dev` in the project until the user stops it, and reports how it ended. */
export async function runDevServer(params: {
  tel: CreateTelemetryClient;
  packageManager: PackageManager;
  targetDir: string;
  /** What to `cd` into in the retry hint: the project folder, or `.` when created in place. */
  dir: string;
}): Promise<void> {
  const { tel, packageManager, targetDir, dir } = params;
  const devCmd = packageManager.runCmd;
  tel.trackDevCommandStarted({
    package_manager: packageManager.name,
  });
  const devResult = await runDevCommand(devCmd, targetDir);
  const stoppedNormally =
    devResult.status === 0 ||
    devResult.status === 130 ||
    devResult.status === 143 ||
    devResult.signal === "SIGINT" ||
    devResult.signal === "SIGTERM";

  if (stoppedNormally) {
    tel.trackDevCommandStopped({
      package_manager: packageManager.name,
      duration_ms: devResult.durationMs,
      exit_code: devResult.status,
      failure_signal: devResult.signal,
    });
    return;
  }

  const exitCode = devResult.status ?? 1;
  const properties = processErrorProperties(devResult, "dev_server", {
    error_class: "process",
    error_code: "NONZERO_EXIT",
  });
  tel.trackDevCommandFailed({
    package_manager: packageManager.name,
    failure_reason: devResult.error ? "spawn_error" : "nonzero_exit",
    ...properties,
  });
  console.error(
    `\nDevelopment server exited. Retry with:\n\n${[...cdStep(dir), `> ${devCmd} run dev`].join("\n")}\n`,
  );
  process.exitCode = exitCode;
}
