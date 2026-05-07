/**
 * PostHog API bridge — queries PostHog analytics via the Query API.
 *
 * Requires env vars:
 *   POSTHOG_API_KEY      — personal API key (scope: insight:read)
 *   POSTHOG_PROJECT_ID   — numeric project ID (from project settings)
 *   POSTHOG_HOST         — API host (default: https://us.posthog.com)
 *
 * Gracefully degrades: returns an error object if credentials are missing.
 */

function getConfig() {
  const apiKey = process.env.POSTHOG_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const host = (process.env.POSTHOG_HOST || "https://us.posthog.com").replace(/\/$/, "");
  return { apiKey, projectId, host };
}

export async function posthogQuery(query: Record<string, unknown>): Promise<unknown> {
  const { apiKey, projectId, host } = getConfig();
  if (!apiKey || !projectId) {
    return { error: "PostHog not configured — set POSTHOG_API_KEY and POSTHOG_PROJECT_ID env vars" };
  }

  try {
    const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[posthog] Query failed (${res.status}):`, text.slice(0, 500));
      return { error: `PostHog API ${res.status}: ${text.slice(0, 200)}` };
    }

    return await res.json();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[posthog] Request failed:", msg);
    return { error: `PostHog request failed: ${msg}` };
  }
}
