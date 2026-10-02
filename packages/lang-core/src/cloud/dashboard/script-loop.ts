import {
  DashboardToolError,
  type DashboardArtifactRef,
  type DashboardRunResult,
  type DashboardScriptsOptions,
} from "./types";
import { isRecord, runFailure, runSuccess } from "./util";

const MAX_ROUNDS = 8;
const DEFAULT_SCRIPTS_BASE_URL = "https://api.thesys.dev";
const DEFAULT_ROUND_TIMEOUT_MS = 30_000;

interface ScriptToolCall {
  type?: string;
  call_id: string;
  name: string;
  arguments: string;
}

type ScriptToolResult =
  | { type: "function_call_output"; call_id: string; output: string }
  | { call_id: string; error: { code: string; message: string } };

interface ExecuteResponse {
  status?: "tool_calls" | "done" | "error";
  calls?: ScriptToolCall[];
  state?: string;
  result?: unknown;
  error?: { code?: string; message?: string };
}

const SCRIPT_ERROR_STATUS: Record<string, number> = {
  BAD_REQUEST: 400,
  SCRIPT_NOT_FOUND: 404,
  ARTIFACT_NOT_FOUND: 404,
  RATE_LIMITED: 429,
  RUNNER_BUSY: 503,
  SCRIPT_TIMEOUT: 504,
};

const scriptErrorStatus = (code: string): number => SCRIPT_ERROR_STATUS[code] ?? 502;

class ScriptTransportError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ScriptTransportError";
    this.code = code;
    this.status = status;
  }
}

interface ScriptLoopConfig {
  apiKey: string | undefined;
  baseUrl: string;
  timeoutMs: number;
  fetchImpl: typeof fetch;
}

export interface ScriptLoopRequest {
  artifact: DashboardArtifactRef;
  name: string;
  args: Record<string, unknown>;
  /** Executes a customer-owned tool and throws `DashboardToolError` on failure. */
  runLocalTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Client for the stateless dashboard sandbox protocol. It keeps the signed
 * snapshot opaque and returns every expected failure as a route-ready result.
 */
export class ScriptLoop {
  readonly enabled: boolean;
  private readonly config: ScriptLoopConfig;

  constructor(options: DashboardScriptsOptions | undefined) {
    const opts = options ?? {};
    const apiKey = opts.apiKey ?? process.env.THESYS_API_KEY;
    this.enabled = opts.enabled ?? (apiKey !== undefined && apiKey !== "");
    this.config = {
      apiKey,
      baseUrl: (opts.baseUrl ?? DEFAULT_SCRIPTS_BASE_URL).replace(/\/$/, ""),
      timeoutMs: opts.timeoutMs ?? DEFAULT_ROUND_TIMEOUT_MS,
      fetchImpl: opts.fetch ?? fetch,
    };
  }

  /** Runs one stored script to completion, bounded to eight tool-call rounds. */
  async run(request: ScriptLoopRequest): Promise<DashboardRunResult> {
    let toolResults: ScriptToolResult[] = [];
    let state: string | undefined;
    let restarted = false;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      let response: ExecuteResponse;
      try {
        response = await this.postRound({
          artifact_id: request.artifact.id,
          ...(request.artifact.version !== undefined && {
            artifact_version: request.artifact.version,
          }),
          name: request.name,
          arguments: request.args,
          tool_results: toolResults,
          ...(state !== undefined && { state }),
        });
      } catch (error) {
        if (error instanceof ScriptTransportError) {
          return runFailure(error.code, error.message, error.status);
        }
        throw error;
      }

      if (response.status === "done") return runSuccess(response.result);

      if (response.status === "error") {
        const code = response.error?.code ?? "SCRIPT_ERROR";
        const message = response.error?.message ?? "script execution failed";
        if (code === "SNAPSHOT_INVALID" && !restarted) {
          restarted = true;
          toolResults = [];
          state = undefined;
          round = -1;
          continue;
        }
        return runFailure(code, message, scriptErrorStatus(code));
      }

      if (response.status === "tool_calls" && Array.isArray(response.calls)) {
        state = response.state;
        toolResults = await Promise.all(
          response.calls.map(async (call): Promise<ScriptToolResult> => {
            if (!isRecord(call) || typeof call.call_id !== "string") {
              return {
                call_id: "",
                error: {
                  code: "BAD_ARGS",
                  message: "malformed tool_call entry from execute endpoint",
                },
              };
            }

            let args: Record<string, unknown>;
            try {
              const parsed: unknown = JSON.parse(
                typeof call.arguments === "string" && call.arguments !== "" ? call.arguments : "{}",
              );
              args = isRecord(parsed) ? parsed : {};
            } catch {
              return {
                call_id: call.call_id,
                error: {
                  code: "BAD_ARGS",
                  message: `${call.name}: arguments are not valid JSON`,
                },
              };
            }

            try {
              const result = await request.runLocalTool(call.name, args);
              return {
                type: "function_call_output",
                call_id: call.call_id,
                output: JSON.stringify(result ?? null),
              };
            } catch (error) {
              const code = error instanceof DashboardToolError ? error.code : "TOOL_EXEC_ERROR";
              const message = error instanceof Error ? error.message : String(error);
              return { call_id: call.call_id, error: { code, message } };
            }
          }),
        );
        continue;
      }

      return runFailure(
        "SCRIPT_ERROR",
        `unrecognized execute response (status ${JSON.stringify(response.status)})`,
        502,
      );
    }

    return runFailure(
      "SCRIPT_ERROR",
      `script "${request.name}" exceeded ${MAX_ROUNDS} tool-call rounds`,
      502,
    );
  }

  private async postRound(body: unknown): Promise<ExecuteResponse> {
    const { apiKey, baseUrl, timeoutMs, fetchImpl } = this.config;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}/v1/dashboards/execute`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(apiKey !== undefined && { authorization: `Bearer ${apiKey}` }),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          throw new ScriptTransportError(
            "SCRIPT_TIMEOUT",
            `script execute round timed out after ${timeoutMs}ms`,
            504,
          );
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new ScriptTransportError(
          "SCRIPT_ERROR",
          `script execute endpoint unreachable: ${message}`,
          502,
        );
      }
      return await this.readRound(response, controller.signal, timeoutMs);
    } finally {
      clearTimeout(timer);
    }
  }

  private async readRound(
    response: Response,
    signal: AbortSignal,
    timeoutMs: number,
  ): Promise<ExecuteResponse> {
    let body: ExecuteResponse;
    try {
      body = (await response.json()) as ExecuteResponse;
    } catch {
      if (signal.aborted) {
        throw new ScriptTransportError(
          "SCRIPT_TIMEOUT",
          `script execute round timed out after ${timeoutMs}ms (stalled response body)`,
          504,
        );
      }
      throw new ScriptTransportError(
        "SCRIPT_ERROR",
        `script execute endpoint returned non-JSON (HTTP ${response.status})`,
        502,
      );
    }

    if (
      !response.ok &&
      body.status === undefined &&
      isRecord((body as { error?: unknown }).error)
    ) {
      const upstream = (body as { error: { code?: unknown; message?: unknown } }).error;
      throw new ScriptTransportError(
        typeof upstream.code === "string" ? upstream.code : "SCRIPT_ERROR",
        typeof upstream.message === "string"
          ? upstream.message
          : `script execute failed (HTTP ${response.status})`,
        response.status,
      );
    }
    return body;
  }
}
