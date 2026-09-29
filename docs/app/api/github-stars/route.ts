import {
  GITHUB_STAR_FALLBACK,
  OPENUI_GITHUB_REPOSITORY,
  readGitHubStarCount,
  type GitHubStarsResponse,
} from "@/lib/github-stars";

const GITHUB_API_URL = `https://api.github.com/repos/${OPENUI_GITHUB_REPOSITORY}`;
const CACHE_CONTROL = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

function json(body: GitHubStarsResponse): Response {
  return Response.json(body, { headers: { "Cache-Control": CACHE_CONTROL } });
}

export async function GET(): Promise<Response> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(GITHUB_API_URL, {
      headers,
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return json({ stars: GITHUB_STAR_FALLBACK, source: "fallback" });

    const stars = readGitHubStarCount(await response.json());
    if (stars === null) return json({ stars: GITHUB_STAR_FALLBACK, source: "fallback" });

    return json({ stars, source: "github" });
  } catch {
    return json({ stars: GITHUB_STAR_FALLBACK, source: "fallback" });
  }
}
