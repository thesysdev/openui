import { MessageSchema, type Message } from "@ag-ui/core";

import { createId } from "./id";
import { toLangflowInput } from "./input";
import {
  LangflowRequestError,
  streamLangflowWorkflow,
  type LangflowWorkflowOverrides,
} from "./workflow";

export interface PrepareLangflowInputContext {
  /** Validated OpenUI/AG-UI messages from the incoming request. */
  messages: Message[];
  /** The default input derived from the newest user message and action context. */
  inputValue: string;
  /** The complete incoming JSON body, including fields such as `threadId`. */
  requestBody: Record<string, unknown>;
  /** The OpenUI thread id that will be used as Langflow's session id. */
  sessionId: string;
}

export interface PrepareLangflowSessionContext {
  /** The OpenUI thread id from the request, or a generated id when it was omitted. */
  threadId: string;
  /** The complete incoming JSON body. Treat its fields as untrusted client input. */
  requestBody: Record<string, unknown>;
}

export interface CreateLangflowStreamResponseOptions extends LangflowWorkflowOverrides {
  /** Langflow server root, for example `http://localhost:7860`. */
  apiUrl: string;
  /** Flow id sent to `POST /api/v2/workflows`. */
  flowId: string;
  /** Optional Langflow API key. Keep this value in the server route. */
  apiKey?: string;
  /** Additional upstream headers. */
  headers?: Record<string, string>;
  /** Scope or authorize the Langflow session id before the workflow call. */
  prepareSessionId?: (context: PrepareLangflowSessionContext) => string | Promise<string>;
  /** Customize the text sent to Langflow after OpenUI action/form normalization. */
  prepareInput?: (context: PrepareLangflowInputContext) => string | Promise<string>;
  /** Include a bounded upstream error excerpt in trusted development responses. */
  debug?: boolean;
  /** Override `fetch` for tests or a custom server runtime. */
  fetch?: typeof fetch;
}

/**
 * Converts an OpenUI Agent Interface request into a Langflow Workflow API v2
 * run and returns Langflow's native AG-UI Server-Sent Event stream.
 */
export async function createLangflowStreamResponse(
  request: Request,
  options: CreateLangflowStreamResponseOptions,
): Promise<Response> {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return badRequest("Expected a JSON request body containing a non-empty messages array");
  }

  const requestBody = asRecord(body);
  const messages = parseMessages(requestBody["messages"]);
  if (!messages) {
    return badRequest("Expected a JSON request body containing a non-empty messages array");
  }

  let inputValue: string;
  try {
    inputValue = toLangflowInput(messages);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Unable to prepare Langflow input");
  }

  const threadId = optionalNonEmptyString(requestBody["threadId"]) ?? createId();
  let sessionId = threadId;
  if (options.prepareSessionId) {
    try {
      sessionId = (await options.prepareSessionId({ threadId, requestBody })).trim();
      if (!sessionId) return badRequest("Prepared Langflow session id must not be empty");
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : "Unable to prepare Langflow session id",
      );
    }
  }

  if (options.prepareInput) {
    try {
      inputValue = await options.prepareInput({ messages, inputValue, requestBody, sessionId });
      if (!inputValue.trim()) return badRequest("Prepared Langflow input must not be empty");
    } catch (error) {
      return badRequest(
        error instanceof Error ? error.message : "Unable to prepare Langflow input",
      );
    }
  }

  try {
    return await streamLangflowWorkflow({
      apiUrl: options.apiUrl,
      flowId: options.flowId,
      inputValue,
      sessionId,
      apiKey: options.apiKey,
      headers: options.headers,
      signal: request.signal,
      debug: options.debug,
      fetch: options.fetch,
      tweaks: options.tweaks,
      data: options.data,
      files: options.files,
      startComponentId: options.startComponentId,
      stopComponentId: options.stopComponentId,
    });
  } catch (error) {
    if (request.signal.aborted) {
      return Response.json({ error: "Langflow workflow request was aborted" }, { status: 499 });
    }

    const message = error instanceof Error ? error.message : "Langflow workflow request failed";
    const detail = error instanceof LangflowRequestError ? error.detail : undefined;
    return Response.json({ error: message, ...(detail ? { detail } : {}) }, { status: 502 });
  }
}

function parseMessages(value: unknown): Message[] | undefined {
  const parsed = MessageSchema.array().safeParse(value);
  return parsed.success && parsed.data.length > 0 ? parsed.data : undefined;
}

function optionalNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}
