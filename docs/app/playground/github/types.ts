import type { McpToolSpec } from "@openuidev/lang-core";

// ── Transformed GitHub data interfaces ────────────────────────────────────

export interface GitHubProfile {
  login: string;
  name: string;
  bio: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface RepoRow {
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  size: number;
  open_issues: number;
  updated_at: string;
  html_url: string;
}

export interface LanguageRow {
  language: string;
  bytes: number;
  repos_count: number;
}

export interface EventRow {
  type: string;
  repo: string;
  date: string;
  count: number;
}

export interface CommitWeek {
  week: string;
  total: number;
}

export interface StarPoint {
  starred_at: string;
  cumulative: number;
}

export interface ContributorRow {
  login: string;
  avatar_url: string;
  total_commits: number;
}

export interface Bookmark {
  repo: string;
  note: string;
  tag: string;
  created_at: string;
}

// ── McpToolSpec definitions for system prompt ──────────────────────────────

export const GITHUB_TOOL_SPECS: McpToolSpec[] = [
  {
    name: "get_profile",
    description:
      "Get the connected GitHub user's profile — name, bio, avatar, follower/following counts, public repo count, join date",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        login: { type: "string" },
        name: { type: "string" },
        bio: { type: "string" },
        avatar_url: { type: "string" },
        public_repos: { type: "integer" },
        followers: { type: "integer" },
        following: { type: "integer" },
        created_at: { type: "string" },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_repos",
    description:
      "List the user's public repositories with stars, forks, language, size, open issues. Supports sorting and language filtering.",
    inputSchema: {
      type: "object",
      properties: {
        sort: {
          type: "string",
          enum: ["stars", "forks", "updated", "created"],
          description: "Sort field (default: stars)",
        },
        language: {
          type: "string",
          description:
            "Filter by programming language (e.g. 'TypeScript'). Omit or empty for all.",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              full_name: { type: "string" },
              description: { type: "string" },
              language: { type: "string" },
              stars: { type: "integer" },
              forks: { type: "integer" },
              size: { type: "integer" },
              open_issues: { type: "integer" },
              updated_at: { type: "string" },
              html_url: { type: "string" },
            },
          },
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_languages",
    description:
      "Get aggregated language breakdown across all repos — language name, bytes of code, number of repos using it. Sorted by bytes descending.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              language: { type: "string" },
              bytes: { type: "integer" },
              repos_count: { type: "integer" },
            },
          },
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_events",
    description:
      "Get the user's recent public events (pushes, PRs, issues, reviews, forks, stars) from the last 30 days. Returns event rows + summary counts.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              repo: { type: "string" },
              date: { type: "string" },
              count: { type: "integer" },
            },
          },
        },
        summary: {
          type: "object",
          properties: {
            total: { type: "integer" },
            push: { type: "integer" },
            pr: { type: "integer" },
            issues: { type: "integer" },
            reviews: { type: "integer" },
          },
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_commit_activity",
    description:
      "Get weekly commit counts for a specific repo over the past year (52 weeks).",
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description:
            'Repository name (just the name, not full path — e.g. "linux" not "torvalds/linux")',
        },
      },
      required: ["repo"],
    },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              week: { type: "string" },
              total: { type: "integer" },
            },
          },
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_star_history",
    description:
      "Get star history for a repo — who starred it and when, with cumulative count for charting.",
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository name (e.g. 'linux')",
        },
      },
      required: ["repo"],
    },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              starred_at: { type: "string" },
              cumulative: { type: "integer" },
            },
          },
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_contributors",
    description:
      "Get contributor stats for a repo — login, avatar, total commits.",
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository name (e.g. 'linux')",
        },
      },
      required: ["repo"],
    },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              login: { type: "string" },
              avatar_url: { type: "string" },
              total_commits: { type: "integer" },
            },
          },
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "save_bookmark",
    description:
      "Save a repository bookmark with a note and tag. Upserts — saving the same repo updates it.",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "Repository name to bookmark" },
        note: { type: "string", description: "User note about the repo" },
        tag: {
          type: "string",
          enum: ["important", "review", "learning", "favorite"],
          description: "Tag category",
        },
      },
      required: ["repo"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
      },
    },
    annotations: { readOnlyHint: false },
  },
  {
    name: "get_bookmarks",
    description: "Get all saved bookmarks for the current user.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              repo: { type: "string" },
              note: { type: "string" },
              tag: { type: "string" },
              created_at: { type: "string" },
            },
          },
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "delete_bookmark",
    description: "Delete a bookmark by repo name.",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "Repository name to remove" },
      },
      required: ["repo"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: true },
  },
];
