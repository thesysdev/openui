import { requests, TOOLS } from "@/lib/tools";

export const runtime = "nodejs";

// Query() and Mutation() calls from the rendered screen, answered in MCP's result shape.
export async function POST(request: Request) {
  const { requestId, name, args } = (await request.json()) as {
    requestId: string;
    name: string;
    args?: Record<string, unknown>;
  };
  const ctx = requests.get(requestId);
  const tool = TOOLS.find((t) => t.name === name);
  try {
    if (!ctx || !tool) throw new Error(`Unknown request or tool ${name}`);
    return Response.json({ content: [], structuredContent: tool.run(ctx, args ?? {}) });
  } catch (error) {
    return Response.json({
      isError: true,
      content: [{ type: "text", text: (error as Error).message }],
    });
  }
}
