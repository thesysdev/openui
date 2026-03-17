import type { Schema } from "@openuidev/lang/structured-outputs";

export function buildLangSystemPrompt(schema: Schema): string {
  return schema.prompt({
    preamble:
      "You are a data extraction assistant. Extract structured data from the provided document text using the format below.\nPreserve the exact casing of names as they appear in the source document.",
  });
}

export function parseLangOutput(
  output: string,
  schema: Schema,
): {
  original: string;
  parsed: unknown | null;
  error: string | null;
  validationErrors: string[];
} {
  // Strip markdown code fences if model wraps output in them
  const stripped = output.trim().replace(/^```(?:\w*)\s*\n?/, "").replace(/\n?```\s*$/, "");
  const result = schema.parse(stripped);
  if (!result.root) {
    return {
      original: output,
      parsed: null,
      error: "No root assignment found",
      validationErrors: [],
    };
  }
  const validationErrors = result.meta.validationErrors.map(
    (e) => `${e.type}${e.path}: ${e.message}`,
  );
  return {
    original: output,
    parsed: result.root,
    error: validationErrors.length > 0 ? "Validation errors" : null,
    validationErrors,
  };
}
