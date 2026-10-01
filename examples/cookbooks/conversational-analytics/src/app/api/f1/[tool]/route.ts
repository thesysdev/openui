import { runF1Tool } from "../../../../lib/f1/tools";
import { isOwnOrigin } from "../../../../lib/same-origin";

export const runtime = "nodejs";

// Door B of the F1 tool registry: the same tools the chat's function-tool loop runs, called by
// the browser. The F1 charts and dashboards fetch their rows here, so the model only names a
// chart (session, drivers, title) and the numbers never pass through it.
// POST /api/f1/get_gaps with the tool's JSON arguments.
export async function POST(request: Request, { params }: { params: Promise<{ tool: string }> }) {
  // Like the chat route, this example has no authentication: accept only its own local page.
  if (!isOwnOrigin(request))
    return Response.json({ error: "This example only accepts requests from its local pages." }, { status: 403 });
  const { tool } = await params;
  let args: unknown = {};
  try {
    const text = await request.text();
    if (text.length > 20_000) throw new Error("too large");
    args = text.trim() ? JSON.parse(text) : {};
  } catch {
    return Response.json({ error: "Send the tool arguments as a JSON object." }, { status: 400 });
  }
  try {
    return Response.json(await runF1Tool(tool, args, { signal: request.signal }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Unknown F1 tool") ? 404 : error instanceof RangeError ? 400 : 502;
    return Response.json({ error: message }, { status });
  }
}
