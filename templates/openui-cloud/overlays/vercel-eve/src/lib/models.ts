export const DEFAULT_MODEL = "google/gemini-3.6-flash-free";

/** Model ids the Cloud Eve agent accepts via `OPENUI_MODEL`. */
export const MODEL_IDS = [
  "anthropic/claude-sonnet-5",
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-opus-4-7",
  "openai/gpt-5.5",
  "openai/gpt-5.4",
  "openai/gpt-5.4-mini",
  "openai/gpt-5.2",
  "openai/gpt-5.1",
  "openai/gpt-5",
  "google/gemini-3.6-flash",
  "google/gemini-3.5-flash",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3.1-pro-free",
  "google/gemini-3.1-flash-lite-free",
  "google/gemini-3.6-flash-free",
  "google/gemini-3.5-flash-free",
] as const;

const MODEL_ID_SET = new Set<string>(MODEL_IDS);

export function resolveOpenuiModel(model: string | undefined): string {
  const resolved = model?.trim() || DEFAULT_MODEL;
  if (!MODEL_ID_SET.has(resolved)) {
    throw new Error(
      `Unknown OPENUI_MODEL "${resolved}". Use a Cloud model id such as ${DEFAULT_MODEL}.`,
    );
  }
  return resolved;
}
