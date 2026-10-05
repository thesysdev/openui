import {
  ClientSideConnection,
  PROTOCOL_VERSION,
  RequestError,
  ndJsonStream,
  type Client,
  type InitializeResponse,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
  type SessionNotification,
  type SessionUpdate,
} from "@agentclientprotocol/sdk";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { Readable, Writable } from "node:stream";
import {
  cancelGrokBuildInteractions,
  requestGrokBuildInteraction,
} from "./grok-build-interactions";
import { localSystemPrompt } from "./openui-prompt";

const OPENUI_RULES = localSystemPrompt();
const OPENUI_RULES_HASH = createHash("sha256").update(OPENUI_RULES).digest("hex");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface GrokBuildConfig {
  alwaysApprove: boolean;
  bin: string;
  cwd: string;
  model?: string;
  reasoningEffort?: string;
}

interface GrokBuildRetryState {
  attempt?: number;
  error_type?: string;
  max_retries?: number;
  message?: string;
  reason?: string;
  sessionUpdate: "retry_state";
  type?: string;
}

interface GrokBuildTurnCompleted {
  agent_result?: string;
  sessionUpdate: "turn_completed";
  stop_reason?: string;
  usage?: Record<string, unknown>;
}

export type GrokBuildSessionUpdate = SessionUpdate | GrokBuildRetryState | GrokBuildTurnCompleted;

type UpdateListener = (update: GrokBuildSessionUpdate) => void;

const GROK_SESSION_NOTIFICATION_METHODS = new Set([
  "_x.ai/session_notification",
  "x.ai/session_notification",
  "_x.ai/session/update",
  "x.ai/session/update",
]);

export function decodeGrokSessionNotification(
  method: string,
  params: Record<string, unknown>,
): { sessionId: string; update: GrokBuildSessionUpdate } | undefined {
  if (!GROK_SESSION_NOTIFICATION_METHODS.has(method)) return undefined;
  const sessionId = params.sessionId;
  const update = recordValue(params.update);
  const kind = update?.sessionUpdate;
  if (typeof sessionId !== "string" || (kind !== "retry_state" && kind !== "turn_completed")) {
    return undefined;
  }
  return { sessionId, update: update as unknown as GrokBuildSessionUpdate };
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function booleanEnv(name: string, fallback: boolean): boolean {
  const value = optionalEnv(name)?.toLowerCase();
  if (!value) return fallback;
  return !["0", "false", "no", "off"].includes(value);
}

function readConfig(): GrokBuildConfig {
  return {
    alwaysApprove: booleanEnv("GROK_BUILD_ALWAYS_APPROVE", true),
    bin: optionalEnv("GROK_BUILD_BIN") ?? "grok",
    cwd: optionalEnv("GROK_BUILD_CWD") ?? process.cwd(),
    model: optionalEnv("GROK_BUILD_MODEL"),
    reasoningEffort: optionalEnv("GROK_BUILD_REASONING_EFFORT"),
  };
}

function configSignature(config: GrokBuildConfig): string {
  return JSON.stringify({ ...config, openUIRulesHash: OPENUI_RULES_HASH });
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function errorData(error: unknown): unknown {
  if (error instanceof RequestError) return error.data;
  return recordValue(error)?.data;
}

export function formatGrokBuildError(error: unknown): string {
  const errorRecord = recordValue(error);
  const message =
    error instanceof Error
      ? error.message === "[object Object]"
        ? "Grok Build request failed"
        : error.message
      : typeof errorRecord?.message === "string"
        ? errorRecord.message
        : errorRecord
          ? issueSafeJson(errorRecord)
          : String(error);
  const data = errorData(error);
  if (data === undefined) return message;
  if (typeof data === "string") return `${message}: ${data}`;
  return `${message}: ${issueSafeJson(data)}`;
}

function issueSafeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function looksMissing(error: unknown): boolean {
  const code = recordValue(errorData(error))?.code;
  if (code === "FS_NOT_FOUND") return true;
  return /not found|no such|unknown session|does not exist|failed to (read|load)/i.test(
    formatGrokBuildError(error),
  );
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, label: string): Promise<T> {
  return new Promise<T>((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => rejectPromise(new Error(`${label} timed out.`)), milliseconds);
    timer.unref?.();
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolvePromise(value);
      },
      (error) => {
        clearTimeout(timer);
        rejectPromise(error);
      },
    );
  });
}

function preferredAuthMethod(response: InitializeResponse): string | undefined {
  const methods = response.authMethods ?? [];
  const preferred = response._meta?.defaultAuthMethodId;
  if (typeof preferred === "string" && methods.some((method) => method.id === preferred)) {
    return preferred;
  }
  return methods[0]?.id;
}

/** A single long-lived Grok ACP process that can host multiple OpenUI sessions. */
class GrokBuildACPClient {
  readonly signature: string;

  private readonly activeThreads = new Set<string>();
  private readonly child;
  private readonly config: GrokBuildConfig;
  private readonly connection: ClientSideConnection;
  private readonly listeners = new Map<string, Set<UpdateListener>>();
  private readonly openingSessions = new Map<string, Promise<void>>();
  private readonly residentSessions = new Set<string>();
  private processError: Error | undefined;
  private stderrTail = "";

  private constructor(config: GrokBuildConfig) {
    this.config = config;
    this.signature = configSignature(config);

    const args = ["agent"];
    if (config.model) args.push("--model", config.model);
    if (config.reasoningEffort) args.push("--reasoning-effort", config.reasoningEffort);
    if (config.alwaysApprove) args.push("--always-approve");
    args.push("--no-leader", "stdio");

    this.child = spawn(config.bin, args, {
      cwd: config.cwd,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.child.on("error", (error) => {
      this.processError = error;
    });
    this.child.on("exit", () => this.cancelPendingInteractions());
    this.child.stderr?.setEncoding("utf8");
    this.child.stderr?.on("data", (chunk: string) => {
      this.stderrTail = `${this.stderrTail}${chunk}`.slice(-12_000);
    });

    if (!this.child.stdin || !this.child.stdout) {
      throw new Error("Grok Build did not expose ACP stdio streams.");
    }

    const stream = ndJsonStream(
      Writable.toWeb(this.child.stdin) as WritableStream<Uint8Array>,
      Readable.toWeb(this.child.stdout) as ReadableStream<Uint8Array>,
    );
    const client: Client = {
      requestPermission: (request) => this.requestPermission(request),
      sessionUpdate: (notification) => this.sessionUpdate(notification),
      extMethod: (method, params) => this.extensionRequest(method, params),
      extNotification: (method, params) => this.extensionNotification(method, params),
    };
    this.connection = new ClientSideConnection(() => client, stream);
  }

  static async create(config: GrokBuildConfig): Promise<GrokBuildACPClient> {
    const client = new GrokBuildACPClient(config);
    try {
      const initialized = await withTimeout(
        client.request("Grok Build ACP initialization", () =>
          client.connection.initialize({
            protocolVersion: PROTOCOL_VERSION,
            clientCapabilities: {
              fs: { readTextFile: false, writeTextFile: false },
              terminal: false,
            },
            clientInfo: {
              name: "OpenUI Grok Build Harness",
              version: "0.1.0",
            },
            _meta: {
              clientType: "openui-grok-build-harness",
              clientVersion: "0.1.0",
              startupHints: {
                nonInteractive: true,
                skipGitStatus: true,
                skipProjectLayout: true,
              },
            },
          }),
        ),
        30_000,
        "Grok Build ACP initialization",
      );

      const authMethod = preferredAuthMethod(initialized);
      if (authMethod) {
        await withTimeout(
          client.request("Grok Build authentication", () =>
            client.connection.authenticate({
              methodId: authMethod,
              _meta: { headless: true },
            }),
          ),
          30_000,
          "Grok Build authentication",
        );
      }
      return client;
    } catch (error) {
      client.dispose();
      const processDetail = client.processError ? ` ${client.processError.message}` : "";
      const stderr = client.stderrTail.trim();
      const stderrDetail = stderr ? `\n\nGrok stderr:\n${stderr}` : "";
      throw new Error(
        `Could not start Grok Build ACP.${processDetail} ${formatGrokBuildError(error)}${stderrDetail}\n\n` +
          "Install the `grok` CLI and run `grok login`, or set XAI_API_KEY.",
      );
    }
  }

  get alive(): boolean {
    return !this.connection.signal.aborted && this.child.exitCode === null;
  }

  isBusy(threadId: string): boolean {
    return this.activeThreads.has(threadId);
  }

  dispose(): void {
    this.cancelPendingInteractions();
    if (this.child.exitCode === null) this.child.kill("SIGTERM");
  }

  private cancelPendingInteractions(): void {
    const sessionIds = new Set([...this.residentSessions, ...this.openingSessions.keys()]);
    for (const sessionId of sessionIds) cancelGrokBuildInteractions(sessionId);
  }

  private connectionClosedError(label: string): Error {
    const cause = this.processError?.message
      ? `: ${this.processError.message}`
      : this.child.signalCode
        ? ` (signal ${this.child.signalCode})`
        : this.child.exitCode !== null
          ? ` (exit ${this.child.exitCode})`
          : "";
    const stderr = this.stderrTail.trim();
    return new Error(
      `${label} stopped because the Grok Build ACP process exited${cause}.` +
        (stderr ? `\n\nGrok stderr:\n${stderr}` : ""),
    );
  }

  /**
   * The ACP SDK currently leaves an in-flight request pending when its stdio
   * transport closes. Race every request against the connection signal so a
   * crashed CLI releases the route and its per-thread busy flag immediately.
   */
  private async request<T>(label: string, operation: () => Promise<T>): Promise<T> {
    const signal = this.connection.signal;
    if (signal.aborted || this.child.exitCode !== null) throw this.connectionClosedError(label);

    let onClose: (() => void) | undefined;
    const closed = new Promise<never>((_, reject) => {
      onClose = () => reject(this.connectionClosedError(label));
      signal.addEventListener("abort", onClose, { once: true });
    });

    try {
      return await Promise.race([operation(), closed]);
    } finally {
      if (onClose) signal.removeEventListener("abort", onClose);
    }
  }

  private async requestPermission(
    request: RequestPermissionRequest,
  ): Promise<RequestPermissionResponse> {
    if (this.config.alwaysApprove) {
      // Match Grok's own headless helper: grant only this invocation whenever
      // possible, falling back to a persistent grant only when it is the sole
      // affirmative option.
      const option =
        request.options.find((candidate) => candidate.kind === "allow_once") ??
        request.options.find((candidate) => candidate.kind === "allow_always");
      if (option) {
        return { outcome: { outcome: "selected", optionId: option.optionId } };
      }
    }
    return { outcome: { outcome: "cancelled" } };
  }

  private async extensionRequest(
    method: string,
    params: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    // These blocking reverse-requests are answered through the web harness's
    // interaction route. The browser polls while the main AG-UI stream remains
    // open, then its response resolves this ACP method and resumes the turn.
    const interaction = requestGrokBuildInteraction(method, params);
    if (interaction) return interaction;
    throw RequestError.methodNotFound(method);
  }

  private async extensionNotification(
    method: string,
    params: Record<string, unknown>,
  ): Promise<void> {
    const notification = decodeGrokSessionNotification(method, params);
    if (notification) this.notifyListeners(notification.sessionId, notification.update);
  }

  private notifyListeners(sessionId: string, update: GrokBuildSessionUpdate): void {
    const listeners = this.listeners.get(sessionId);
    if (!listeners) return;
    for (const listener of listeners) listener(update);
  }

  private async sessionUpdate(notification: SessionNotification): Promise<void> {
    this.notifyListeners(notification.sessionId, notification.update);
  }

  private subscribe(sessionId: string, listener: UpdateListener): () => void {
    const listeners = this.listeners.get(sessionId) ?? new Set<UpdateListener>();
    listeners.add(listener);
    this.listeners.set(sessionId, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.listeners.delete(sessionId);
    };
  }

  private async createSession(sessionId: string): Promise<void> {
    await this.request("Creating the Grok Build session", () =>
      this.connection.newSession({
        cwd: this.config.cwd,
        mcpServers: [],
        _meta: {
          clientIdentifier: "openui-grok-build-harness",
          rules: OPENUI_RULES,
          sessionId,
          yoloMode: this.config.alwaysApprove,
        },
      }),
    );
  }

  private async loadSession(sessionId: string): Promise<void> {
    await this.request("Loading the Grok Build session", () =>
      this.connection.loadSession({
        cwd: this.config.cwd,
        mcpServers: [],
        sessionId,
        _meta: { clientIdentifier: "openui-grok-build-harness" },
      }),
    );
  }

  private async ensureSession(sessionId: string, hasHistory: boolean): Promise<void> {
    if (!UUID_PATTERN.test(sessionId)) {
      throw new Error(`OpenUI thread id ${JSON.stringify(sessionId)} is not a valid UUID.`);
    }
    if (this.residentSessions.has(sessionId)) return;

    const existing = this.openingSessions.get(sessionId);
    if (existing) return existing;

    const opening = (async () => {
      // Grok's session/new accepts an existing on-disk UUID but starts it with
      // an empty chat history. Loading first is therefore essential even when
      // the browser has no assistant transcript (for example after a cancel or
      // crash); only Grok's explicit FS_NOT_FOUND response means it is safe to
      // create a fresh session and attach the OpenUI rules.
      try {
        await this.loadSession(sessionId);
      } catch (error) {
        if (!looksMissing(error)) throw error;
        if (hasHistory) {
          throw new Error(
            "This OpenUI thread has browser history, but its persisted Grok Build session " +
              `${sessionId} is missing. Start a new thread instead of continuing with lost context.`,
          );
        }
        await this.createSession(sessionId);
      }
      this.residentSessions.add(sessionId);
    })().finally(() => {
      this.openingSessions.delete(sessionId);
    });

    this.openingSessions.set(sessionId, opening);
    return opening;
  }

  async runTurn({
    hasHistory,
    onUpdate,
    prompt,
    sessionId,
    signal,
  }: {
    hasHistory: boolean;
    onUpdate: UpdateListener;
    prompt: string;
    sessionId: string;
    signal: AbortSignal;
  }): Promise<{ stopReason?: string }> {
    if (signal.aborted) throw new DOMException("The request was aborted.", "AbortError");
    let terminalError: string | undefined;
    const cancel = () => {
      cancelGrokBuildInteractions(sessionId);
      void this.request("Cancelling the Grok Build turn", () =>
        this.connection.cancel({ sessionId }),
      ).catch(() => undefined);
    };
    signal.addEventListener("abort", cancel, { once: true });
    let unsubscribe: (() => void) | undefined;
    let active = false;

    try {
      await this.ensureSession(sessionId, hasHistory);
      if (this.activeThreads.has(sessionId)) throw new GrokBuildBusyError();
      if (signal.aborted) throw new DOMException("The request was aborted.", "AbortError");

      this.activeThreads.add(sessionId);
      active = true;
      unsubscribe = this.subscribe(sessionId, (update) => {
        if (update.sessionUpdate === "retry_state" && update.type === "failed") {
          terminalError = update.message || update.reason || terminalError;
        } else if (update.sessionUpdate === "turn_completed" && update.stop_reason === "error") {
          terminalError = update.agent_result || terminalError;
        }
        onUpdate(update);
      });

      const response = await this.request("Running the Grok Build turn", () =>
        this.connection.prompt({
          sessionId,
          prompt: [{ type: "text", text: prompt }],
          _meta: {
            clientIdentifier: "openui-grok-build-harness",
            screenMode: "headless",
          },
        }),
      );
      const stopReason = response.stopReason ? String(response.stopReason) : undefined;
      if (terminalError || stopReason === "error") {
        throw new GrokBuildTurnError(
          terminalError ?? "Grok Build completed the turn with an error.",
        );
      }
      return { stopReason };
    } catch (error) {
      if (error instanceof GrokBuildTurnError || error instanceof GrokBuildBusyError) throw error;
      throw new GrokBuildTurnError(terminalError ?? formatGrokBuildError(error), error);
    } finally {
      signal.removeEventListener("abort", cancel);
      unsubscribe?.();
      if (active) this.activeThreads.delete(sessionId);
    }
  }
}

export class GrokBuildBusyError extends Error {
  constructor() {
    super("Grok Build is still responding to the previous message in this thread.");
    this.name = "GrokBuildBusyError";
  }
}

export class GrokBuildTurnError extends Error {
  constructor(message: string, options?: { cause?: unknown } | unknown) {
    const cause =
      options && typeof options === "object" && "cause" in options
        ? (options as { cause?: unknown }).cause
        : options;
    super(message, cause === undefined ? undefined : { cause });
    this.name = "GrokBuildTurnError";
  }
}

const globalStore = globalThis as unknown as {
  __openuiGrokBuildACP?: GrokBuildACPClient;
  __openuiGrokBuildACPStarting?: Promise<GrokBuildACPClient>;
};

async function getClient(): Promise<GrokBuildACPClient> {
  const config = readConfig();
  const signature = configSignature(config);
  const existing = globalStore.__openuiGrokBuildACP;
  if (existing && existing.alive && existing.signature === signature) return existing;
  if (existing) {
    existing.dispose();
    globalStore.__openuiGrokBuildACP = undefined;
  }

  if (!globalStore.__openuiGrokBuildACPStarting) {
    globalStore.__openuiGrokBuildACPStarting = GrokBuildACPClient.create(config)
      .then((client) => {
        globalStore.__openuiGrokBuildACP = client;
        return client;
      })
      .finally(() => {
        globalStore.__openuiGrokBuildACPStarting = undefined;
      });
  }
  return globalStore.__openuiGrokBuildACPStarting;
}

export function isGrokBuildThreadBusy(threadId: string): boolean {
  return globalStore.__openuiGrokBuildACP?.isBusy(threadId) ?? false;
}

export async function runGrokBuildTurn(options: {
  hasHistory: boolean;
  onUpdate: UpdateListener;
  prompt: string;
  sessionId: string;
  signal: AbortSignal;
}): Promise<{ stopReason?: string }> {
  const client = await getClient();
  return client.runTurn(options);
}
