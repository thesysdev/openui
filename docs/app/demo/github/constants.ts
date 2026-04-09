export type Theme = "system" | "light" | "dark";
export type Status = "idle" | "streaming" | "done" | "error";

export const GITHUB_DEMO_MODEL = "anthropic/claude-sonnet-4-6";
export const GITHUB_DEMO_MODEL_LABEL = "Claude Sonnet 4.6";

export type GitHubStarterIconKey =
  | "commit-activity"
  | "pull-requests"
  | "issue-tracking"
  | "code-reviews"
  | "language-breakdown"
  | "repository-stats";

export type GitHubStarterTone = "green" | "purple" | "red" | "blue" | "amber" | "pink";

export type GitHubStarter = {
  label: string;
  prompt: string;
  icon: GitHubStarterIconKey;
  tone: GitHubStarterTone;
};

export const GITHUB_STARTERS: GitHubStarter[] = [
  {
    label: "Commit Activity",
    prompt:
      "Build a dashboard focused on commit activity, contribution streaks, busiest repositories, and recent work patterns over time.",
    icon: "commit-activity",
    tone: "green",
  },
  {
    label: "Pull Requests",
    prompt:
      "Create a pull request dashboard with open versus merged trends, review turnaround, and the repositories with the most PR activity.",
    icon: "pull-requests",
    tone: "purple",
  },
  {
    label: "Issue Tracking",
    prompt:
      "Show issue tracking insights with open versus closed trends, response speed, issue backlog, and the repos with the most active discussions.",
    icon: "issue-tracking",
    tone: "red",
  },
  {
    label: "Code Reviews",
    prompt:
      "Analyze code reviews by showing review volume, average turnaround, participation by repository, and recent review activity.",
    icon: "code-reviews",
    tone: "blue",
  },
  {
    label: "Language Breakdown",
    prompt:
      "Visualize language breakdown across repositories with usage share, top projects per language, and how the stack changes over time.",
    icon: "language-breakdown",
    tone: "amber",
  },
  {
    label: "Repository Stats",
    prompt:
      "Build a repository stats dashboard with stars, forks, watchers, top repositories, and overall portfolio health.",
    icon: "repository-stats",
    tone: "pink",
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
}
