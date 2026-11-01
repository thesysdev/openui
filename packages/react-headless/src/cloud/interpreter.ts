/**
 * The interpreter runs an artifact's data tools on the developer's server.
 * This module bridges `Query()`/`Mutation()` calls from the renderer to it.
 */

/** What the renderer sends your interpreter for each data tool call. @category Types */
export interface InterpreterRequest {
  /** The artifact's id. */
  id: string;
  /** The query or tool to run. */
  name: string;
  arguments: Record<string, unknown>;
  /** The artifact's saved content, when you keep artifacts in your own storage. */
  response?: string;
}

/** Your interpreter endpoint: it receives an `InterpreterRequest` as JSON and returns `{ result }`. @category Types */
export interface InterpreterConfig {
  url: string;
  /** Headers to send with each request, such as an auth header. */
  headers?: HeadersInit;
}

/** An async function that runs the request, such as a server action. @category Types */
export type InterpreterFunction = (request: InterpreterRequest) => Promise<unknown>;

/** Where an artifact's data tools run. @category Types */
export type Interpreter = InterpreterConfig | InterpreterFunction;

/** The shape react-lang's `Renderer` accepts as an MCP-style `toolProvider`. */
export interface InterpreterToolProvider {
  callTool(params: { name: string; arguments?: Record<string, unknown> }): Promise<{
    content: Array<{ type: string; text?: string }>;
    structuredContent?: unknown;
  }>;
}

/** @category Types */
export interface InterpreterToolProviderOptions {
  /** Read on every call, so the provider's identity can stay stable. */
  getInterpreter: () => Interpreter | undefined;
  /** The artifact the calls are for. */
  getRequest: () => { id: string | null | undefined; response?: string };
  /** Defaults to the global `fetch`. */
  fetch?: typeof fetch;
  /** Called when a call starts. */
  onStart?: (toolName: string) => void;
  /** Called when a call settles; `message` is `null` on success. */
  onSettle?: (toolName: string, message: string | null) => void;
}

function errorMessage(error: unknown): string | undefined {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const { message } = error as { message: unknown };
    if (typeof message === "string") return message;
  }
  return undefined;
}

async function callEndpoint(
  fetchImpl: typeof fetch,
  config: InterpreterConfig,
  request: InterpreterRequest,
): Promise<unknown> {
  const headers = new Headers(config.headers);
  headers.set("Content-Type", "application/json");
  const res = await fetchImpl(config.url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });
  let body: { result?: unknown; error?: unknown } | null = null;
  try {
    body = (await res.json()) as { result?: unknown; error?: unknown };
  } catch {
    body = null;
  }
  if (!res.ok || (body?.error !== undefined && body.error !== null)) {
    throw new Error(errorMessage(body?.error) ?? `Interpreter request failed: ${res.status}`);
  }
  return body?.result;
}

/**
 * A `toolProvider` for react-lang's `Renderer` that sends an artifact's data
 * tool calls to your interpreter, endpoint or function. Results come back as
 * `structuredContent`, so `Renderer` unwraps them the usual way.
 *
 * @category Functions
 */
export function createInterpreterToolProvider(
  options: InterpreterToolProviderOptions,
): InterpreterToolProvider {
  return {
    async callTool({ name, arguments: args = {} }) {
      const interpreter = options.getInterpreter();
      const { id, response } = options.getRequest();
      if (!interpreter) throw new Error("This artifact has no interpreter.");
      if (!id) throw new Error("This artifact has no id yet.");

      const request: InterpreterRequest = {
        id,
        name,
        arguments: args,
        ...(response !== undefined ? { response } : {}),
      };
      options.onStart?.(name);
      try {
        const result =
          typeof interpreter === "function"
            ? await interpreter(request)
            : await callEndpoint(
                options.fetch ?? globalThis.fetch.bind(globalThis),
                interpreter,
                request,
              );
        options.onSettle?.(name, null);
        return { content: [], structuredContent: result ?? null };
      } catch (error) {
        options.onSettle?.(name, errorMessage(error) ?? "The data tool failed.");
        throw error;
      }
    },
  };
}
