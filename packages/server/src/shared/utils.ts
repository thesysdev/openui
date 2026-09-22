import type { ParseResult } from "@openuidev/lang-core";
import type { AutofixDiagnostic, BaseAutofixInput, AutofixResult } from "./types";
import { AutofixError } from "./types";

// Collect parser errors, missing references, and incomplete output into diagnostics.
export function errorsOf({ root, meta }: ParseResult): AutofixDiagnostic[] {
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

// Check whether a value is a non-null object rather than an array.
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Check API diagnostics and extract their supported fields.
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

// Read the API response into the package's result shape without reparsing the program.
export function readCompletion(body: unknown): Omit<AutofixResult, "original"> {
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

/** Keep recent text context within the endpoint's limit of 20 messages and 8,000 characters. */
export function repairContext(messages: NonNullable<BaseAutofixInput["messages"]>) {
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

const OPENUI_FENCE = /```openui(?:-lang)?\s*\n/;
const ROOT_ASSIGN = /(^|\n)\s*root\s*=/;

/** OpenUI Lang is a fenced ```openui / ```openui-lang block, or an unfenced `root =` program. */
export function isUIOutput(text: string): boolean {
  return text.search(OPENUI_FENCE) >= 0 || ROOT_ASSIGN.test(text);
}

/** Split a closed ```openui-lang block from its closing fence and any trailing text. */
export function splitClosedFence(text: string): { body: string; closing: string } | null {
  const open = text.search(OPENUI_FENCE);
  if (open < 0) return null;
  const afterOpenNl = text.indexOf("\n", open);
  if (afterOpenNl < 0) return null;
  const close = text.indexOf("```", afterOpenNl + 1);
  if (close < 0) return null;
  return { body: text.slice(0, close), closing: text.slice(close) };
}

/** Inner OpenUI program, without a wrapping markdown fence. */
export function unwrapOpenUIFence(text: string): string {
  const open = text.search(OPENUI_FENCE);
  if (open < 0) return text;
  const start = text.indexOf("\n", open) + 1;
  const close = text.indexOf("```", start);
  return (close < 0 ? text.slice(start) : text.slice(start, close)).trim();
}
