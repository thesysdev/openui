import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PostHog } from "posthog-node";

import { isTruthyEnv } from "./env";
import { cliErrorProperties } from "./errors";
import type { RetryAttemptInfo } from "./retry";

// Public ingestion key
const POSTHOG_KEY =
  process.env["OPENUI_POSTHOG_KEY"] ?? "phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D";
const POSTHOG_HOST = process.env["OPENUI_POSTHOG_HOST"] ?? "https://us.i.posthog.com";
const SHUTDOWN_TIMEOUT_MS = 2000;

const isTelemetryDebug = () => process.env["OPENUI_TELEMETRY_DEBUG"] === "1";
const configDir = () =>
  path.join(process.env["XDG_CONFIG_HOME"] ?? path.join(os.homedir(), ".config"), "openui");
const isCi = () => {
  const e = process.env;
  return isTruthyEnv(e["CI"]) || !!e["GITHUB_ACTIONS"] || !!e["GITLAB_CI"] || !!e["BUILDKITE"];
};
const isInteractiveTerminal = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);
const debugLogPostHogFailure = (stage: string, error: unknown) => {
  if (!isTelemetryDebug()) return;
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[OpenUI telemetry] PostHog ${stage} failed: ${message}`);
};

type Stored = { distinctId: string; firstRunNoticeShown?: boolean };

function loadOrCreateState() {
  const file = path.join(configDir(), "telemetry.json");
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Stored;
    return {
      distinctId: raw.distinctId,
      isFirstRun: !raw.firstRunNoticeShown,
      persist: () => writeState(file, { ...raw, firstRunNoticeShown: true }),
    };
  } catch {
    /* missing/corrupt → create */
  }
  const fresh: Stored = { distinctId: crypto.randomUUID(), firstRunNoticeShown: false };
  return {
    distinctId: fresh.distinctId,
    isFirstRun: true,
    persist: () => writeState(file, { ...fresh, firstRunNoticeShown: true }),
  };
}

function writeState(file: string, s: Stored) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(s));
  } catch {
    /* read-only fs / CI: best-effort */
  }
}

type Session = {
  client?: PostHog;
  distinctId: string;
  superProps: Record<string, unknown>;
  enabled: boolean;
};

export class Telemetry {
  private readonly session: Session;

  constructor(source?: Telemetry) {
    this.session = source?.session ?? {
      distinctId: "anonymous",
      superProps: {},
      enabled: false,
    };
  }

  init(opts: { cliVersion: string; flagEnabled: boolean }) {
    const optedOut =
      isTruthyEnv(process.env["DO_NOT_TRACK"]) ||
      isTruthyEnv(process.env["OPENUI_TELEMETRY_DISABLED"]) ||
      opts.flagEnabled === false;
    if (optedOut) return; // enabled stays false → all capture() are no-ops
    const state = loadOrCreateState();
    this.session.distinctId = state.distinctId;
    const interactiveTerminal = isInteractiveTerminal();
    this.session.superProps = {
      cli_version: opts.cliVersion,
      os: process.platform,
      os_release: os.release(),
      arch: process.arch,
      node_version: process.version,
      ci: isCi(),
      stdin_is_tty: Boolean(process.stdin.isTTY),
      stdout_is_tty: Boolean(process.stdout.isTTY),
      is_interactive_terminal: interactiveTerminal,
    };
    try {
      this.session.client = new PostHog(POSTHOG_KEY, {
        host: POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      });
      // Telemetry is best-effort: swallow network/flush errors so an offline CLI
      // run never spams the user's console with PostHog stack traces.
      this.session.client.on("error", (error) => debugLogPostHogFailure("request", error));
    } catch (error) {
      debugLogPostHogFailure("init", error);
      return;
    }
    this.session.enabled = true;
    // posthog-core logs flush failures via a hardcoded console.error (not gated on
    // any logger/option). Filter ONLY those lines so an offline run stays quiet —
    // the CLI's own console.error output passes through untouched.
    const origError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("flushing PostHog")) return;
      origError(...args);
    };
    if (isTelemetryDebug()) this.session.client.debug();
    if (state.isFirstRun) {
      process.stderr.write(
        "\n◆ OpenUI CLI collects usage analytics; OAuth sign-ins may link usage to your OIDC account ID.\n" +
          "  No code, prompts, API keys, email, or personal name are collected. Opt out: set DO_NOT_TRACK=1 or pass --no-telemetry.\n\n",
      );
      state.persist();
    }
  }

  register(props: Record<string, unknown>) {
    if (this.session.enabled) Object.assign(this.session.superProps, props);
  }

  registerRun(props: {
    agent_name: string;
    detected_agent_name: string;
    cli_run_id: string;
    command: string;
  }) {
    this.register(props);
  }

  trackInvoked() {
    this.capture("cli_invoked");
  }

  trackNetworkRetry(props: {
    failure_stage: string;
    attempt: number;
    max_attempts: number;
    delay_ms: number;
    error_class: string;
    error_code: string;
  }) {
    this.capture("cli_network_retry", props);
  }

  retryReporter(stage: string): (info: RetryAttemptInfo) => void {
    return (info) => {
      const properties = cliErrorProperties(info.error);
      this.trackNetworkRetry({
        failure_stage: stage,
        attempt: info.attempt,
        max_attempts: info.maxAttempts,
        delay_ms: info.delayMs,
        error_class: properties.error_class,
        error_code: properties.error_code,
      });
    };
  }

  capture(event: string, properties: Record<string, unknown> = {}) {
    const { enabled, client, distinctId, superProps } = this.session;
    if (!enabled || !client) return;
    try {
      client.capture({
        distinctId,
        event,
        properties: { ...superProps, ...properties },
      });
    } catch (error) {
      debugLogPostHogFailure("capture", error);
    }
  }

  alias(distinctId: string, alias: string) {
    const { enabled, client } = this.session;
    if (!enabled || !client) return;
    if (!distinctId || !alias || distinctId === alias) return;
    try {
      client.alias({ distinctId, alias });
      client.setPersonProperties({
        distinctId,
        propertiesOnce: {
          first_cli_auth_ts: new Date().toISOString(),
        },
      });
    } catch (error) {
      debugLogPostHogFailure("alias", error);
    }
  }

  aliasOidcSubject(oidcSub: string) {
    const { enabled, client, distinctId } = this.session;
    if (!enabled || !client || !oidcSub || oidcSub === distinctId) {
      return;
    }

    this.alias(oidcSub, distinctId);
  }

  async shutdown() {
    const { enabled, client } = this.session;
    if (!enabled || !client) return;
    try {
      await Promise.race([
        client.shutdown(),
        new Promise<void>((r) => setTimeout(r, SHUTDOWN_TIMEOUT_MS)),
      ]);
    } catch (error) {
      debugLogPostHogFailure("shutdown", error);
    }
  }
}

export const telemetry = new Telemetry();
