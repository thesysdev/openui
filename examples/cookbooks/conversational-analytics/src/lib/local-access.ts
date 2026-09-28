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
