export const OPENUI_GITHUB_REPOSITORY = "thesysdev/openui";
export const GITHUB_STAR_FALLBACK = 9860;

export type GitHubStarsResponse = {
  stars: number;
  source: "github" | "fallback";
};

export function readGitHubStarCount(value: unknown): number | null {
  if (typeof value !== "object" || value === null || !("stargazers_count" in value)) return null;

  const count = value.stargazers_count;
  return typeof count === "number" && Number.isFinite(count) && count >= 0 ? count : null;
}
