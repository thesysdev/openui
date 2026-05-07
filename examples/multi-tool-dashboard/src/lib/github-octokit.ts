/**
 * GitHub API bridge via Octokit — direct REST calls with PAT auth.
 *
 * Modeled after docs/app/demo/github/github/tools.ts but adapted for
 * server-side use with PAT authentication (supports private repos).
 *
 * Requires: GITHUB_PERSONAL_ACCESS_TOKEN env var.
 * Gracefully returns { error: "..." } when missing.
 */
import { Octokit } from "octokit";

// ── Cache ──────────────────────────────────────────────────────────────────

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && now - entry.ts < CACHE_TTL) return Promise.resolve(entry.data as T);

  if (cache.size > 50) {
    for (const [k, v] of cache) {
      if (now - v.ts >= CACHE_TTL) cache.delete(k);
    }
  }

  return fn().then((data) => {
    cache.set(key, { data, ts: now });
    return data;
  });
}

// ── Rate limit tracking ────────────────────────────────────────────────────

let rateLimitRemaining = 5000; // PAT gets 5000/hr vs 60 unauthenticated
let rateLimitReset = 0;

function checkRateLimit(): string | null {
  if (rateLimitRemaining <= 0 && Date.now() / 1000 < rateLimitReset) {
    const mins = Math.ceil((rateLimitReset - Date.now() / 1000) / 60);
    return `GitHub API rate limit exceeded. Try again in ${mins} minute${mins > 1 ? "s" : ""}.`;
  }
  return null;
}

function updateRateLimit(response: { headers?: Record<string, string> }) {
  const h = response?.headers;
  if (!h) return;
  const remaining = h["x-ratelimit-remaining"];
  const reset = h["x-ratelimit-reset"];
  if (remaining != null) {
    const n = parseInt(String(remaining), 10);
    if (!isNaN(n)) rateLimitRemaining = n;
  }
  if (reset != null) {
    const n = parseInt(String(reset), 10);
    if (!isNaN(n)) rateLimitReset = n;
  }
}

// ── Retry for 202 (computing stats) ────────────────────────────────────────

async function fetchWithRetry(
  octokit: Octokit,
  route: string,
  params: Record<string, unknown>,
  retries = 3,
): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    const res = await octokit.request(route, params);
    updateRateLimit(res as { headers?: Record<string, string> });
    if (res.status !== 202) return res.data;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { error: "GitHub is still computing stats. Try again in a moment." };
}

// ── Octokit singleton ──────────────────────────────────────────────────────

function getOctokit(): Octokit | null {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) return null;
  return new Octokit({ auth: token });
}

function getOrg(): string | undefined {
  return process.env.GITHUB_ORG || undefined;
}

let _usernameCache: string | null = null;
async function getAuthenticatedUsername(octokit: Octokit): Promise<string> {
  if (_usernameCache) return _usernameCache;
  const res = await octokit.rest.users.getAuthenticated();
  updateRateLimit(res as { headers?: Record<string, string> });
  _usernameCache = res.data.login;
  return _usernameCache;
}

// ── Exported tool functions ────────────────────────────────────────────────

export interface RepoRow {
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  open_issues: number;
  updated_at: string;
  is_private: boolean;
}

export async function getMyRepos(perPage = 10): Promise<{ repos: RepoRow[]; error?: string }> {
  const octokit = getOctokit();
  if (!octokit) return { repos: [], error: "Set GITHUB_PERSONAL_ACCESS_TOKEN env var" };
  const org = getOrg();

  return cached(`repos:${org ?? "user"}:${perPage}`, async () => {
    const limitErr = checkRateLimit();
    if (limitErr) return { repos: [], error: limitErr };

    try {
      let res;
      if (org) {
        try {
          res = await octokit.rest.repos.listForOrg({ org, sort: "pushed", per_page: Math.min(perPage, 100) });
        } catch {
          console.warn(`[github] Org repos failed for "${org}", falling back to user repos`);
          res = await octokit.rest.repos.listForAuthenticatedUser({ sort: "pushed", per_page: Math.min(perPage, 100) });
        }
      } else {
        res = await octokit.rest.repos.listForAuthenticatedUser({ sort: "pushed", per_page: Math.min(perPage, 100) });
      }
      updateRateLimit(res as { headers?: Record<string, string> });

      const repos: RepoRow[] = res.data.map((r) => ({
        name: r.name,
        full_name: r.full_name,
        description: r.description ?? "",
        language: r.language ?? "",
        stars: r.stargazers_count ?? 0,
        forks: r.forks_count ?? 0,
        open_issues: r.open_issues_count ?? 0,
        updated_at: r.pushed_at?.slice(0, 10) ?? "",
        is_private: r.private,
      }));
      return { repos };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { repos: [], error: msg };
    }
  });
}

export interface ActivityRow {
  type: string;
  repo: string;
  date: string;
}

export interface ActivitySummary {
  total: number;
  push: number;
  pr: number;
  issues: number;
  reviews: number;
}

export async function getRecentActivity(): Promise<{
  rows: ActivityRow[];
  summary: ActivitySummary;
  error?: string;
}> {
  const octokit = getOctokit();
  const empty = { rows: [] as ActivityRow[], summary: { total: 0, push: 0, pr: 0, issues: 0, reviews: 0 } };
  if (!octokit) return { ...empty, error: "Set GITHUB_PERSONAL_ACCESS_TOKEN env var" };
  const org = getOrg();

  return cached(`activity:${org ?? "user"}`, async () => {
    const limitErr = checkRateLimit();
    if (limitErr) return { ...empty, error: limitErr };

    try {
      const username = await getAuthenticatedUsername(octokit);
      let res;
      if (org) {
        try {
          res = await octokit.rest.activity.listOrgEventsForAuthenticatedUser({ org, username, per_page: 100 });
        } catch {
          console.warn(`[github] Org events failed for "${org}", falling back to user events`);
          res = await octokit.rest.activity.listEventsForAuthenticatedUser({ username, per_page: 100 });
        }
      } else {
        res = await octokit.rest.activity.listEventsForAuthenticatedUser({ username, per_page: 100 });
      }
      updateRateLimit(res as { headers?: Record<string, string> });

      const rows: ActivityRow[] = res.data.map((e) => ({
        type: e.type?.replace("Event", "") ?? "Unknown",
        repo: (e.repo as { name?: string })?.name?.split("/")[1] ?? "",
        date: e.created_at?.slice(0, 10) ?? "",
      }));

      const summary: ActivitySummary = { total: rows.length, push: 0, pr: 0, issues: 0, reviews: 0 };
      for (const r of rows) {
        if (r.type === "Push") summary.push++;
        else if (r.type === "PullRequest") summary.pr++;
        else if (r.type === "Issues") summary.issues++;
        else if (r.type === "PullRequestReview") summary.reviews++;
      }

      return { rows, summary };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ...empty, error: msg };
    }
  });
}

export interface CommitWeek {
  week: string;
  total: number;
}

export async function getCommitActivity(
  owner: string,
  repo: string,
): Promise<{ rows: CommitWeek[]; error?: string }> {
  const octokit = getOctokit();
  if (!octokit) return { rows: [], error: "Set GITHUB_PERSONAL_ACCESS_TOKEN env var" };

  return cached(`commits:${owner}/${repo}`, async () => {
    const limitErr = checkRateLimit();
    if (limitErr) return { rows: [], error: limitErr };

    try {
      const data = await fetchWithRetry(
        octokit,
        "GET /repos/{owner}/{repo}/stats/commit_activity",
        { owner, repo },
      );

      if (!Array.isArray(data)) return data as { rows: CommitWeek[]; error?: string };

      const rows: CommitWeek[] = data.map((w: { week: number; total: number }) => ({
        week: new Date(w.week * 1000).toISOString().slice(0, 10),
        total: w.total,
      }));

      return { rows };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { rows: [], error: msg };
    }
  });
}

export interface ContributorRow {
  login: string;
  total_commits: number;
}

export async function getContributors(
  owner: string,
  repo: string,
): Promise<{ rows: ContributorRow[]; error?: string }> {
  const octokit = getOctokit();
  if (!octokit) return { rows: [], error: "Set GITHUB_PERSONAL_ACCESS_TOKEN env var" };

  return cached(`contrib:${owner}/${repo}`, async () => {
    const limitErr = checkRateLimit();
    if (limitErr) return { rows: [], error: limitErr };

    try {
      const data = await fetchWithRetry(
        octokit,
        "GET /repos/{owner}/{repo}/stats/contributors",
        { owner, repo },
      );

      if (!Array.isArray(data)) return data as { rows: ContributorRow[]; error?: string };

      const rows: ContributorRow[] = data
        .map((c: { author?: { login?: string }; total?: number }) => ({
          login: c.author?.login ?? "unknown",
          total_commits: c.total ?? 0,
        }))
        .sort((a: ContributorRow, b: ContributorRow) => b.total_commits - a.total_commits)
        .slice(0, 20);

      return { rows };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { rows: [], error: msg };
    }
  });
}
