import { z } from "zod/v4";

const tokenSchema = z.object({ token: z.string().min(1), expires_at: z.number() });
const pageSchema = z.object({
  data: z.array(z.object({ id: z.string() })),
  has_more: z.boolean(),
  last_id: z.string().optional(),
});

// A stable, server-owned identity for this loopback-only, single-user example.
// Replace this boundary with authentication before deploying the app.
export function localDemoAccess(request: Request): Response | undefined {
  const url = new URL(request.url);
  // Next.js can normalize request.url to localhost even when the browser uses 127.0.0.1.
  const host = request.headers.get("host") || url.host;
  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  const hostName = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
  const origin = request.headers.get("origin");
  if (
    process.env.NODE_ENV === "production" ||
    !localHosts.has(url.hostname) ||
    !localHosts.has(hostName) ||
    (origin && origin !== `${url.protocol}//${host}`) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return Response.json(
      { error: "This example uses a local demo identity. Add authentication before deployment." },
      { status: 403 },
    );
  }
}

export async function mintFrontendToken(signal?: AbortSignal) {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("Configure THESYS_API_KEY privately in .env.local and restart.");
  const response = await fetch("https://api.thesys.dev/v1/frontend-tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      user_id: process.env.DEMO_USER_ID || "local-demo",
      app_id: process.env.APP_ID || "conversational-analytics-cookbook",
    }),
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Unable to connect to Cloud conversation storage.");
  return tokenSchema.parse(await response.json());
}

// Use the same token-scoped list API and cursor contract as Cloud storage.
// Never authorize a browser-supplied conversation id with the master key alone.
export async function ownsConversation(threadId: string, signal?: AbortSignal) {
  const { token } = await mintFrontendToken(signal);
  let after: string | undefined;
  for (let page = 0; page < 50; page++) {
    const query = new URLSearchParams({ limit: "100" });
    if (after) query.set("after", after);
    const response = await fetch(`https://api.thesys.dev/v1/conversations?${query}`, {
      headers: { "x-thesys-frontend-token": token },
      cache: "no-store",
      signal,
    });
    if (!response.ok) throw new Error("Unable to verify Cloud conversation access.");
    const result = pageSchema.parse(await response.json());
    if (result.data.some((conversation) => conversation.id === threadId)) return true;
    if (!result.has_more) return false;
    if (!result.last_id || result.last_id === after)
      throw new Error("Cloud returned an invalid conversation cursor.");
    after = result.last_id;
  }
  throw new Error("Conversation lookup exceeded the demo's page limit.");
}
