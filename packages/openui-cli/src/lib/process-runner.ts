import spawn from "cross-spawn";

const DIAGNOSTIC_TAIL_LIMIT = 16 * 1024;

export type CommandResult = {
  durationMs: number;
  status: number | null;
  signal: NodeJS.Signals | null;
  error?: Error;
  diagnosticTail: string;
};

/** Quiet npm/npx progress when we spawn a nested package-manager CLI. */
export function mutedNpmEnv(base: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return {
    ...base,
    npm_config_loglevel: "error",
    NPM_CONFIG_LOGLEVEL: "error",
  };
}

export type RunCommandOptions = {
  env?: NodeJS.ProcessEnv;
  /** When false, capture stdout/stderr without writing them to the parent. Default true. */
  echo?: boolean;
  /** Default inherit so interactive CLIs can prompt. Use ignore for login probes. */
  stdin?: "inherit" | "ignore";
  /** Inherit stdout/stderr so the child sees a TTY (needed for `vercel login`). */
  inheritOutput?: boolean;
  /** Max bytes retained in `diagnosticTail` when output is piped. Default 16KiB. */
  captureLimit?: number;
};

/**
 * `spawn.sync(..., { stdio: "inherit" })` exposes exit status but not the output
 * needed to distinguish dependency, workspace, and package-compatibility failures.
 * This runner preserves normal terminal streaming while retaining only a bounded
 * local tail for allowlisted classification. The tail must never be sent to telemetry.
 *
 * Running asynchronously also lets the parent forward SIGINT/SIGTERM, wait for the
 * child to close, and return cancellation metadata before telemetry is flushed.
 */
export function runCommand(
  command: string,
  args: string[],
  cwd: string,
  options: RunCommandOptions = {},
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const echo = options.echo !== false;
    const inheritOutput = Boolean(options.inheritOutput);
    const captureLimit = options.captureLimit ?? DIAGNOSTIC_TAIL_LIMIT;
    const child = spawn(command, args, {
      cwd,
      env: options.env,
      stdio: [
        options.stdin === "ignore" ? "ignore" : "inherit",
        inheritOutput ? "inherit" : "pipe",
        inheritOutput ? "inherit" : "pipe",
      ],
    });
    let diagnosticTail = "";
    let settled = false;
    let forwardedSignal: NodeJS.Signals | null = null;
    let forceKillTimer: NodeJS.Timeout | undefined;

    const observe = (chunk: Buffer) => {
      diagnosticTail = (diagnosticTail + chunk.toString("utf8")).slice(-captureLimit);
    };
    if (!inheritOutput) {
      child.stdout?.on("data", (chunk: Buffer) => {
        if (echo) process.stdout.write(chunk);
        observe(chunk);
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        if (echo) process.stderr.write(chunk);
        observe(chunk);
      });
    }

    const finish = (result: Omit<CommandResult, "diagnosticTail" | "durationMs">) => {
      if (settled) return;
      settled = true;
      process.off("SIGINT", onSigint);
      process.off("SIGTERM", onSigterm);
      if (forceKillTimer) clearTimeout(forceKillTimer);
      resolve({
        ...result,
        diagnosticTail,
        durationMs: Math.max(0, Date.now() - startedAt),
      });
    };

    // Prevent the parent from exiting before the child reports which signal stopped it.
    const forwardSignal = (signal: NodeJS.Signals) => {
      if (forwardedSignal) {
        child.kill("SIGKILL");
        return;
      }
      forwardedSignal = signal;
      child.kill(signal);
      // Do not hang indefinitely when a child ignores the forwarded signal.
      forceKillTimer = setTimeout(() => child.kill("SIGKILL"), 5000);
      forceKillTimer.unref();
    };
    const onSigint = () => forwardSignal("SIGINT");
    const onSigterm = () => forwardSignal("SIGTERM");

    process.on("SIGINT", onSigint);
    process.on("SIGTERM", onSigterm);
    child.once("error", (error) => finish({ status: null, signal: forwardedSignal, error }));
    child.once("close", (status, signal) => finish({ status, signal: forwardedSignal ?? signal }));
  });
}
