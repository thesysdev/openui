import { Octokit } from "octokit";
import type {
  RepoRow,
  LanguageRow,
  EventRow,
  CommitWeek,
  StarPoint,
  ContributorRow,
} from "./types";
import {
  getBookmarks,
  saveBookmark,
  deleteBookmark,
} from "../bookmarks/store";

// ── Cache ──────────────────────────────────────────────────────────────────

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && now - entry.ts < CACHE_TTL) return Promise.resolve(entry.data as T);

  // Evict expired entries occasionally
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

/** Clear all cached data (call when switching users) */
export function clearCache() {
  cache.clear();
}

// ── Rate limit tracking ────────────────────────────────────────────────────

let rateLimitRemaining = 60;
let rateLimitReset = 0;

export function getRateLimit() {
  return { remaining: rateLimitRemaining, reset: rateLimitReset };
}

function checkRateLimit(): string | null {
  if (rateLimitRemaining <= 0 && Date.now() / 1000 < rateLimitReset) {
    const mins = Math.ceil((rateLimitReset - Date.now() / 1000) / 60);
    return `GitHub API rate limit exceeded. Try again in ${mins} minute${mins > 1 ? "s" : ""}.`;
  }
  return null;
}

function updateRateLimit(response: any) {
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

// ── Retry for 202 (computing) ──────────────────────────────────────────────

async function fetchWithRetry(
  octokit: Octokit,
  route: string,
  params: Record<string, unknown>,
  retries = 3,
): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    const res = await octokit.request(route, params);
    updateRateLimit(res);
    if (res.status !== 202) return res.data;
    // GitHub is computing stats — wait and retry
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { error: "GitHub is still computing stats. Try again in a moment." };
}

// ── Tool implementations ───────────────────────────────────────────────────

export function createGitHubToolProvider(
  username: string,
): Record<string, (args: Record<string, unknown>) => Promise<unknown>> {
  const octokit = new Octokit();

  // Shared repo data — fetched once, used by get_repos + get_languages
  let repoCache: RepoRow[] | null = null;

  async function fetchRepos(): Promise<RepoRow[]> {
    if (repoCache) return repoCache;

    const limitErr = checkRateLimit();
    if (limitErr) throw new Error(limitErr);

    const res = await octokit.rest.repos.listForUser({
      username,
      per_page: 100,
      sort: "pushed",
    });
    updateRateLimit(res);

    repoCache = res.data.map((r) => ({
      name: r.name,
      full_name: r.full_name,
      description: r.description ?? "",
      language: r.language ?? "",
      stars: r.stargazers_count ?? 0,
      forks: r.forks_count ?? 0,
      size: r.size ?? 0,
      open_issues: r.open_issues_count ?? 0,
      updated_at: r.updated_at?.slice(0, 10) ?? "",
      html_url: r.html_url ?? "",
    }));
    return repoCache;
  }

  return {
    // ── Profile ──────────────────────────────────────────────────────────

    get_profile: () =>
      cached(`profile:${username}`, async () => {
        const empty = { login: "", name: "", bio: "", avatar_url: "", public_repos: 0, followers: 0, following: 0, created_at: "" };
        const limitErr = checkRateLimit();
        if (limitErr) return { ...empty, error: limitErr };

        try {
          const res = await octokit.rest.users.getByUsername({ username });
          updateRateLimit(res);
          const u = res.data;
          return {
            login: u.login,
            name: u.name ?? u.login,
            bio: u.bio ?? "",
            avatar_url: u.avatar_url,
            public_repos: u.public_repos,
            followers: u.followers,
            following: u.following,
            created_at: u.created_at?.slice(0, 10) ?? "",
          };
        } catch (err: any) {
          if (err.status === 404) return { ...empty, error: `User "${username}" not found` };
          return { ...empty, error: err.message ?? "Failed to fetch profile" };
        }
      }),

    // ── Repos ────────────────────────────────────────────────────────────

    get_repos: (args) =>
      cached(`repos:${username}:${JSON.stringify(args)}`, async () => {
        try {
          let rows = await fetchRepos();

          // Client-side language filter
          const lang = args.language as string | undefined;
          if (lang && lang !== "all" && lang !== "") {
            rows = rows.filter(
              (r) => r.language.toLowerCase() === lang.toLowerCase(),
            );
          }

          // Client-side sort
          const sort = (args.sort as string) ?? "stars";
          const sortKey = sort === "forks" ? "forks"
            : sort === "updated" ? "updated_at"
            : sort === "created" ? "updated_at"
            : "stars";
          rows = [...rows].sort((a, b) => {
            const av = (a as any)[sortKey];
            const bv = (b as any)[sortKey];
            if (typeof av === "string") return bv.localeCompare(av);
            return bv - av;
          });

          return { rows };
        } catch (err: any) {
          return { error: err.message, rows: [] };
        }
      }),

    // ── Languages (aggregated) ───────────────────────────────────────────

    get_languages: () =>
      cached(`languages:${username}`, async () => {
        try {
          const repos = await fetchRepos();

          // Quick aggregation from repo language field
          const langMap = new Map<string, { bytes: number; count: number }>();
          for (const r of repos) {
            if (!r.language) continue;
            const entry = langMap.get(r.language) ?? { bytes: 0, count: 0 };
            entry.bytes += r.size * 1024; // size is in KB, convert to bytes approx
            entry.count += 1;
            langMap.set(r.language, entry);
          }

          // Fetch detailed language bytes for top 5 repos (by stars)
          const topRepos = [...repos]
            .sort((a, b) => b.stars - a.stars)
            .slice(0, 5);

          const limitErr = checkRateLimit();
          if (!limitErr) {
            for (const repo of topRepos) {
              try {
                const res = await octokit.rest.repos.listLanguages({
                  owner: username,
                  repo: repo.name,
                });
                updateRateLimit(res);
                for (const [lang, bytes] of Object.entries(res.data)) {
                  const entry = langMap.get(lang) ?? { bytes: 0, count: 0 };
                  entry.bytes = Math.max(entry.bytes, bytes as number);
                  if (!langMap.has(lang)) entry.count = 1;
                  langMap.set(lang, entry);
                }
              } catch {
                // Skip individual repo failures
              }
            }
          }

          const rows: LanguageRow[] = [...langMap.entries()]
            .map(([language, { bytes, count }]) => ({
              language,
              bytes,
              repos_count: count,
            }))
            .sort((a, b) => b.bytes - a.bytes);

          return { rows };
        } catch (err: any) {
          return { error: err.message, rows: [] };
        }
      }),

    // ── Events ───────────────────────────────────────────────────────────

    get_events: () =>
      cached(`events:${username}`, async () => {
        const limitErr = checkRateLimit();
        if (limitErr) return { error: limitErr, rows: [], summary: { total: 0, push: 0, pr: 0, issues: 0, reviews: 0 } };

        try {
          const res = await octokit.rest.activity.listPublicEventsForUser({
            username,
            per_page: 100,
          });
          updateRateLimit(res);

          const rows: EventRow[] = res.data.map((e) => ({
            type: e.type?.replace("Event", "") ?? "Unknown",
            repo: (e.repo as any)?.name?.split("/")[1] ?? e.repo?.name ?? "",
            date: e.created_at?.slice(0, 10) ?? "",
            count: 1,
          }));

          // Build summary
          const summary = { total: rows.length, push: 0, pr: 0, issues: 0, reviews: 0 };
          for (const r of rows) {
            if (r.type === "Push") summary.push++;
            else if (r.type === "PullRequest") summary.pr++;
            else if (r.type === "Issues") summary.issues++;
            else if (r.type === "PullRequestReview") summary.reviews++;
          }

          return { rows, summary };
        } catch (err: any) {
          return { error: err.message, rows: [], summary: { total: 0, push: 0, pr: 0, issues: 0, reviews: 0 } };
        }
      }),

    // ── Commit Activity (per repo) ───────────────────────────────────────

    get_commit_activity: (args) =>
      cached(`commits:${username}:${args.repo}`, async () => {
        const repo = args.repo as string;
        if (!repo) return { error: "repo argument is required", rows: [] };

        const limitErr = checkRateLimit();
        if (limitErr) return { error: limitErr, rows: [] };

        try {
          const data = await fetchWithRetry(
            octokit,
            "GET /repos/{owner}/{repo}/stats/commit_activity",
            { owner: username, repo },
          );

          if (!Array.isArray(data)) return data; // error object

          const rows: CommitWeek[] = data.map(
            (w: { week: number; total: number }) => ({
              week: new Date(w.week * 1000).toISOString().slice(0, 10),
              total: w.total,
            }),
          );

          return { rows };
        } catch (err: any) {
          return { error: err.message, rows: [] };
        }
      }),

    // ── Star History (per repo) ──────────────────────────────────────────

    get_star_history: (args) =>
      cached(`stars:${username}:${args.repo}`, async () => {
        const repo = args.repo as string;
        if (!repo) return { error: "repo argument is required", rows: [] };

        const limitErr = checkRateLimit();
        if (limitErr) return { error: limitErr, rows: [] };

        try {
          const res = await octokit.request(
            "GET /repos/{owner}/{repo}/stargazers",
            {
              owner: username,
              repo,
              per_page: 100,
              headers: { accept: "application/vnd.github.star+json" },
            },
          );
          updateRateLimit(res);

          const stargazers = res.data as Array<{
            starred_at: string;
            user: { login: string };
          }>;

          const rows: StarPoint[] = stargazers.map((s, i) => ({
            starred_at: s.starred_at.slice(0, 10),
            cumulative: i + 1,
          }));

          return { rows };
        } catch (err: any) {
          return { error: err.message, rows: [] };
        }
      }),

    // ── Contributors (per repo) ──────────────────────────────────────────

    get_contributors: (args) =>
      cached(`contrib:${username}:${args.repo}`, async () => {
        const repo = args.repo as string;
        if (!repo) return { error: "repo argument is required", rows: [] };

        const limitErr = checkRateLimit();
        if (limitErr) return { error: limitErr, rows: [] };

        try {
          const data = await fetchWithRetry(
            octokit,
            "GET /repos/{owner}/{repo}/stats/contributors",
            { owner: username, repo },
          );

          if (!Array.isArray(data)) return data;

          const rows: ContributorRow[] = data
            .map((c: any) => ({
              login: c.author?.login ?? "unknown",
              avatar_url: c.author?.avatar_url ?? "",
              total_commits: c.total ?? 0,
            }))
            .sort((a: ContributorRow, b: ContributorRow) => b.total_commits - a.total_commits)
            .slice(0, 20);

          return { rows };
        } catch (err: any) {
          return { error: err.message, rows: [] };
        }
      }),

    // ── Bookmarks (localStorage) ─────────────────────────────────────────

    save_bookmark: async (args) => {
      const repo = args.repo as string;
      if (!repo) return { error: "repo argument is required" };
      const bookmark = saveBookmark(
        username,
        repo,
        args.note as string | undefined,
        args.tag as string | undefined,
      );
      return { success: true, bookmark };
    },

    get_bookmarks: async () => {
      return { rows: getBookmarks(username) };
    },

    delete_bookmark: async (args) => {
      const repo = args.repo as string;
      if (!repo) return { error: "repo argument is required" };
      return deleteBookmark(username, repo);
    },
  };
}
