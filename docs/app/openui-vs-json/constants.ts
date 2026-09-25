export type Theme = "system" | "light" | "dark";
export type Status = "idle" | "streaming" | "done" | "error";

export const MODELS = [
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-haiku-4.5",
  "openai/gpt-5.2",
] as const;
export type Model = (typeof MODELS)[number];

export const STARTER_PROMPTS = [
  "Weather dashboard",
  "Pricing cards",
  "Kanban board",
  "Login form",
  "Data table",
];
