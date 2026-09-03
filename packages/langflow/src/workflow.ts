export interface LangflowWorkflowOverrides {
  /** Per-component parameter overrides keyed by Langflow component id. */
  tweaks?: Record<string, unknown>;
  /** Optional live-canvas flow definition override. */
  data?: Record<string, unknown>;
  /** Paths of files already uploaded to Langflow. */
  files?: string[];
  /** Start a partial run at this component. */
  startComponentId?: string;
  /** Stop a partial run at this component. */
  stopComponentId?: string;
}

export interface StreamLangflowWorkflowOptions extends LangflowWorkflowOverrides {
  /** Langflow server root, for example `http://localhost:7860`. */
  apiUrl: string;
  /** Flow id sent to `POST /api/v2/workflows`. */
  flowId: string;
  /** Text sent as the workflow's `input_value`. */
  inputValue: string;
  /** Langflow session id. Reuse it to preserve conversation memory. */
  sessionId: string;
  /** Optional Langflow API key, sent only as the server-side `x-api-key` header. */
  apiKey?: string;
  /** Additional upstream headers. Core content and authentication headers take precedence. */
  headers?: Record<string, string>;
  /** Aborts the upstream workflow request. */
  signal?: AbortSignal;
  /** Include a bounded upstream response excerpt in thrown errors. Defaults to `false`. */
  debug?: boolean;
  /** Override `fetch` for tests or a custom server runtime. */
  fetch?: typeof fetch;
}

export class LangflowRequestError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(status: number, detail?: string) {
    super(`Langflow workflow request failed with HTTP ${status}`);
    this.name = "LangflowRequestError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Starts a streaming Workflow API v2 run using Langflow's native AG-UI protocol.
 * The returned response can be passed directly to OpenUI's `agUIAdapter()`.
 */
export async function streamLangflowWorkflow({
  apiUrl,
  flowId,
  inputValue,
  sessionId,
  apiKey,
  headers: extraHeaders,
  signal,
  debug = false,
  fetch: customFetch,
  tweaks,
  data,
  files,
  startComponentId,
  stopComponentId,
}: StreamLangflowWorkflowOptions): Promise<Response> {
  const baseUrl = requiredValue(apiUrl, "apiUrl").replace(/\/+$/, "");
  const normalizedFlowId = requiredValue(flowId, "flowId");
  const normalizedInput = requiredValue(inputValue, "inputValue");
  const normalizedSessionId = requiredValue(sessionId, "sessionId");
  const fetchImpl = customFetch ?? globalThis.fetch.bind(globalThis);

  const headers = new Headers(extraHeaders);
  headers.set("Accept", "text/event-stream");
  headers.set("Content-Type", "application/json");
  if (apiKey?.trim()) headers.set("x-api-key", apiKey.trim());

  const body = {
    flow_id: normalizedFlowId,
    input_value: normalizedInput,
    session_id: normalizedSessionId,
    mode: "stream",
    stream_protocol: "agui",
    ...(tweaks ? { tweaks } : {}),
    ...(data ? { data } : {}),
    ...(files ? { files } : {}),
    ...(startComponentId ? { start_component_id: startComponentId } : {}),
    ...(stopComponentId ? { stop_component_id: stopComponentId } : {}),
  };

  const upstream = await fetchImpl(`${baseUrl}/api/v2/workflows`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
    signal,
  });

  if (!upstream.ok) {
    const detail = debug ? await responseExcerpt(upstream) : undefined;
    throw new LangflowRequestError(upstream.status, detail);
  }
  if (!upstream.body) {
    throw new Error("Langflow returned an empty workflow stream");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function requiredValue(value: string, name: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`Langflow ${name} must not be empty`);
  return normalized;
}

async function responseExcerpt(response: Response): Promise<string | undefined> {
  try {
    const text = (await response.text()).trim();
    return text ? text.slice(0, 2_000) : undefined;
  } catch {
    return undefined;
  }
}
