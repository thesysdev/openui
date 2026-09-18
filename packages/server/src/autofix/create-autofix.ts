import { createParser, generateSystemPrompt, type ParseResult } from "@openuidev/lang-core";
import { createAutofixStream } from "./stream";
import type {
  AutofixDiagnostic,
  AutofixInput,
  AutofixOptions,
  AutofixResult,
  AutofixStream,
  AutofixStreamInput,
} from "./types";
import { AutofixError, MAX_AUTOFIX_GENERATION_LENGTH } from "./types";

function errorsOf({ root, meta }: ParseResult): AutofixDiagnostic[] {
  return [
    ...meta.errors,
    ...meta.unresolved.map((name) => ({
      code: "unresolved",
      statementId: name,
      message: `Reference "${name}" is not defined`,
    })),
    ...meta.orphaned.map((name) => ({
      code: "orphaned",
      statementId: name,
      message: `Statement "${name}" is not reachable from root`,
    })),
    ...(meta.incomplete ? [{ code: "incomplete", message: "Generation ends mid-statement" }] : []),
    ...(root === null ? [{ code: "missing-root", message: "No root element" }] : []),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readDiagnostics(value: unknown): AutofixDiagnostic[] {
  if (!Array.isArray(value))
    throw new AutofixError("Malformed Autofix diagnostics", "invalid_response");
  return value.map((entry: unknown) => {
    if (
      !isRecord(entry) ||
      typeof entry["code"] !== "string" ||
      typeof entry["message"] !== "string"
    ) {
      throw new AutofixError("Malformed Autofix diagnostic", "invalid_response");
    }
    return {
      code: entry["code"],
      message: entry["message"],
      ...(typeof entry["component"] === "string" && { component: entry["component"] }),
      ...(typeof entry["path"] === "string" && { path: entry["path"] }),
      ...(typeof entry["statementId"] === "string" && { statementId: entry["statementId"] }),
    };
  });
}

function readCompletion(body: unknown): Omit<AutofixResult, "original"> {
  if (!isRecord(body) || !isRecord(body["fix_summary"])) {
    throw new AutofixError("Missing Autofix summary", "invalid_response");
  }
  const summary = body["fix_summary"];
  const status = summary["status"];
  if (status !== "fixed" && status !== "already_valid" && status !== "fix_failed") {
    throw new AutofixError("Unknown Autofix status", "invalid_response");
  }
  const choices = body["choices"];
  const choice: unknown = Array.isArray(choices) ? choices[0] : undefined;
  const message = isRecord(choice) ? choice["message"] : undefined;
  const content = isRecord(message) ? message["content"] : undefined;
  if (
    (status === "fix_failed" && content !== null) ||
    (status !== "fix_failed" && typeof content !== "string")
  ) {
    throw new AutofixError("Malformed Autofix content", "invalid_response");
  }
  return {
    status,
    content: content as string | null,
    fixedErrors: readDiagnostics(summary["fixed_errors"]),
    unfixedErrors: readDiagnostics(summary["unfixed_errors"]),
  };
}

/** Text-only repair context, bounded to the endpoint's most recent 20 turns / 8,000 characters. */
function repairContext(messages: NonNullable<AutofixInput["messages"]>) {
  const context: { role: "user" | "assistant" | "system" | "developer"; content: string }[] = [];
  let remaining = 8_000;
  for (let i = messages.length - 1; i >= 0 && context.length < 20 && remaining > 0; i--) {
    const message = messages[i]!;
    if (!["user", "assistant", "system", "developer"].includes(message.role)) continue;
    const text =
      typeof message.content === "string"
        ? message.content
        : (message.content ?? []).map((part) => (part.type === "text" ? part.text : "")).join("\n");
    if (!text) continue;
    const content = text.slice(-remaining);
    context.unshift({ role: message.role as (typeof context)[number]["role"], content });
    remaining -= content.length;
  }
  return context;
}

/** Validate locally and repair via Gateway only when needed. Does not own model generation. */
export function createAutofix(options: AutofixOptions): {
  fix(input: AutofixInput & { generation: string }): Promise<AutofixResult>;
  stream(input: AutofixStreamInput): AutofixStream;
} {
  const { library } = options;
  if (!library?.schema)
    throw new AutofixError("A library spec with schema is required", "invalid_library");
  const parser = createParser(library.schema, library.root);
  const endpoint = `${(options.apiBaseUrl ?? "https://api.thesys.dev").replace(/\/+$/, "")}/v1/autofix`;
  const fetchFn = options.fetch ?? globalThis.fetch;

  async function fix({
    generation,
    messages = [],
    signal,
  }: AutofixInput & { generation: string }): Promise<AutofixResult> {
    signal?.throwIfAborted();
    if (generation.length > MAX_AUTOFIX_GENERATION_LENGTH) {
      throw new AutofixError("Generation exceeds 100,000 characters", "generation_too_large");
    }
    const initialErrors = errorsOf(parser.parse(generation));
    if (initialErrors.length === 0) {
      return {
        status: "already_valid",
        original: generation,
        content: generation,
        fixedErrors: [],
        unfixedErrors: [],
      };
    }

    const response = await fetchFn(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${options.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: generateSystemPrompt({ cloud: true, library }) },
          ...repairContext(messages),
          { role: "assistant", content: generation },
        ],
      }),
      signal,
    });
    signal?.throwIfAborted();
    if (!response.ok) {
      throw new AutofixError(
        `Autofix request failed: HTTP ${response.status}`,
        "http_error",
        response.status,
      );
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      signal?.throwIfAborted();
      throw new AutofixError(
        `Could not read Autofix response: ${String(error)}`,
        "invalid_response",
      );
    }
    signal?.throwIfAborted();
    const completion = readCompletion(body);
    if (completion.status === "fix_failed") {
      return { ...completion, status: "fix_failed", content: null, original: generation };
    }
    return {
      ...completion,
      status: completion.status,
      original: generation,
      content: completion.content!,
    };
  }

  return { fix, stream: (input) => createAutofixStream(input, fix) };
}
