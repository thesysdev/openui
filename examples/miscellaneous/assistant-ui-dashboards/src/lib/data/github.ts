import { ToolExecutionError } from "@openuidev/server";
import { z } from "zod";
import { cached, fetchJson, int, notFound, perMonth, text } from "./fetch";
import { dataTool } from "./tool";

// GitHub's REST API. It works without a token at 60 requests an hour per IP; set GITHUB_TOKEN
// (any token, no scopes needed for public repositories) for 5,000.

const TTL = 5 * 60_000;

function headers(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  return {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    ...(token && { authorization: `Bearer ${token}` }),
  };
}

/** "vercel/next.js", or a github.com URL → "vercel/next.js". */
function repoOf(value: unknown): string {
  const raw = text(value, "vercel/next.js")
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "");
  const [owner, name] = raw.split("/");
  if (!owner || !name)
    throw new ToolExecutionError(
      `Name a repository as owner/name, not "${raw}"`,
      "invalid_arguments",
      400,
    );
  return `${owner}/${name}`;
}

async function github<T>(path: string, signal: AbortSignal) {
  try {
    return await fetchJson<T>(`https://api.github.com${path}`, {
      signal,
      headers: headers(),
      source: "GitHub",
    });
  } catch (error) {
    if (error instanceof ToolExecutionError && error.code === "rate_limited")
      throw new ToolExecutionError(
        "GitHub's rate limit for this server is used up. Set GITHUB_TOKEN to raise it, or try again later.",
        "rate_limited",
        429,
      );
    throw error;
  }
}

type Repo = {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count?: number;
  language: string | null;
  license: { spdx_id?: string } | null;
  topics?: string[];
  created_at: string;
  pushed_at: string;
  archived: boolean;
  default_branch: string;
};

type Release = {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  prerelease: boolean;
  draft: boolean;
};

export const githubTools = {
  get_github_repo: dataTool(
    "A GitHub repository's stars, forks, open issues (GitHub counts open pull requests in these too), watchers, main language, license, topics, creation date, and last push.",
    z.object({ repo: z.string().describe('owner/name, such as "vercel/next.js"') }),
    {
      full_name: "vercel/next.js",
      description: "The React Framework",
      url: "https://github.com/vercel/next.js",
      stars: 139_200,
      forks: 30_400,
      open_issues: 3_150,
      watchers: 1_480,
      language: "JavaScript",
      license: "MIT",
      topics: ["react", "nextjs"],
      created_at: "2016-10-05T23:32:51Z",
      pushed_at: "2026-10-29T18:11:02Z",
      archived: false,
    },
    async (args, signal) => {
      const repo = repoOf(args.repo);
      return cached(`gh:repo:${repo}`, TTL, async () => {
        const { data } = await github<Repo>(`/repos/${repo}`, signal);
        if (!data) notFound(`There's no public GitHub repository ${repo}`);
        return {
          full_name: data.full_name,
          description: data.description ?? "",
          url: data.html_url,
          stars: data.stargazers_count,
          forks: data.forks_count,
          open_issues: data.open_issues_count,
          watchers: data.subscribers_count ?? 0,
          language: data.language ?? "",
          license: data.license?.spdx_id ?? "None",
          topics: data.topics ?? [],
          created_at: data.created_at,
          pushed_at: data.pushed_at,
          archived: data.archived,
        };
      });
    },
  ),
  get_github_commit_activity: dataTool(
    "Commits to a GitHub repository's default branch per complete week, oldest first, for up to the last 52 weeks: week start dates, commits per week (aligned with weeks), the total, and the weekly average.",
    z.object({
      repo: z.string().describe("owner/name"),
      weeks: z.number().int().min(4).max(52).default(26).describe("How many weeks back, 4 to 52"),
    }),
    {
      repo: "vercel/next.js",
      weeks: ["2026-10-11", "2026-10-18", "2026-10-25"],
      commits: [182, 164, 201],
      total: 547,
      average: 182,
    },
    async (args, signal) => {
      const repo = repoOf(args.repo);
      const weeks = int(args.weeks, 26, 4, 52);
      const all = await cached(`gh:commits:${repo}`, TTL, async () => {
        // GitHub computes these stats on first request and answers 202 meanwhile: ask again.
        for (let attempt = 0; attempt < 4; attempt++) {
          const { status, data } = await github<{ week: number; total: number }[]>(
            `/repos/${repo}/stats/commit_activity`,
            signal,
          );
          if (status === 404 || (status === 200 && !data))
            notFound(`There's no public GitHub repository ${repo}`);
          if (status === 200 && Array.isArray(data)) return data;
          await new Promise((resolve) => setTimeout(resolve, 1_500));
        }
        throw new ToolExecutionError(
          "GitHub is still computing this repository's commit activity. Try again in a minute.",
          "not_ready",
          503,
        );
      });
      // Leave out the week in progress, so it doesn't read as a drop.
      const done = all.filter((week) => (week.week + 7 * 86_400) * 1000 <= Date.now());
      const recent = done.slice(-weeks);
      const commits = recent.map((week) => week.total);
      const total = commits.reduce((sum, value) => sum + value, 0);
      return {
        repo,
        weeks: recent.map((week) => new Date(week.week * 1000).toISOString().slice(0, 10)),
        commits,
        total,
        average: commits.length ? Math.round(total / commits.length) : 0,
      };
    },
  ),
  get_github_releases: dataTool(
    "A GitHub repository's latest published releases (newest first: tag, name, date, prerelease), and releases per month over the last 12 months (counted from its latest 100 releases, so for very active repositories it covers fewer months; get_npm_package has a full year of stable releases).",
    z.object({
      repo: z.string().describe("owner/name"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(30)
        .default(10)
        .describe("How many releases to list, up to 30"),
    }),
    {
      repo: "vercel/next.js",
      releases: [
        { tag: "v16.2.6", name: "v16.2.6", published: "2026-10-28T19:05:40Z", prerelease: false },
        {
          tag: "v16.3.0-canary.12",
          name: "v16.3.0-canary.12",
          published: "2026-10-27T23:21:10Z",
          prerelease: true,
        },
      ],
      per_month: [
        { month: "2026-09", count: 31 },
        { month: "2026-10", count: 28 },
      ],
    },
    async (args, signal) => {
      const repo = repoOf(args.repo);
      const limit = int(args.limit, 10, 1, 30);
      const releases = await cached(`gh:releases:${repo}`, TTL, async () => {
        const { data } = await github<Release[]>(`/repos/${repo}/releases?per_page=100`, signal);
        if (!data) notFound(`There's no public GitHub repository ${repo}`);
        return data
          .filter((release) => !release.draft && release.published_at)
          .map((release) => ({
            tag: release.tag_name,
            name: release.name || release.tag_name,
            published: release.published_at!,
            prerelease: release.prerelease,
          }));
      });
      return {
        repo,
        releases: releases.slice(0, limit),
        per_month: perMonth(
          releases.map((release) => release.published),
          12,
        ),
      };
    },
  ),
};
