export const runtime = "nodejs";

// Mints the short-lived frontend token that useOpenuiCloudStorage() sends with its
// Conversations API calls. Gateway scopes the token to one user and app, so the browser
// reaches only those threads and never sees THESYS_API_KEY.
export async function POST(request: Request) {
  // This example has no authentication, so it accepts browser requests only from its own
  // local page. Add authentication and rate limits before deploying it.
  const { port } = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== `http://127.0.0.1:${port}` && origin !== `http://localhost:${port}`)
    return Response.json(
      { error: "This example only accepts requests from its local chat interface." },
      { status: 403 },
    );
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
    body: JSON.stringify({
      // There is no sign-in, so every browser shares one local user, as in apps from
      // `openui create`. Use the signed-in user's id instead when you add authentication:
      // https://www.openui.com/docs/gateway/authentication
      user_id: process.env.DEMO_USER_ID || "demo-user",
      // Keeps this example's threads apart from other apps that use the same key.
      app_id: process.env.APP_ID || "booking-assistant-cookbook",
    }),
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
