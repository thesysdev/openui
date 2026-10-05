import { toolExecutor } from "@/server/tools";
import { ToolExecutionError } from "@openuidev/server";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const result = await toolExecutor().execute(input, { signal: request.signal });
    return Response.json({ result });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Tool execution failed" },
      { status: error instanceof ToolExecutionError ? (error.status ?? 400) : 500 },
    );
  }
}
