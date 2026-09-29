import { rejectOtherOrigins } from "../../../lib/local-origin";

export const runtime = "nodejs";

// This example has no sign-in, so every browser shares one local user. Use the signed-in
// user's id instead when you add authentication.
const userId = "local-demo";
// Keeps this example's threads apart from other apps that use the same key.
const appId = "booking-assistant-cookbook";

// Mints the short-lived frontend token that useOpenuiCloudStorage() sends with its
// Conversations API calls. Gateway scopes the token to one user and app, so the browser
// reaches only those threads and never sees THESYS_API_KEY.
export async function POST(request: Request) {
  const denied = rejectOtherOrigins(request);
  if (denied) return denied;
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey)
    return Response.json(
      {
        error:
          "Configure THESYS_API_KEY privately in .env.local and restart to use OpenUI Gateway.",
      },
      { status: 503 },
    );

  const upstream = await fetch("https://api.thesys.dev/v1/frontend-tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ user_id: userId, app_id: appId }),
    cache: "no-store",
    signal: request.signal,
  }).catch(() => undefined);
  if (!upstream?.ok)
    return Response.json(
      { error: "OpenUI Gateway could not create a frontend token." },
      { status: upstream?.status ?? 502 },
    );
  const { token, expires_at } = (await upstream.json()) as { token: string; expires_at: number };
  return Response.json(
    { token, expires_at },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
