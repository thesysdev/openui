export type Theme = "system" | "light" | "dark";
export type Status = "idle" | "streaming" | "done" | "error";

export const MODELS = [
  "openai/gpt-5.4-mini",
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-haiku-4.5",
] as const;
export type Model = (typeof MODELS)[number];

export const STARTER_PROMPTS = [
  "Weather dashboard",
  "Pricing cards",
  "Kanban board",
  "Login form",
  "Data table",
];

export const GITHUB_STARTERS = [
  {
    label: "Profile Dashboard",
    prompt:
      "Build a profile dashboard with KPIs, language breakdown chart, and top repos table with sorting and language filter",
    icon: "📊",
  },
  {
    label: "Coding Patterns",
    prompt:
      "Analyze my coding patterns — show activity breakdown, language distribution, and a recent events timeline",
    icon: "🔥",
  },
  {
    label: "Star History",
    prompt: "Show star history charts for my most popular repos with a comparison view",
    icon: "⭐",
  },
  {
    label: "Repo Organizer",
    prompt:
      "Build a repo organizer with bookmarks, tags, search, and language filter. Include a bookmark form in a modal.",
    icon: "🗂️",
  },
  {
    label: "Open Source Impact",
    prompt:
      "Show my open source impact — follower stats, total stars, top repos by forks, language expertise breakdown, and community reach",
    icon: "🌍",
  },
];

// ── Chat message types (shared between page + ConversationPanel) ──────────

export type ToolCallEntry = {
  tool: string;
  status: "pending" | "done" | "error";
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  text?: string;
  hasCode: boolean;
  runtimeTools?: ToolCallEntry[];
}
