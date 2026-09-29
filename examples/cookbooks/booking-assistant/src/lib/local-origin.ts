// This example has no authentication, so its routes accept browser requests only from its own
// local page. Add authentication and rate limits before deploying it.
export function rejectOtherOrigins(request: Request): Response | undefined {
  const { port } = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== `http://127.0.0.1:${port}` && origin !== `http://localhost:${port}`)
    return Response.json(
      { error: "This example only accepts requests from its local chat interface." },
      { status: 403 },
    );
}
