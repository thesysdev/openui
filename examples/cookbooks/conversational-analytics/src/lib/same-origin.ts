// These routes have no authentication, so they accept browser requests only from this app's own
// pages: the local dev server, or the host the app is served from when deployed.
export function isOwnOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const { port } = new URL(request.url);
  if (origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return host !== null && new URL(origin).host === host;
}
